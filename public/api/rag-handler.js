export class RAGHandler {
  constructor() {
    this.initialized = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async retryWithBackoff(operation, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  async initialize() {
    try {
      const initOperation = async () => {
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
          const error = await response.json();
          throw new Error(error.message || "Failed to initialize RAG system");
        }

        const data = await response.json();
        return data;
      };

      const data = await this.retryWithBackoff(initOperation);
      this.initialized = true;
      return data;
    } catch (error) {
      console.error("RAG initialization error:", error);
      throw error;
    }
  }

  async processQuery(query, onProgress) {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        throw new Error("Failed to initialize before query processing");
      }
    }

    try {
      onProgress("Processing query...", 25);

      const queryOperation = async () => {
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

        return await response.json();
      };

      onProgress("Generating response...", 75);
      const result = await this.retryWithBackoff(queryOperation);
      onProgress("Complete!", 100);

      return result;
    } catch (error) {
      console.error("RAG processing error:", error);
      throw error;
    }
  }
}

export default RAGHandler;
