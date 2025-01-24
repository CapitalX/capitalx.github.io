import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('API Request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, userId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  console.log('Processing request:', { action, userId });

  try {
    switch (action) {
      case 'check':
        console.log('Checking usage for user:', userId);
        const { data: usageData, error: usageError } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', userId)
          .eq('date', today);

        console.log('Supabase response:', { usageData, usageError });

        if (usageError || !usageData || usageData.length === 0) {
          console.log('No usage records found, returning max limit');
          return res.status(200).json({ remaining: 3 });
        }

        const currentCount = usageData[0]?.count || 0;
        console.log('Current usage count:', currentCount);
        return res.status(200).json({ remaining: 3 - currentCount });

      case 'increment':
        const { error: incrementError } = await supabase
          .from('usage_tracking')
          .upsert({
            user_id: userId,
            date: today,
            count: 1
          });

        if (incrementError) throw incrementError;
        return res.status(200).json({ message: 'Usage incremented' });

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('API error details:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
} 