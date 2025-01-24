class NowGPTModal {
  constructor() {
    this.modal = null;
    this.maxDaily = 3;
    this.token = null;
    this.messageQueue = [];
    this.isProcessing = false;

    // Load saved chat history
    this.loadChatHistory();
    this.initModal();
    this.bindEvents();
    this.addWelcomeMessage();
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
      const messageDiv = this.addMessage(message, true);
      const responseDiv = this.addMessage("", false);
      this.typingIndicator.style.display = "flex";
      this.updateSendButton(true);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          token: this.token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        responseDiv.querySelector(
          ".message-text"
        ).innerHTML = `<div class="error-message">❌ ${
          errorData.message || "Failed to get response"
        }</div>`;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(5));
            responseText += data.content;
            responseDiv.querySelector(".message-text").innerHTML =
              marked.parse(responseText);

            if (this.isNearBottom()) {
              this.scrollToBottom();
            }
          }
        }
      }

      this.typingIndicator.style.display = "none";
      this.updateSendButton(false);
      await this.updateUsageCounter();
      this.scrollToBottom();
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage =
        "Sorry, there was an error processing your request. Please try again later.";
      if (this.messagesContainer.lastChild) {
        this.messagesContainer.lastChild.querySelector(
          ".message-text"
        ).innerHTML = `<div class="error-message">❌ ${errorMessage}</div>`;
      }
      this.typingIndicator.style.display = "none";
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
                            ServiceNow Xanadu Assistant
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
          // First increment usage
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
    const welcomeMessage = `👋 Hello! I'm your ServiceNow Xanadu assistant. I can help you with:

- 📚 Feature explanations
- 📖 Documentation queries
- 🚀 Release notes information
- ⚙️ Technical specifications

How can I assist you today?`;
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
}

// Initialize the NowGPT modal
if (typeof window !== "undefined") {
  new NowGPTModal();
}
