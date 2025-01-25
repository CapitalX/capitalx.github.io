import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationalRetrievalChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { ConversationBufferWindowMemory } from "langchain/memory";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Set proper headers
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message, action } = req.body;

    // Handle initialization check
    if (action === "initialize") {
      try {
        // Test Supabase connection
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        // Simple connection test
        await supabase.from("documents").select("count").limit(1);

        return res.status(200).json({
          status: "initialized",
          message: "RAG system initialized successfully",
        });
      } catch (error) {
        console.error("Initialization error:", error);
        return res.status(500).json({
          message: "Failed to initialize RAG system",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        });
      }
    }

    // Handle actual queries
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

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
    console.error("API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
}
