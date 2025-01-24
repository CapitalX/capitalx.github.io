import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Update CORS headers to allow requests from all Vercel deployments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    switch (action) {
      case 'check':
        const { data: usageData, error: usageError } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (usageError && usageError.code !== 'PGNF') {
          throw usageError;
        }

        const currentCount = usageData?.count || 0;
        return res.status(200).json({ remaining: 3 - currentCount });

      case 'increment':
        const { error: incrementError } = await supabase
          .from('usage_tracking')
          .upsert({
            user_id: userId,
            date: today,
            count: 1
          }, {
            onConflict: 'user_id,date',
            count: 'count + 1'
          });

        if (incrementError) throw incrementError;
        return res.status(200).json({ message: 'Usage incremented' });

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}