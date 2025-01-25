import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { ConversationBufferWindowMemory } from "langchain/memory";
import { createClient } from "@supabase/supabase-js";
import { BaseRetriever } from "@langchain/core/retrievers";

class SmartRetriever extends BaseRetriever {
  constructor(vectorstore) {
    super();
    this.vectorstore = vectorstore;
    this.relevantSources = [];
  }

  async selectRelevantSources(query) {
    const sourceDescriptions = {
      "xanadu_platform_security.pdf":
        "Security features, authentication methods, authorization controls, compliance standards, data protection",
      "xanadu_general_release_notes.pdf":
        "Product updates, new feature releases, improvements, bug fixes, deprecation notices",
      "xanadu_api_references.pdf":
        "Complete API documentation, endpoint specifications, request/response formats, authentication methods",
      "xanadu_application_development.pdf":
        "Development guidelines, scripting tutorials, customization options, best practices",
      "xanadu_it_service_management.pdf":
        "ITSM workflows, incident/problem management, service desk operations, SLA management",
      "xanadu_glossary.pdf":
        "Comprehensive technical terms, industry definitions, platform-specific concepts",
      "xanadu_customer_service_management.pdf":
        "Customer service features, case management workflows, SLA tracking, customer engagement tools",
    };

    const sourceSelector = new ChatOpenAI({ temperature: 0 });
    const response = await sourceSelector.invoke(
      `Given this query: '${query}'
      Select the most relevant documentation sources from:
      ${JSON.stringify(sourceDescriptions, null, 2)}
      
      Return only the filenames in a comma-separated list.
      Consider:
      1. Query topic and intent
      2. Technical vs business focus
      3. Specific feature mentions
      
      Return format: filename1.pdf,filename2.pdf`
    );

    return response.content.split(",").map((s) => s.trim());
  }

  async getRelevantDocuments(query) {
    this.relevantSources = await this.selectRelevantSources(query);
    console.log(`Searching in: ${this.relevantSources.join(", ")}`);

    const filterDict = {
      sources: {
        $in: this.relevantSources,
      },
    };

    const docs = await this.vectorstore.similaritySearch(query, 4, filterDict);

    // Ensure metadata
    docs.forEach((doc) => {
      if (!doc.metadata.sources) {
        doc.metadata.sources = doc.metadata.source || "Unknown";
      }
    });

    return docs;
  }
}

export default class RAGHandler {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const embeddings = new OpenAIEmbeddings();
    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client: this.supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    const promptTemplate = new PromptTemplate({
      template: `You are an expert assistant in ServiceNow Xanadu Release Notes and Documentation...
      // ... your existing prompt template ...`,
      inputVariables: ["context", "chat_history", "question"],
    });

    this.qaChain = ConversationalRetrievalChain.fromLLM(
      new ChatOpenAI({ temperature: 0.7 }),
      new SmartRetriever(this.vectorStore),
      {
        returnSourceDocuments: true,
        memory: new ConversationBufferWindowMemory({
          memoryKey: "chat_history",
          outputKey: "answer",
          returnMessages: true,
          k: 3,
        }),
        questionGeneratorTemplate: promptTemplate,
        verbose: true,
      }
    );

    this.initialized = true;
  }

  async processQuery(query, onProgress) {
    await this.initialize();

    try {
      onProgress("Analyzing query...", 0);

      onProgress("Searching documentation...", 33);
      const result = await this.qaChain.call({
        question: query,
      });

      onProgress("Processing response...", 66);

      onProgress("Complete!", 100);

      return {
        answer: result.answer,
        sources: result.sourceDocuments,
      };
    } catch (error) {
      console.error("RAG processing error:", error);
      throw error;
    }
  }
}
