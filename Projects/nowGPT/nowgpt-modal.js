class NowGPTModal {
    constructor() {
        this.modal = null;
        this.maxDaily = 3;
        this.token = null;
        this.initModal();
        this.bindEvents();
    }

    async checkUsage() {
        try {
            const response = await fetch('/api/nowgpt-usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'check' })
            });
            
            if (!response.ok) throw new Error('Usage check failed');
            const data = await response.json();
            this.token = data.token;
            return data.remaining;
        } catch (error) {
            console.error('Usage check error:', error);
            return 0;
        }
    }

    async sendMessage(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    token: this.token
                })
            });
            
            if (!response.ok) throw new Error('Chat failed');
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Chat error:', error);
            return 'Sorry, there was an error processing your request.';
        }
    }

    initModal() {
        const modalHTML = `
            <div class="demo-modal" style="display: none;">
                <div class="demo-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>NowGPT Demo</h3>
                    <div class="demo-chat">
                        <div class="chat-messages"></div>
                        <div class="chat-input">
                            <input type="text" placeholder="Ask a question...">
                            <button>Send</button>
                        </div>
                    </div>
                    <div class="usage-counter">
                        Questions remaining today: <span></span>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.querySelector('.demo-modal');
    }

    bindEvents() {
        const demoButtons = document.querySelectorAll('.try-demo-btn');
        demoButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Demo button clicked');
                this.showModal();
            });
        });

        const closeButton = this.modal.querySelector('.close-modal');
        closeButton.addEventListener('click', () => {
            this.hideModal();
        });

        const sendButton = this.modal.querySelector('.chat-input button');
        const input = this.modal.querySelector('.chat-input input');
        
        sendButton.addEventListener('click', async () => {
            const message = input.value.trim();
            if (message && await this.checkUsage() > 0) {
                await this.incrementUsage();
                // Handle the message
                input.value = '';
            }
        });
    }

    async showModal() {
        console.log('Showing modal');
        const remainingQuestions = await this.checkUsage();
        if (remainingQuestions <= 0) {
            alert('You have reached your daily limit. Please try again tomorrow!');
            return;
        }
        this.modal.style.display = 'flex';
        await this.updateUsageCounter();
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    async updateUsageCounter() {
        const counter = this.modal.querySelector('.usage-counter span');
        const remaining = await this.checkUsage();
        counter.textContent = remaining;
    }

    async incrementUsage() {
        try {
            const response = await fetch('/api/nowgpt-usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'increment',
                    token: this.token
                })
            });
            
            if (!response.ok) throw new Error('Usage increment failed');
            await this.updateUsageCounter();
        } catch (error) {
            console.error('Usage increment error:', error);
        }
    }

    async handleChat(message) {
        const chatMessages = this.modal.querySelector('.chat-messages');
        
        // Add user message
        chatMessages.innerHTML += `
            <div class="message user-message">
                <strong>You:</strong> ${message}
            </div>
        `;

        // Get AI response
        const response = await this.sendMessage(message);
        
        // Add AI response
        chatMessages.innerHTML += `
            <div class="message ai-message">
                <strong>NowGPT:</strong> ${response}
            </div>
        `;

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the NowGPT modal
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing NowGPT Modal');
    new NowGPTModal();
}); 