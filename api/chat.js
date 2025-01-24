import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { ragHandler } from "./rag-handler";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export const CHAT_PROMPT = `You are a friendly and helpful ServiceNow expert assistant, focused on the Xanadu Release. Your goal is to provide clear, accurate information based on the documentation provided.

When responding:
- Be concise and direct
- Use bullet points for clarity
- Include relevant code examples when applicable
- Highlight important information using markdown

Context:
{context}

Chat History:
{chatHistory}

Question: {question}

Structure your response as follows:

💡 **Quick Answer:**
[Provide a brief, direct answer to the question]

📚 **Details:**
[Expand on the answer with relevant details, examples, or steps]

🔍 **Source:**
[Reference specific documentation or release notes]

Answer:`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message, token } = req.body;
  const today = new Date().toISOString().split("T")[0];

  try {
    // Check usage first
    const { data: usageData, error: usageError } = await supabase
      .from("daily_usage")
      .select("count")
      .eq("token", token)
      .single();

    if (usageError) throw usageError;
    if (usageData?.count >= 3) {
      return res.status(429).json({ message: "Daily limit exceeded" });
    }

    // Get relevant documents
    const relevantDocs = await ragHandler.getRelevantDocuments(message);
    const context = relevantDocs.map((doc) => doc.content).join("\n\n");

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
          content: `Context: ${context}\n\nQuestion: ${message}`,
        },
      ],
      stream: true,
    });

    // Set headers for streaming
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // Update usage count after successful response
    await supabase.from("daily_usage").upsert({
      token,
      count: (usageData?.count || 0) + 1,
      last_used: new Date().toISOString(),
    });

    // Update memory
    memory.addMessage("user", message);
    memory.addMessage("assistant", responseText);

    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
