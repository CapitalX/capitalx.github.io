export class NowGPTModal {
  constructor() {
    this.modal = null;
    this.createModalStructure();
    this.bindEventListeners();
  }

  createModalStructure() {
    this.modal = document.createElement("div");
    this.modal.className = "demo-modal";

    this.modal.innerHTML = `
      <div class="demo-modal-content">
        <button class="close-modal">&times;</button>
        <h2>NowGPT Demo</h2>
        <p>This is a demo modal for NowGPT.</p>
      </div>
    `;

    document.body.appendChild(this.modal);
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
  }

  showModal() {
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  hideModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}
