import { NowGPTModal } from "./nowgpt-modal.js";

document.addEventListener("DOMContentLoaded", () => {
  const modal = new NowGPTModal();

  const demoButton = document.querySelector('button[data-project="nowgpt"]');
  if (demoButton) {
    demoButton.addEventListener("click", (e) => {
      e.preventDefault();
      modal.showModal();
    });
  }
});
