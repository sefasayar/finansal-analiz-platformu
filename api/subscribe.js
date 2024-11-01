// api/subscribe.js

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Only POST requests allowed' });
        return;
    }

    const { userId, planId } = req.body;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{ user_id: userId, plan_id: planId }]);

    if (error) {
        res.status(500).json({ message: error.message });
        return;
    }

    res.status(200).json({ message: 'Abonelik başarıyla alındı', data });
}
