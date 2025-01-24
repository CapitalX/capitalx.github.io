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

  try {
    // Check usage first
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (usageData?.count >= 3) {
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
        date: new Date().toISOString().split('T')[0],
        count: (usageData?.count || 0) + 1
      });

    return res.status(200).json({ 
      response: completion.data.choices[0].message.content 
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 