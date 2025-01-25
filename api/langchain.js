import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  createStuffDocumentsChain,
  createRetrievalChain,
} from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { BufferMemory } from "langchain/memory";
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

    const model = new ChatOpenAI({
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const memory = new BufferMemory({
      memoryKey: "chat_history",
      outputKey: "answer",
      returnMessages: true,
    });

    const prompt = PromptTemplate.fromTemplate(`
      Answer the following question based on the provided context:
      Context: {context}
      Question: {question}
      Answer:
    `);

    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt,
    });

    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever: vectorStore.asRetriever(),
      memory,
    });

    const response = await retrievalChain.invoke({
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
