import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ragHandler } from '../rag-handler';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class ConversationMemory {
    constructor(windowSize = 3) {
        this.messages = [];
        this.windowSize = windowSize;
    }

    addMessage(role, content) {
        this.messages.push({ role, content });
        if (this.messages.length > this.windowSize * 2) {
            this.messages = this.messages.slice(-this.windowSize * 2);
        }
    }

    getMessages() {
        return this.messages;
    }
}

export const memory = new ConversationMemory();

export const CHAT_PROMPT = `You are an expert assistant in ServiceNow Xanadu Release Notes and Documentation. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Chat History:
{chatHistory}

Question: {question}

Please provide your response in the following format:

1. Direct Answer: 
[Provide a clear, concise answer directly addressing the question]

2. From the Documentation:
[Quote or summarize relevant information from the provided context]

3. Additional Details:
[Provide any important context, examples, code snippets, or clarifications]

4. Related Documentation:
[List 2-3 related topics from the Xanadu documentation that might be helpful]

Format your response using markdown for better readability.
Use bullet points and code blocks where appropriate.
If showing technical steps, number them clearly.

Answer:`;

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

    // Get relevant documents
    const relevantDocs = await ragHandler.getRelevantDocuments(message);
    const context = relevantDocs.map(doc => doc.content).join('\n\n');

    // Get conversation history
    const chatHistory = memory.getMessages();

    // Create completion with context and history
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: CHAT_PROMPT },
        ...chatHistory,
        { 
          role: "user", 
          content: `Context: ${context}\n\nQuestion: ${message}` 
        }
      ],
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

    // Update memory
    memory.addMessage("user", message);
    memory.addMessage("assistant", responseText);

    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 