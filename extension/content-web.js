// content-web.js - Runs on http://localhost:5173 to synchronize pending prompts

const STORAGE_KEY = 'prompt_server_mvp_prompts';

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function performSync() {
  chrome.storage.local.get({ pending_prompts: [] }, (result) => {
    const pending = result.pending_prompts;
    if (pending.length === 0) return;

    console.log(`[PromptServer Copilot] Found ${pending.length} pending prompts to sync.`);

    // Retrieve existing local storage items
    let prompts = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      prompts = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[PromptServer Copilot] Failed to read localStorage prompts', e);
      prompts = [];
    }

    // Convert pending extension prompts to website prompts
    const newPrompts = pending.map(item => {
      const sourceName = item.source.charAt(0).toUpperCase() + item.source.slice(1);
      return {
        id: generateId(),
        title: `Saved from ${sourceName} (${formatDate(item.timestamp)})`,
        content: item.content,
        tags: [item.source, 'extension'],
        status: 'active',
        createdAt: item.timestamp,
        updatedAt: item.timestamp,
        versions: []
      };
    });

    // Merge prompts (new ones first)
    const mergedPrompts = [...newPrompts, ...prompts];

    // Save back to web local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPrompts));
      console.log('[PromptServer Copilot] Successfully synced prompts to localStorage.');

      // Notify the React App
      window.dispatchEvent(new CustomEvent('prompt-server-sync', {
        detail: { count: newPrompts.length }
      }));

      // Clear pending queue in extension storage
      chrome.storage.local.set({ pending_prompts: [] }, () => {
        console.log('[PromptServer Copilot] Pending sync queue cleared.');
      });
    } catch (e) {
      console.error('[PromptServer Copilot] Failed to write synchronized prompts to localStorage', e);
    }
  });
}

// Perform sync immediately on load
performSync();

// Also check periodically or when the page gains focus
window.addEventListener('focus', performSync);
console.log('PromptServer Copilot web-sync content script active.');
