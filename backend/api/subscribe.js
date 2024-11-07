// backend/api/subscribe.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { userId, planId } = req.body;

  if (!userId || !planId) {
    return res.status(400).json({ message: 'userId and planId are required' });
  }

  try {
    // Stripe Checkout Session oluşturma
    const response = await fetch(`${process.env.BACKEND_URL}/api/createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Stripe session');
    }

    res.status(200).json({ sessionUrl: data.sessionUrl });
  } catch (error) {
    console.error('Error in subscribeUser:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
