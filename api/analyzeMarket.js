// api/analyzeMarket.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Sentiment from 'sentiment';
import { RSI } from 'technicalindicators';

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Sentiment analizi için kütüphane
const sentiment = new Sentiment();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ message: 'Symbol is required' });
    }

    // Alpha Vantage API'sinden veri çekme
    const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const alphaUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${alphaVantageApiKey}`;

    try {
        const alphaResponse = await fetch(alphaUrl);
        if (!alphaResponse.ok) {
            throw new Error(`Alpha Vantage API error: ${alphaResponse.statusText}`);
        }

        const alphaData = await alphaResponse.json();

        if (alphaData['Error Message']) {
            return res.status(400).json({ message: 'Invalid symbol' });
        }

        const timeSeries = alphaData['Time Series (Daily)'];
        if (!timeSeries) {
            return res.status(400).json({ message: 'Invalid data format from Alpha Vantage' });
        }

        // Supabase'te hisse senedini alma veya ekleme
        let { data: stock, error: stockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('symbol', symbol)
            .single();

        if (stockError && stockError.code === 'PGRST116') { // Not found
            const { data: newStock, error: newStockError } = await supabase
                .from('stocks')
                .insert([{ symbol: symbol, name: symbol }])
                .select()
                .single();

            if (newStockError) {
                throw newStockError;
            }

            stock = newStock;
        } else if (stockError) {
            throw stockError;
        }

        // Hisse senedi fiyat verilerini ekleme
        const prices = Object.keys(timeSeries).map(date => ({
            stock_id: stock.id,
            date: date,
            open: parseFloat(timeSeries[date]['1. open']),
            high: parseFloat(timeSeries[date]['2. high']),
            low: parseFloat(timeSeries[date]['3. low']),
            close: parseFloat(timeSeries[date]['4. close']),
            volume: parseInt(timeSeries[date]['6. volume'], 10),
        }));

        // Hisse fiyatlarını Supabase'e ekleme (çakışmaları ignore et)
        const { error: insertError } = await supabase
            .from('stock_prices')
            .insert(prices)
            .onConflict(['stock_id', 'date'])
            .ignore();

        if (insertError) {
            throw insertError;
        }

        // Teknik analiz: RSI hesaplama
        const closePrices = prices.map(price => price.close).reverse(); // Tarih sırasını düzeltme
        const rsiInput = {
            values: closePrices,
            period: 14,
        };
        const rsiValues = RSI.calculate(rsiInput);
        const latestRSI = rsiValues[rsiValues.length - 1];

        // News API'sinden ekonomi haberlerini çekme
        const newsApiKey = process.env.NEWS_API_KEY;
        const newsUrl = `https://newsapi.org/v2/everything?q=${symbol}&apiKey=${newsApiKey}&pageSize=10`;
        const newsResponse = await fetch(newsUrl);
        if (!newsResponse.ok) {
            throw new Error(`News API error: ${newsResponse.statusText}`);
        }

        const newsData = await newsResponse.json();
        let newsSentimentScore = 0;
        if (newsData.articles) {
            newsSentimentScore = newsData.articles.reduce((acc, article) => {
                const text = (article.title || '') + ' ' + (article.description || '');
                const result = sentiment.analyze(text);
                return acc + result.score;
            }, 0) / newsData.articles.length;
        }

        // Toplam duygu skoru
        const totalSentimentScore = newsSentimentScore; // Sadece NewsAPI'den gelen duygu skoru

        // RSI ve duygu skoruna göre öneri hesaplama
        let recommendation = 'Hold';
        if (latestRSI < 30 && totalSentimentScore > 0) {
            recommendation = 'Strong Buy';
        } else if (latestRSI < 30) {
            recommendation = 'Buy';
        } else if (latestRSI > 70 && totalSentimentScore < 0) {
            recommendation = 'Strong Sell';
        } else if (latestRSI > 70) {
            recommendation = 'Sell';
        }

        // Sonuçları Supabase'e kaydetme
        const analysisDate = new Date().toISOString().split('T')[0];
        const { data: analysisData, error: analysisError } = await supabase
            .from('stock_analysis')
            .upsert([
                {
                    stock_id: stock.id,
                    date: analysisDate,
                    rsi: latestRSI,
                    sentiment_score: totalSentimentScore,
                    recommendation: recommendation
                }
            ]);

        if (analysisError) {
            throw analysisError;
        }

        // Analiz sonucunu frontend'e gönderme
        res.status(200).json({
            message: 'Data fetched and analyzed successfully',
            symbol: symbol,
            recommendation: recommendation,
            rsi: latestRSI,
            sentiment_score: totalSentimentScore
        });
    } catch (error) {
        console.error('Error fetching or processing data:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
