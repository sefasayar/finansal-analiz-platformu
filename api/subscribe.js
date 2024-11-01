// api/subscribe.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userId, planId } = req.body;

    // Supabase service role key'inizi güvenli bir şekilde alın
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{ user_id: userId, plan_id: planId }]);

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({ message: 'Abonelik başarıyla alındı', data });
}
