import dotenv from 'dotenv';
dotenv.config();

// api/analyzeMarket.js

import { createClient } from '@supabase/supabase-js';
// 'node-fetch' importunu kaldırdık

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Alpha Vantage API anahtarı
const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { market } = req.query;

    if (!market) {
        return res.status(400).json({ message: 'Market is required' });
    }

    try {
        // Paketlere göre sembolleri al
        const symbols = await getSymbolsForPackage(market);

        if (symbols.length === 0) {
            return res.status(400).json({ message: 'No symbols found for the selected market' });
        }

        const analysisResults = [];

        for (const symbol of symbols) {
            // Alpha Vantage API'sinden veri çekme
            const alphaUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${alphaVantageApiKey}`;
            const alphaResponse = await fetch(alphaUrl);
            if (!alphaResponse.ok) {
                console.error(`Alpha Vantage API error for ${symbol}: ${alphaResponse.statusText}`);
                continue; // Diğer sembollere geç
            }

            const alphaData = await alphaResponse.json();

            if (alphaData['Error Message'] || !alphaData['Time Series (Daily)']) {
                console.error(`Invalid data from Alpha Vantage for ${symbol}`);
                continue;
            }

            const timeSeries = alphaData['Time Series (Daily)'];

            // Fiyat verilerini hazırlama
            const prices = Object.keys(timeSeries).map(date => ({
                date: date,
                open: parseFloat(timeSeries[date]['1. open']),
                high: parseFloat(timeSeries[date]['2. high']),
                low: parseFloat(timeSeries[date]['3. low']),
                close: parseFloat(timeSeries[date]['4. close']),
                volume: parseInt(timeSeries[date]['6. volume'], 10),
            })).reverse(); // Tarih sırasını düzeltme

            // Teknik göstergeleri hesaplama
            const closePrices = prices.map(price => price.close);

            // Hareketli Ortalamalar
            const ma50 = SMA.calculate({ period: 50, values: closePrices });
            const ma200 = SMA.calculate({ period: 200, values: closePrices });

            // MACD
            const macdInput = {
                values: closePrices,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            };
            const macdValues = MACD.calculate(macdInput);

            // RSI
            const rsiValues = RSI.calculate({ values: closePrices, period: 14 });

            // En son göstergeleri alma
            const latestMA50 = ma50[ma50.length - 1];
            const latestMA200 = ma200[ma200.length - 1];
            const latestMACD = macdValues[macdValues.length - 1];
            const latestRSI = rsiValues[rsiValues.length - 1];

            // Sinyal üretme
            let signal = 'Hold';
            let signalsList = [];

            // MA sinyali
            if (latestMA50 > latestMA200) {
                signalsList.push('Buy');
            } else if (latestMA50 < latestMA200) {
                signalsList.push('Sell');
            }

            // MACD sinyali
            if (latestMACD.MACD > latestMACD.signal) {
                signalsList.push('Buy');
            } else if (latestMACD.MACD < latestMACD.signal) {
                signalsList.push('Sell');
            }

            // RSI sinyali
            if (latestRSI < 30) {
                signalsList.push('Buy');
            } else if (latestRSI > 70) {
                signalsList.push('Sell');
            }

            // Sinyallerin kombinasyonu
            const buySignals = signalsList.filter(s => s === 'Buy').length;
            const sellSignals = signalsList.filter(s => s === 'Sell').length;

            if (buySignals > sellSignals && buySignals >= 2) {
                signal = 'Buy';
            } else if (sellSignals > buySignals && sellSignals >= 2) {
                signal = 'Sell';
            }

            // Sonuçları depolama
            analysisResults.push({
                symbol: symbol,
                date: prices[prices.length - 1].date,
                signal: signal,
                rsi: latestRSI,
                macd: latestMACD.MACD,
                textual_analysis: `${symbol} için en son sinyal: ${signal}. RSI değeri: ${latestRSI.toFixed(2)}. MACD değeri: ${latestMACD.MACD.toFixed(5)}.`
            });

            // Supabase'e kaydetme
            await supabase
                .from('signals')
                .upsert({
                    symbol: symbol,
                    package: market,
                    date: prices[prices.length - 1].date,
                    signal: signal,
                    rsi: latestRSI,
                    macd: latestMACD.MACD,
                    textual_analysis: `${symbol} için en son sinyal: ${signal}. RSI değeri: ${latestRSI.toFixed(2)}. MACD değeri: ${latestMACD.MACD.toFixed(5)}.`,
                });
        }

        res.status(200).json({
            message: 'Data fetched and analyzed successfully',
            market: market,
            analysis: analysisResults
        });

    } catch (error) {
        console.error('Error in analyzeMarket:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Paketlere göre sembolleri getiren fonksiyonlar
async function getSymbolsForPackage(packageName) {
    let symbols = [];
    if (packageName === 'Forex + Hisse Senedi') {
        const forexSymbols = getMostTradedForexSymbols();
        const stockSymbols = getMostTradedStockSymbols();
        symbols = forexSymbols.concat(stockSymbols);
    } else if (packageName === 'Profesyonel Vadeli İşlemler') {
        symbols = getMostTradedFuturesSymbols();
    } else if (packageName === 'Kripto Özel') {
        symbols = getMostTradedCryptoSymbols();
    }
    return symbols;
}

function getMostTradedForexSymbols() {
    return ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD',
            'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
}

function getMostTradedStockSymbols() {
    // Alpha Vantage için 'BRK.B' sembolünü kullanmalısınız
    return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
            'META', 'NVDA', 'BRK.B', 'JPM', 'JNJ'];
}

function getMostTradedFuturesSymbols() {
    return ['GC=F',  // Altın
            'CL=F',  // Ham Petrol
            'ES=F',  // S&P 500 Futures
            'NQ=F',  // Nasdaq 100 Futures
            'YM=F',  // Dow Jones Futures
            'RTY=F', // Russell 2000 Futures
            'ZC=F',  // Mısır
            'ZS=F',  // Soya Fasulyesi
            'KE=F',  // Buğday
            'NG=F']; // Doğal Gaz
}

function getMostTradedCryptoSymbols() {
    return ['BTC-USD', 'ETH-USD', 'BNB-USD', 'USDT-USD', 'XRP-USD',
            'ADA-USD', 'SOL-USD', 'DOGE-USD', 'DOT-USD', 'MATIC-USD'];
}
