import RAGHandler from "../../api/rag-handler.js";

class NowGPTModal {
  constructor() {
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
    this.rag = null; // Initialize as null

    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.init = this.init.bind(this);

    // Load saved chat history
    this.loadChatHistory();
    this.initModal();
    this.bindEvents();
    this.addWelcomeMessage();
    this.updateButtons();

    // Add a slight delay to ensure all buttons are in the DOM
    setTimeout(() => this.updateButtons(), 100);
  }

  async init() {
    try {
      // Create modal structure
      this.createModalStructure();

      // Initialize RAG handler
      this.rag = new RAGHandler();
      await this.rag.initialize(); // Initialize RAG when modal is created

      // Load chat history
      this.loadChatHistory();

      // Check usage
      await this.updateUsageCounter();
    } catch (error) {
      console.error("Initialization error:", error);
      this.showError("Failed to initialize chat. Please try again later.");
    }
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

  initModal() {
    const modalHTML = `
        <div class="demo-modal" style="display: none;">
            <div class="demo-modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <h3>
                            <span class="modal-icon">🤖</span>
                            nowGPT V1
                        </h3>
                        <div class="usage-counter">
                            <span class="usage-icon">🎯</span>
                            <span class="usage-text">Questions remaining today: <span class="usage-count"></span></span>
                        </div>
                    </div>
                    <button class="close-modal" aria-label="Close chat">×</button>
                </div>
                <div class="demo-chat">
                    <div class="chat-messages"></div>
                    <div class="chat-input-container">
                        <div class="chat-input">
                            <input type="text" 
                                placeholder="Ask about Xanadu features, updates, or documentation..." 
                                aria-label="Chat input">
                            <button class="send-button" aria-label="Send message">
                                <span class="button-text">Send</span>
                                <span class="button-icon">↗️</span>
                            </button>
                        </div>
                        <div class="typing-indicator" style="display: none;">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.modal = document.querySelector(".demo-modal");
    this.messagesContainer = this.modal.querySelector(".chat-messages");
    this.typingIndicator = this.modal.querySelector(".typing-indicator");
  }

  bindEvents() {
    const demoButtons = document.querySelectorAll(".try-demo-btn");
    const closeButton = this.modal.querySelector(".close-modal");
    const sendButton = this.modal.querySelector(".send-button");
    const input = this.modal.querySelector(".chat-input input");

    demoButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.showModal());
    });

    closeButton.addEventListener("click", () => this.hideModal());

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "flex") {
        this.hideModal();
      }
    });

    // Close on click outside modal
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    const handleMessage = async () => {
      const message = input.value.trim();
      if (message && !this.isProcessing) {
        const remaining = await this.checkUsage();
        if (remaining <= 0) {
          alert(
            "You have reached your daily limit. Please try again tomorrow!"
          );
          return;
        }

        try {
          this.isProcessing = true;
          sendButton.disabled = true;
          this.updateSendButton(true);

          // Then send message
          await this.sendMessage(message);
          input.value = "";
        } catch (error) {
          console.error("Message handling error:", error);
          alert("An error occurred. Please try again.");
        } finally {
          this.isProcessing = false;
          sendButton.disabled = false;
          this.updateSendButton(false);
          const incrementResponse = await this.incrementUsage();
          if (!incrementResponse.ok) {
            throw new Error("Failed to increment usage");
          }
        }
      }
    };

    sendButton.addEventListener("click", handleMessage);

    input.addEventListener("keypress", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await handleMessage();
      }
    });

    // Dynamic input height
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
    });
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
• 💡 Best practices and recommendations

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
}

// Create and initialize modal instance
const modal = new NowGPTModal();
modal.init().catch(console.error);

// Export for global access
window.nowGPTModal = modal;
