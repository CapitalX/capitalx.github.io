document.addEventListener("DOMContentLoaded", () => {
  // Initialize modal handlers
  const demoButtons = document.querySelectorAll(
    'button[data-project="nowgpt"]'
  );

  if (demoButtons.length === 0) {
    console.error('No demo buttons found with data-project="nowgpt"');
    return;
  }

  // Create single modal instance
  const modal = new NowGPTModal();

  demoButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      modal.showModal();
    });
  });
});
