class NowGPTModal {
    constructor() {
        this.modal = null;
        this.usageKey = 'nowgpt_usage';
        this.maxDaily = 3;
        this.initModal();
        this.bindEvents();
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
            btn.addEventListener('click', () => this.showModal());
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideModal();
        });
    }

    showModal() {
        const remainingQuestions = this.checkUsage();
        if (remainingQuestions <= 0) {
            alert('You have reached your daily limit. Please try again tomorrow!');
            return;
        }
        this.modal.style.display = 'flex';
        this.updateUsageCounter();
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    checkUsage() {
        const usage = JSON.parse(localStorage.getItem(this.usageKey) || '{}');
        const today = new Date().toDateString();
        if (!usage[today]) {
            usage[today] = 0;
        }
        return this.maxDaily - usage[today];
    }

    updateUsageCounter() {
        const counter = this.modal.querySelector('.usage-counter span');
        counter.textContent = this.checkUsage();
    }
}

// Initialize the NowGPT modal
document.addEventListener('DOMContentLoaded', () => {
    new NowGPTModal();
}); 