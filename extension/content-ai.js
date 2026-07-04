// content-ai.js - Injected into AI chat pages to extract prompts

function getSource() {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('grok')) return 'grok';
  if (host.includes('openai') || host.includes('chatgpt')) return 'chatgpt';
  if (host.includes('claude')) return 'claude';
  return 'ai';
}

function findUserMessages(source) {
  let messages = [];
  
  if (source === 'chatgpt') {
    // ChatGPT: Targets the container for user messages
    messages = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
  } else if (source === 'claude') {
    // Claude: Targets user messages
    messages = Array.from(document.querySelectorAll('.font-user-message'));
  } else if (source === 'grok') {
    // Grok: Target specific user message wrappers to avoid hitting AI responses.
    // User messages typically have specific attributes or right-aligned classes.
    // We remove the overly broad .whitespace-pre-wrap to avoid AI text.
    messages = Array.from(document.querySelectorAll('.message-row.user-message, div[data-message-author-role="user"]'));
  }
  
  // Fallback for any unknown or if specific selectors fail
  if (messages.length === 0) {
    messages = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
  }
  
  return messages;
}

function extractTextFromMessage(messageEl) {
  // Clone to avoid modifying the actual DOM
  const clone = messageEl.cloneNode(true);
  // Remove our injected button from the clone so its text isn't included
  const btns = clone.querySelectorAll('.promptserver-save-btn');
  btns.forEach(btn => btn.remove());
  
  return clone.innerText || clone.textContent || '';
}

function injectSaveButtonsToMessages() {
  const source = getSource();
  const messages = findUserMessages(source);

  messages.forEach(msgEl => {
    // Skip if we already injected a button into this message
    if (msgEl.querySelector('.promptserver-save-btn')) return;

    // Create the save button (small FAB style)
    const button = document.createElement('button');
    button.className = 'promptserver-save-btn history-mode';
    button.title = 'Save prompt to Library';
    
    // Floppy disk icon
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
    `;

    // Ensure parent container can absolute-position the button if needed
    const msgStyle = window.getComputedStyle(msgEl);
    if (msgStyle.position === 'static') {
      msgEl.style.position = 'relative';
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const text = extractTextFromMessage(msgEl).trim();
      if (!text) {
        console.warn('PromptServer: No text found in message block.');
        return;
      }

      button.classList.add('saving');
      button.disabled = true;

      chrome.runtime.sendMessage({
        action: 'SAVE_PROMPT',
        content: text,
        source: source
      }, (response) => {
        button.disabled = false;
        button.classList.remove('saving');
        
        if (response && response.success) {
          button.classList.add('success');
          // Checkmark icon
          button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          
          setTimeout(() => {
            button.classList.remove('success');
            // Revert to floppy disk
            button.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            `;
          }, 2000);
        } else {
          button.classList.add('error');
          setTimeout(() => {
            button.classList.remove('error');
          }, 2000);
        }
      });
    });

    // Append the button to the message element
    msgEl.appendChild(button);
  });
}

// Polling interval to detect dynamically loaded messages as you chat
const intervalId = setInterval(injectSaveButtonsToMessages, 1500);

// --- Text Selection Mode ---
let selectionButton = null;

// Use mouseup and keyup to reliably detect selection end
function handleSelection() {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (!text) {
      if (selectionButton) selectionButton.style.display = 'none';
      return;
    }

    if (!selectionButton) {
      selectionButton = document.createElement('button');
      selectionButton.className = 'promptserver-save-btn selection-mode';
      selectionButton.title = 'Save selected prompt to Library';
      selectionButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save Selection</span>
      `;
      document.body.appendChild(selectionButton);
      
      // Prevent button click from clearing the selection immediately
      selectionButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });

      selectionButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const selectedText = window.getSelection().toString().trim();
        if (!selectedText) return;
        
        const label = selectionButton.querySelector('span');
        label.textContent = 'Saving...';
        selectionButton.disabled = true;

        chrome.runtime.sendMessage({
          action: 'SAVE_PROMPT',
          content: selectedText,
          source: getSource()
        }, (response) => {
          selectionButton.disabled = false;
          if (response && response.success) {
            label.textContent = 'Saved!';
            selectionButton.classList.add('success');
            setTimeout(() => {
              label.textContent = 'Save Selection';
              selectionButton.classList.remove('success');
              window.getSelection().removeAllRanges();
              selectionButton.style.display = 'none';
            }, 1500);
          } else {
            label.textContent = 'Failed';
            selectionButton.classList.add('error');
            setTimeout(() => {
              label.textContent = 'Save Selection';
              selectionButton.classList.remove('error');
            }, 1500);
          }
        });
      });
    }
    
    // Position the button below the selection
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Only show if the selection is actually visible/valid
      if (rect.width > 0 && rect.height > 0) {
        selectionButton.style.display = 'inline-flex';
        selectionButton.style.position = 'fixed';
        selectionButton.style.top = \`\${rect.bottom + 10}px\`;
        selectionButton.style.left = \`\${Math.max(10, rect.left + (rect.width / 2) - 60)}px\`;
        selectionButton.style.zIndex = '999999';
      }
    } catch (e) {
      selectionButton.style.display = 'none';
    }
  }, 10);
}

document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
    handleSelection();
  }
});

// Hide button when clicking outside
document.addEventListener('mousedown', (e) => {
  if (selectionButton && !selectionButton.contains(e.target)) {
    // We don't hide immediately to allow selection to form,
    // but if the user clicks away, the selectionchange/mouseup will handle it
    // because window.getSelection() will be empty.
  }
});

console.log('PromptServer Copilot content script active (History + Selection Mode).');
