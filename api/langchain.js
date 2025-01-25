import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { ConversationBufferWindowMemory } from "langchain/memory";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message, token } = req.body;

    // Validate token (use your existing token validation)
    // ... token validation logic ...

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // Use service key for backend
    );

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    // Your existing RAG logic here
    const chain = ConversationalRetrievalChain.fromLLM(
      new ChatOpenAI({
        temperature: 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }),
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
        memory: new ConversationBufferWindowMemory({
          memoryKey: "chat_history",
          outputKey: "answer",
          returnMessages: true,
          k: 3,
        }),
      }
    );

    const response = await chain.call({
      question: message,
    });

    return res.status(200).json({
      answer: response.answer,
      sources: response.sourceDocuments,
    });
  } catch (error) {
    console.error("LangChain API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
