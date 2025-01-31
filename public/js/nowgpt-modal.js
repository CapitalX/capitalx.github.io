export class NowGPTModal {
  constructor() {
    this.modal = null;
    this.messages = [];
    this.isProcessing = false;
    this.createModalStructure();
    this.bindEventListeners();
  }

  createModalStructure() {
    this.modal = document.createElement("div");
    this.modal.className = "demo-modal";

    this.modal.innerHTML = `
      <div class="demo-modal-content">
        <button class="close-modal">&times;</button>
        <h2>NowGPT Chat</h2>
        <div class="chat-container">
          <div class="messages-container"></div>
          <div class="input-container">
            <textarea 
              class="message-input" 
              placeholder="Type your message here..."
              rows="3"
            ></textarea>
            <button class="send-button">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Store references to DOM elements
    this.messagesContainer = this.modal.querySelector(".messages-container");
    this.messageInput = this.modal.querySelector(".message-input");
    this.sendButton = this.modal.querySelector(".send-button");
  }

  bindEventListeners() {
    // Close button
    this.modal.querySelector(".close-modal").addEventListener("click", () => {
      this.hideModal();
    });

    // Close on outside click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    // Send message on button click
    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Send message on Enter (but Shift+Enter for new line)
    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isProcessing) return;

    this.isProcessing = true;
    this.messageInput.value = "";

    // Add user message to chat
    this.addMessage("user", message);

    try {
      // Show typing indicator
      this.addTypingIndicator();

      // Simulate API call (replace with your actual API endpoint)
      const response = await this.fetchBotResponse(message);

      // Remove typing indicator and add bot response
      this.removeTypingIndicator();
      this.addMessage("bot", response);
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage(
        "error",
        "Sorry, something went wrong. Please try again."
      );
    } finally {
      this.isProcessing = false;
    }
  }

  async fetchBotResponse(message) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Replace this with your actual API call
    return "This is a demo response. Replace this with your actual API integration.";
  }

  addMessage(type, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  addTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "message bot-message typing-indicator";
    indicator.innerHTML =
      '<div class="dots"><span></span><span></span><span></span></div>';
    this.messagesContainer.appendChild(indicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = this.messagesContainer.querySelector(".typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  showModal() {
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
    this.messageInput.focus();
  }

  hideModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}
