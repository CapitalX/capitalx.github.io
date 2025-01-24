import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Add initial startup log
console.log('API handler initializing...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Log environment check
console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
});

function generateDailyToken(ip, secret) {
  const date = new Date().toISOString().split('T')[0];
  return createHash('sha256')
    .update(`${ip}-${date}-${secret}`)
    .digest('hex')
    .substring(0, 16);
}

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress;
             
  const dailyToken = generateDailyToken(ip, process.env.TOKEN_SECRET);

  // Log every incoming request
  console.log('=== New Request ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

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
  console.log('Processing request:', { action, userId, today });

  try {
    switch (action) {
      case 'check':
        console.log('Checking usage for user:', userId);
        const { data: usageData, error: usageError } = await supabase
          .from('daily_usage')
          .select('count')
          .eq('token', dailyToken)
          .single();

        console.log('Supabase query result:', { usageData, usageError });

        if (usageError || !usageData) {
          console.log('No usage records found, returning max limit');
          return res.status(200).json({ 
            remaining: 3,
            token: dailyToken 
          });
        }

        const currentCount = usageData.count || 0;
        console.log('Current usage count:', currentCount);
        
        const response = { 
          remaining: 3 - currentCount,
          token: dailyToken 
        };
        console.log('Sending response:', response);
        return res.status(200).json(response);

      case 'increment':
        const { error: incrementError } = await supabase
          .from('daily_usage')
          .upsert({
            token: dailyToken,
            count: 1,
            last_used: new Date().toISOString()
          }, {
            onConflict: 'token',
            count: 'count + 1'
          });

        if (incrementError) throw incrementError;
        return res.status(200).json({ message: 'Usage incremented' });

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('API error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
} 