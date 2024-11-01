// api/fetchStockData.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { symbol } = req.body;

    if (!symbol) {
        return res.status(400).json({ message: 'Symbol is required' });
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data['Error Message']) {
            return res.status(400).json({ message: 'Invalid symbol' });
        }

        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        // Hisse senedi bilgilerini ekleme veya alma
        let { data: stockData, error: stockError } = await supabase
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

            stockData = newStock;
        } else if (stockError) {
            throw stockError;
        }

        // Fiyat verilerini ekleme
        const prices = Object.keys(timeSeries).map(date => ({
            stock_id: stockData.id,
            date: date,
            open: timeSeries[date]['1. open'],
            high: timeSeries[date]['2. high'],
            low: timeSeries[date]['3. low'],
            close: timeSeries[date]['4. close'],
            volume: timeSeries[date]['6. volume'],
        }));

        const { error: insertError } = await supabase
            .from('stock_prices')
            .insert(prices)
            .onConflict(['stock_id', 'date'])
            .ignore();

        if (insertError) {
            throw insertError;
        }

        res.status(200).json({ message: 'Data fetched and stored successfully' });
    } catch (error) {
        console.error('Error fetching or storing data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
