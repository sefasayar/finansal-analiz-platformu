// api/analyzeMarket.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { RSI } from 'technicalindicators';

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Finnhub API anahtarı
const finnhubApiKey = process.env.FINNHUB_API_KEY;

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
        // Seçilen piyasanın ID'sini alma
        const { data: marketData, error: marketError } = await supabase
            .from('markets')
            .select('*')
            .eq('name', market)
            .single();

        if (marketError) {
            throw marketError;
        }

        // Piyasa içerisindeki pariteleri alma
        const { data: pairs, error: pairsError } = await supabase
            .from('pairs')
            .select('*')
            .eq('market_id', marketData.id);

        if (pairsError) {
            throw pairsError;
        }

        if (pairs.length === 0) {
            return res.status(400).json({ message: 'No pairs found for the selected market' });
        }

        const analysisResults = [];

        for (const pair of pairs) {
            const symbol = pair.symbol;

            // Alpha Vantage API'sinden veri çekme
            const alphaUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${alphaVantageApiKey}`;
            const alphaResponse = await fetch(alphaUrl);
            if (!alphaResponse.ok) {
                console.error(`Alpha Vantage API error for ${symbol}: ${alphaResponse.statusText}`);
                continue; // Diğer paritelere geç
            }

            const alphaData = await alphaResponse.json();

            if (alphaData['Error Message'] || !alphaData['Time Series (Daily)']) {
                console.error(`Invalid data from Alpha Vantage for ${symbol}`);
                continue;
            }

            const timeSeries = alphaData['Time Series (Daily)'];

            // Fiyat verilerini hazırlama
            const prices = Object.keys(timeSeries).map(date => ({
                pair_id: pair.id,
                date: date,
                open: parseFloat(timeSeries[date]['1. open']),
                high: parseFloat(timeSeries[date]['2. high']),
                low: parseFloat(timeSeries[date]['3. low']),
                close: parseFloat(timeSeries[date]['4. close']),
                volume: parseInt(timeSeries[date]['6. volume'], 10),
            }));

            // Supabase'e fiyat verilerini ekleme (çakışmaları ignore et)
            const { error: insertError } = await supabase
                .from('pair_prices')
                .insert(prices)
                .onConflict(['pair_id', 'date'])
                .ignore();

            if (insertError) {
                console.error(`Error inserting prices for ${symbol}: ${insertError.message}`);
                continue;
            }

            // Teknik analiz: RSI hesaplama
            const closePrices = prices.map(price => price.close).reverse(); // Tarih sırasını düzeltme
            const rsiInput = {
                values: closePrices,
                period: 14,
            };
            const rsiValues = RSI.calculate(rsiInput);
            const latestRSI = rsiValues[rsiValues.length - 1];

            // Finnhub API'sinden sosyal duygu analizi yapma
            const finnhubUrl = `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${finnhubApiKey}`;
            const finnhubResponse = await fetch(finnhubUrl);
            if (!finnhubResponse.ok) {
                console.error(`Finnhub API error for ${symbol}: ${finnhubResponse.statusText}`);
                continue;
            }

            const finnhubData = await finnhubResponse.json();
            const finnhubSentiment = finnhubData?.sentiment || 0; // Finnhub'dan alınan sentiment skoru

            // RSI ve duygu skoruna göre öneri hesaplama
            let recommendation = 'Hold';
            if (latestRSI < 30 && finnhubSentiment > 0) {
                recommendation = 'Strong Buy';
            } else if (latestRSI < 30) {
                recommendation = 'Buy';
            } else if (latestRSI > 70 && finnhubSentiment < 0) {
                recommendation = 'Strong Sell';
            } else if (latestRSI > 70) {
                recommendation = 'Sell';
            }

            // Sonuçları Supabase'e kaydetme
            const analysisDate = new Date().toISOString().split('T')[0];
            const { data: analysisData, error: analysisError } = await supabase
                .from('pair_analysis')
                .upsert([
                    {
                        pair_id: pair.id,
                        date: analysisDate,
                        rsi: latestRSI,
                        sentiment_score: finnhubSentiment,
                        recommendation: recommendation
                    }
                ]);

            if (analysisError) {
                console.error(`Error upserting analysis for ${symbol}: ${analysisError.message}`);
                continue;
            }

            // Analiz sonucunu depolama
            analysisResults.push({
                symbol: symbol,
                recommendation: recommendation,
                rsi: latestRSI,
                sentiment_score: finnhubSentiment
            });
        }

        // Sonuçları frontend'e gönderme
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
