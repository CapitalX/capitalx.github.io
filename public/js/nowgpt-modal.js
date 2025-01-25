import RAGHandler from "/api/rag-handler.js";

class NowGPTModal {
  constructor() {
    // Initialize properties first
    this.modal = null;
    this.maxDaily = 3;
    this.token = null;
    this.messageQueue = [];
    this.isProcessing = false;
    this.isDemoEnabled = true;
    this.isSourceEnabled = true;
    this.messagesContainer = null;
    this.messageInput = null;
    this.sendButton = null;
    this.errorContainer = null;
    this.rag = null;

    // Create modal structure first
    this.createModalStructure();

    // Then bind methods
    this.bindMethods();

    // Setup listeners
    this.setupEventListeners();

    // Add welcome message
    this.addWelcomeMessage();
  }

  bindMethods() {
    this.handleMessage = this.handleMessage.bind(this);
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
  }

  async initializeAsync() {
    try {
      // Initialize RAG handler
      this.rag = new RAGHandler();
      await this.rag.initialize();

      // Load chat history
      this.loadChatHistory();

      // Check usage
      await this.updateUsageCounter();
    } catch (error) {
      console.error("Initialization error:", error);
      this.showError("Failed to initialize chat. Please try again later.");
    }
  }

  createModalStructure() {
    // Create modal container
    this.modal = document.createElement("div");
    this.modal.className = "modal";
    this.modal.id = "chatModal";

    // Add your existing modal HTML structure
    this.modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>NowGPT Chat</h2>
                <div class="usage-info">
                    Remaining: <span class="usage-count">-</span>
                </div>
                <button class="close-button">&times;</button>
            </div>
            <div class="messages-container"></div>
            <div class="input-container">
                <textarea 
                    placeholder="Ask about ServiceNow Xanadu..." 
                    rows="1"
                ></textarea>
                <button class="send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(this.modal);

    // Store references to elements
    this.messagesContainer = this.modal.querySelector(".messages-container");
    this.messageInput = this.modal.querySelector("textarea");
    this.sendButton = this.modal.querySelector(".send-button");
  }

