// backend/api/webhook.js

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      const planId = session.metadata.planId;
      const stripeSessionId = session.id;

      // Abonelik veritabanına kaydetme veya güncelleme
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert([
          {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            subscribed_at: new Date(),
            stripe_session_id: stripeSessionId,
          },
        ]);

      if (error) {
        console.error('Abonelik Ekleme/Güncelleme Hatası:', error.message);
        return res.status(500).send('Internal Server Error');
      }

      console.log('Subscription updated for user:', userId);
      break;

    // Diğer event türlerini burada işleyebilirsiniz

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}
