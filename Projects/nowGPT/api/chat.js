import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check usage first
    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today);

    // If no records or error, treat as first usage
    if (usageError || !usageData || usageData.length === 0) {
      const count = 0;
      if (count >= 3) {
        return res.status(429).json({ message: 'Daily limit exceeded' });
      }
    } else if (usageData[0].count >= 3) {
      return res.status(429).json({ message: 'Daily limit exceeded' });
    }

    // Call OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    // Increment usage
    await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        date: today,
        count: ((usageData && usageData[0]?.count) || 0) + 1
      });

    return res.status(200).json({ 
      response: completion.data.choices[0].message.content 
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 