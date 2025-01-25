export class RAGHandler {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      const response = await fetch("/api/langchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initialize",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize RAG system");
      }

      const data = await response.json();
      this.initialized = true;
      return data;
    } catch (error) {
      console.error("RAG initialization error:", error);
      throw error;
    }
  }

  async processQuery(query, onProgress) {
    if (!this.initialized) {
      throw new Error("RAG system not initialized");
    }

    try {
      onProgress("Processing query...", 25);

      const response = await fetch("/api/langchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process query");
      }

      onProgress("Generating response...", 75);
      const result = await response.json();
      onProgress("Complete!", 100);

      return result;
    } catch (error) {
      console.error("RAG processing error:", error);
      throw error;
    }
  }
}

export default RAGHandler;
