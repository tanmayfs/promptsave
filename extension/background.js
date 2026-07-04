// background.js - Manages the shared storage queue for pending prompts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_PROMPT') {
    const newPrompt = {
      content: request.content,
      source: request.source,
      timestamp: Date.now()
    };

    // Get current pending list
    chrome.storage.local.get({ pending_prompts: [] }, (result) => {
      const pending = result.pending_prompts;
      pending.push(newPrompt);

      // Save back to local extension storage
      chrome.storage.local.set({ pending_prompts: pending }, () => {
        console.log('Saved prompt to sync queue:', newPrompt);
        sendResponse({ success: true });
      });
    });

    // Return true to indicate asynchronous response handler
    return true;
  }
});