  setupEventListeners() {
    // Close button
    const closeButton = this.modal.querySelector(".close-button");
    closeButton.onclick = () => this.hideModal();

    // Send button
    this.sendButton.onclick = () => this.handleMessage();

    // Enter key in textarea
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleMessage();
      }
    });

    // Auto-resize textarea
    this.messageInput.addEventListener("input", () => {
      this.messageInput.style.height = "auto";
      this.messageInput.style.height = this.messageInput.scrollHeight + "px";
    });
  }

  // Add methods for chat history persistence
  loadChatHistory() {
    const today = new Date().toISOString().split("T")[0];
    const savedData = localStorage.getItem("nowgpt_chat");

    if (savedData) {
      const { date, history, token } = JSON.parse(savedData);

      // Only restore if it's from today
      if (date === today) {
        this.token = token;
        return history;
      }
    }

    // Clear old data and generate new token
    localStorage.removeItem("nowgpt_chat");
    this.token = null;
    return [];
  }

  saveChatHistory() {
    const today = new Date().toISOString().split("T")[0];
    const chatHistory = Array.from(this.messagesContainer.children).map(
      (msg) => ({
        content: msg.querySelector(".message-text").innerHTML,
        isUser: msg.classList.contains("user"),
        timestamp: msg.querySelector(".message-time")?.textContent,
      })
    );

    localStorage.setItem(
      "nowgpt_chat",
      JSON.stringify({
        date: today,
        history: chatHistory,
        token: this.token,
      })
    );
  }

  async checkUsage() {
    try {
      const response = await fetch("/api/nowgpt-usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check",
          token: this.token,
        }),
      });

      if (!response.ok) throw new Error("Usage check failed");

      const data = await response.json();
      this.token = data.token; // Save the token
      this.saveChatHistory(); // Save after token update
      return data.remaining;
    } catch (error) {
      console.error("Usage check error:", error);
      return 0;
    }
  }

  async sendMessage(message) {
    try {
      if (!this.rag) {
        throw new Error("Chat system not initialized");
      }

      const messageDiv = this.addMessage(message, true);
      const progressCard = this.addProgressCard();

      const result = await this.rag.processQuery(
        message,
        (status, percentage) => {
          this.updateProgress(progressCard, status, percentage);
        }
      );

      // Add the response
      const responseDiv = this.addMessage(result.answer, false);

      // Add sources if available
      if (result.sources && result.sources.length > 0) {
        this.addSourcesCard(result.sources);
      }

      setTimeout(() => progressCard.remove(), 1000);
    } catch (error) {
      console.error("Chat error:", error);
      this.showError(error.message || "Failed to process message");
    }
  }

  async updateUsageCounter() {
    const counter = this.modal.querySelector(".usage-count");
    const remaining = await this.checkUsage();
    counter.textContent = remaining;
  }

  async incrementUsage() {
    try {
      const response = await fetch("/api/nowgpt-usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "increment",
          token: this.token,
        }),
      });

      if (!response.ok) throw new Error("Usage increment failed");
      await this.updateUsageCounter();
      return response;
    } catch (error) {
      console.error("Usage increment error:", error);
      return null;
    }
  }

  addWelcomeMessage() {
    const welcomeMessage = `👋 Hello! I'm your ServiceNow Xanadu assistant.

I can help you with:

• 📚 Feature explanations and capabilities
• 📖 Documentation and implementation guides  
• 🚀 Release notes and updates
• ⚙️ Technical details and specifications
•  Best practices and recommendations

How can I assist you today? Feel free to ask any questions!`;
    this.addMessage(welcomeMessage, false);
  }

  addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${
      isUser ? "user" : "assistant"
    } animate-in`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
            <div class="message-content">
                <span class="avatar">${isUser ? "👤" : "🤖"}</span>
                <div class="message-body">
                    <div class="message-text">
                        ${isUser ? content : content || ""}
                    </div>
                    ${
                      isUser
                        ? ""
                        : `<div class="message-time">${timestamp}</div>`
                    }
                </div>
            </div>
        `;

    this.messagesContainer.appendChild(messageDiv);
    if (this.isNearBottom()) {
      this.scrollToBottom();
    }
    this.saveChatHistory(); // Save after adding new message
    return messageDiv;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  isNearBottom() {
    const threshold = 100; // pixels from bottom
    const scrollBottom =
      this.messagesContainer.scrollHeight -
      this.messagesContainer.scrollTop -
      this.messagesContainer.clientHeight;
    return scrollBottom < threshold;
  }

  updateButtons() {
    // Update demo buttons
    document.querySelectorAll(".try-demo-btn").forEach((button) => {
      button.disabled = !this.isDemoEnabled;
      button.title = this.isDemoEnabled ? "Try the demo" : "Coming Soon";
    });

    // Update source buttons - make sure to select ALL source buttons
    document.querySelectorAll(".source-btn, a.source-btn").forEach((button) => {
      button.disabled = !this.isSourceEnabled;
      button.style.pointerEvents = this.isSourceEnabled ? "auto" : "none";
      button.title = this.isSourceEnabled ? "View source" : "Coming Soon";
      // Add opacity for visual feedback
      button.style.opacity = this.isSourceEnabled ? "1" : "0.5";
    });
  }

  addProgressCard() {
    const card = document.createElement("div");
    card.className = "progress-card";
    card.innerHTML = `
        <div class="progress-status">
            <span class="status-text">Initializing...</span>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
    `;
    this.messagesContainer.appendChild(card);
    return card;
  }

  async updateProgress(card, status, percentage) {
    card.querySelector(".status-text").textContent = status;
    card.querySelector(".progress-fill").style.width = `${percentage}%`;
    // Add small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  showError(message) {
    if (!this.errorContainer) {
      this.errorContainer = document.createElement("div");
      this.errorContainer.className = "error-container";
      this.modal.appendChild(this.errorContainer);
    }

    this.errorContainer.innerHTML = `
        <div class="error-message">
            ${message}
            <button class="error-close">&times;</button>
        </div>
    `;

    const closeBtn = this.errorContainer.querySelector(".error-close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.errorContainer.innerHTML = "";
      };
    }
  }

  addSourcesCard(sources) {
    const card = document.createElement("div");
    card.className = "sources-card";

    const sourcesList = sources
      .map(
        (doc) => `
      <div class="source-item">
        <div class="source-title">${doc.metadata.sources}</div>
        <div class="source-page">Page ${doc.metadata.page || "N/A"}</div>
        <div class="source-preview">${doc.pageContent.slice(0, 100)}...</div>
      </div>
    `
      )
      .join("");

    card.innerHTML = `
      <div class="sources-header">Sources Referenced</div>
      <div class="sources-list">
        ${sourcesList}
      </div>
    `;

    this.messagesContainer.appendChild(card);
    return card;
  }

  async handleMessage() {
    const message = this.messageInput.value.trim();
    if (message && !this.isProcessing) {
      const remaining = await this.checkUsage();
      if (remaining <= 0) {
        alert("You have reached your daily limit. Please try again tomorrow!");
        return;
      }

      try {
        this.isProcessing = true;
        this.sendButton.disabled = true;
        this.updateSendButton(true);

        // Then send message
        await this.sendMessage(message);
        this.messageInput.value = "";
      } catch (error) {
        console.error("Message handling error:", error);
        alert("An error occurred. Please try again.");
      } finally {
        this.isProcessing = false;
        this.sendButton.disabled = false;
        this.updateSendButton(false);
        const incrementResponse = await this.incrementUsage();
        if (!incrementResponse.ok) {
          throw new Error("Failed to increment usage");
        }
      }
    }
  }

  async showModal() {
    console.log("Showing modal");
    const remainingQuestions = await this.checkUsage();
    if (remainingQuestions <= 0) {
      alert("You have reached your daily limit. Please try again tomorrow!");
      return;
    }

    // Restore chat history if available
    const history = this.loadChatHistory();
    if (history.length > 0) {
      this.messagesContainer.innerHTML = ""; // Clear default welcome message
      history.forEach((msg) => {
        this.addMessage(msg.content, msg.isUser);
      });
    }

    this.modal.style.display = "flex";
    await this.updateUsageCounter();
  }

  hideModal() {
    this.modal.style.display = "none";
  }

  updateSendButton(isProcessing) {
    const button = this.modal.querySelector(".send-button");
    const buttonText = button.querySelector(".button-text");
    const buttonIcon = button.querySelector(".button-icon");

    if (isProcessing) {
      buttonText.textContent = "Sending";
      buttonIcon.textContent = "⏳";
      button.classList.add("processing");
    } else {
      buttonText.textContent = "Send";
      buttonIcon.textContent = "↗️";
      button.classList.remove("processing");
    }
  }
}

// Create and initialize modal instance
const modal = new NowGPTModal();

// Export for global access
window.nowGPTModal = modal;

// Export show/hide methods
export const showModal = () => modal.showModal();
export const hideModal = () => modal.hideModal();
