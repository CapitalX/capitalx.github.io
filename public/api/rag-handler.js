export class RAGHandler {
  constructor() {
    this.initialized = true;
  }

  async processQuery(query, onProgress) {
    try {
      onProgress("Processing query...", 25);

      const response = await fetch("/api/langchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          token: localStorage.getItem("nowgpt_token"),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process query");
      }

      onProgress("Generating response...", 75);

      const result = await response.json();
      onProgress("Complete!", 100);

      return {
        answer: result.answer,
        sources: result.sources,
      };
    } catch (error) {
      console.error("RAG processing error:", error);
      throw error;
    }
  }
}

export default RAGHandler;
