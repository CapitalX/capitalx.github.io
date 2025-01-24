import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, token } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check usage first
    const { data: usageData, error: usageError } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('token', token)
      .single();

    if (usageError) throw usageError;
    if (usageData?.count >= 3) {
      return res.status(429).json({ message: 'Daily limit exceeded' });
    }

    // Store conversation in Supabase
    const { data: chatData } = await supabase
      .from('chat_history')
      .insert({
        token,
        message,
        date: today
      })
      .select()
      .single();

    // Stream OpenAI response
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // Update usage count after successful response
    await supabase
      .from('daily_usage')
      .upsert({
        token,
        count: (usageData?.count || 0) + 1,
        last_used: new Date().toISOString()
      });

    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 