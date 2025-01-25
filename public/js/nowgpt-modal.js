export class NowGPTModal {
  constructor() {
    console.log("Initializing NowGPTModal"); // Debug log
    this.modal = null;
    this.messagesContainer = null;
    this.messageInput = null;
    this.sendButton = null;
    this.errorContainer = null;
    this.isProcessing = false;

    this.createModalStructure();
    this.bindEventListeners();
    this.initialize();
  }

  createModalStructure() {
    console.log("Creating modal structure"); // Debug log
    this.modal = document.createElement("div");
    this.modal.className = "demo-modal";
    this.modal.id = "chatModal";

    // Set initial styles
    this.modal.style.cssText = `
      display: none;
      opacity: 0;
      visibility: hidden;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
    `;

    this.modal.innerHTML = `
      <div class="demo-modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <h3>NowGPT Chat</h3>
            <small>Ask about ServiceNow Xanadu</small>
          </div>
          <button class="close-modal">&times;</button>
        </div>
        <div class="demo-chat">
          <div class="chat-messages"></div>
          <div class="error-container"></div>
          <div class="chat-input-container">
            <div class="chat-input">
              <textarea 
                placeholder="Type your message..." 
                rows="1"
                maxlength="500"
              ></textarea>
              <button class="send-button">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    console.log("Modal added to DOM"); // Debug log

    // Cache DOM elements
    this.messagesContainer = this.modal.querySelector(".chat-messages");
    this.messageInput = this.modal.querySelector("textarea");
    this.sendButton = this.modal.querySelector(".send-button");
    this.errorContainer = this.modal.querySelector(".error-container");
  }

  async initialize() {
    try {
      console.log("Initializing chat..."); // Debug log

      // Use absolute URL to avoid path issues
      const apiUrl = window.location.origin + "/api/chat-handler";
      console.log("Attempting to connect to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action: "initialize",
        }),
      });

      // Handle 404 specifically
      if (response.status === 404) {
        throw new Error(
          "Chat API endpoint not found. Please check server configuration."
        );
      }

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }

      const data = await response.json();
      console.log("Initialize response:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize chat");
      }

      // Add welcome message only if initialization was successful
      this.addMessage(
        "Hello! I'm NowGPT, your ServiceNow Xanadu documentation assistant. How can I help you today?",
        false
      );

      return true;
    } catch (error) {
      console.error("Chat initialization error:", {
        message: error.message,
        status: error.status,
        stack: error.stack,
      });

      let errorMessage = "Failed to initialize chat: ";
      if (error.message.includes("API endpoint not found")) {
        errorMessage += "Service unavailable. Please try again later.";
      } else if (error.message.includes("Invalid response format")) {
        errorMessage += "Server configuration error.";
      } else {
        errorMessage += error.message;
      }

      this.showError(errorMessage);
      return false;
    }
  }

  bindEventListeners() {
    // Close button
    this.modal.querySelector(".close-modal").addEventListener("click", () => {
      this.hideModal();
    });

    // Send message on button click
    this.sendButton.addEventListener("click", () => {
      this.handleMessage();
    });

    // Auto-resize textarea and handle enter key
    this.messageInput.addEventListener("input", () => {
      this.messageInput.style.height = "auto";
      this.messageInput.style.height = this.messageInput.scrollHeight + "px";
    });

    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleMessage();
      }
    });

    // Close modal on outside click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });
  }

  async handleMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.messageInput.value = "";
      this.messageInput.style.height = "auto";

      // Add user message
      this.addMessage(message, true);

      // Show typing indicator
      const typingIndicator = this.addTypingIndicator();

      const response = await fetch("/api/chat-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "chat",
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      typingIndicator.remove();

      // Add assistant's response
      this.addMessage(data.response, false);
    } catch (error) {
      console.error("Message error:", error);
      this.showError(error.message || "Failed to send message");
    } finally {
      this.isProcessing = false;
    }
  }

  addMessage(content, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user" : "assistant"}`;

    const timestamp = new Date().toLocaleTimeString();

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${content}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    return messageDiv;
  }

  addTypingIndicator() {
    const div = document.createElement("div");
    div.className = "message assistant typing";
    div.innerHTML = `
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(div);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    return div;
  }

  showError(message) {
    this.errorContainer.innerHTML = `
      <div class="error-message">
        <span>${message}</span>
        <button class="error-close">&times;</button>
      </div>
    `;
    this.errorContainer.style.display = "block";

    const closeBtn = this.errorContainer.querySelector(".error-close");
    closeBtn.addEventListener("click", () => {
      this.errorContainer.style.display = "none";
    });
  }

  showModal() {
    console.log("showModal called"); // Debug log

    // First make it visible but transparent
    this.modal.style.display = "flex";
    this.modal.style.visibility = "visible";
    console.log("Modal display and visibility set"); // Debug log

    // Force a reflow
    void this.modal.offsetHeight;

    // Then animate in
    requestAnimationFrame(() => {
      console.log("Adding show class"); // Debug log
      this.modal.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  }

  hideModal() {
    console.log("Hiding modal"); // Debug log
    this.modal.classList.remove("show");

    setTimeout(() => {
      this.modal.style.display = "none";
      this.modal.style.visibility = "hidden";
      document.body.style.overflow = "";
    }, 300); // Match your CSS transition duration
  }
}
