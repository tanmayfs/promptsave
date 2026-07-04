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
    messages = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
  } else if (source === 'claude') {
    messages = Array.from(document.querySelectorAll('.font-user-message'));
  } else if (source === 'grok') {
    // Grok heuristics: User messages are right-aligned. 
    // AI responses are usually left-aligned and contain more complex markup.
    // We'll target divs that contain text.
    messages = Array.from(document.querySelectorAll('div.message-row, div[data-message-author-role="user"]'));
    
    if (messages.length > 0) {
        // Try to filter for user messages specifically
        // Often user messages are just text, so we can filter out rows that have "Copy" buttons
        const userMessages = messages.filter(msg => !msg.innerText.includes('Copy') && !msg.innerText.includes('Share'));
        if (userMessages.length > 0) messages = userMessages;
    }
  }
  
  if (messages.length === 0) {
    messages = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
  }
  
  return messages;
}

function extractTextFromMessage(messageEl) {
  const clone = messageEl.cloneNode(true);
  const btns = clone.querySelectorAll('.promptserver-save-btn');
  btns.forEach(btn => btn.remove());
  
  return clone.innerText || clone.textContent || '';
}

function injectSaveButtonsToMessages() {
  const source = getSource();
  const messages = findUserMessages(source);

  messages.forEach(msgEl => {
    if (msgEl.querySelector('.promptserver-save-btn')) return;

    // Use pure DOM creation to avoid Trusted Types / innerHTML violations
    const button = document.createElement('button');
    button.className = 'promptserver-save-btn history-mode';
    button.title = 'Save prompt to Library';
    
    // Use an emoji to avoid SVG parsing issues with strict CSP
    button.textContent = '💾';

    const msgStyle = window.getComputedStyle(msgEl);
    if (msgStyle.position === 'static') {
      msgEl.style.position = 'relative';
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const text = extractTextFromMessage(msgEl).trim();
      if (!text) return;

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
          button.textContent = '✅';
          
          setTimeout(() => {
            button.classList.remove('success');
            button.textContent = '💾';
          }, 2000);
        } else {
          button.classList.add('error');
          button.textContent = '❌';
          setTimeout(() => {
            button.classList.remove('error');
            button.textContent = '💾';
          }, 2000);
        }
      });
    });

    try {
      msgEl.appendChild(button);
    } catch (err) {
      console.warn("PromptServer: Failed to append button", err);
    }
  });
}

// Polling interval to detect dynamically loaded messages
const intervalId = setInterval(injectSaveButtonsToMessages, 1500);

// --- Text Selection Mode ---
let selectionButton = null;

function handleSelection() {
  setTimeout(() => {
    let selection;
    try {
        selection = window.getSelection();
    } catch (err) {
        return; // getSelection can fail in some strict iframe contexts
    }
    
    const text = selection.toString().trim();
    
    if (!text) {
      if (selectionButton) selectionButton.style.display = 'none';
      return;
    }

    if (!selectionButton) {
      selectionButton = document.createElement('button');
      selectionButton.className = 'promptserver-save-btn selection-mode';
      selectionButton.title = 'Save selected prompt to Library';
      
      const iconSpan = document.createElement('span');
      iconSpan.textContent = '💾 ';
      
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Save Selection';
      
      selectionButton.appendChild(iconSpan);
      selectionButton.appendChild(textSpan);
      
      try {
        document.body.appendChild(selectionButton);
      } catch (err) {
        console.warn("PromptServer: Failed to append selection button to body.");
        return;
      }
      
      selectionButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });

      selectionButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const selectedText = window.getSelection().toString().trim();
        if (!selectedText) return;
        
        textSpan.textContent = 'Saving...';
        selectionButton.disabled = true;

        chrome.runtime.sendMessage({
          action: 'SAVE_PROMPT',
          content: selectedText,
          source: getSource()
        }, (response) => {
          selectionButton.disabled = false;
          if (response && response.success) {
            textSpan.textContent = 'Saved!';
            selectionButton.classList.add('success');
            setTimeout(() => {
              textSpan.textContent = 'Save Selection';
              selectionButton.classList.remove('success');
              window.getSelection().removeAllRanges();
              selectionButton.style.display = 'none';
            }, 1500);
          } else {
            textSpan.textContent = 'Failed';
            selectionButton.classList.add('error');
            setTimeout(() => {
              textSpan.textContent = 'Save Selection';
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
      
      if (rect.width > 0 && rect.height > 0) {
        selectionButton.style.display = 'inline-flex';
        selectionButton.style.position = 'fixed';
        // Add robust positioning bounds
        const topPos = Math.min(window.innerHeight - 50, rect.bottom + 10);
        const leftPos = Math.max(10, Math.min(window.innerWidth - 120, rect.left + (rect.width / 2) - 60));
        
        selectionButton.style.top = topPos + 'px';
        selectionButton.style.left = leftPos + 'px';
        selectionButton.style.zIndex = '999999';
      }
    } catch (e) {
      selectionButton.style.display = 'none';
    }
  }, 50); // Slightly longer timeout to let DOM settle
}

// Use capture phase to ensure we catch these events even if page calls stopPropagation
document.addEventListener('mouseup', handleSelection, true);
document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
    handleSelection();
  }
}, true);

document.addEventListener('mousedown', (e) => {
  if (selectionButton && !selectionButton.contains(e.target)) {
    // Hide logic handled by mouseup/selectionchange
  }
}, true);

console.log('PromptServer Copilot content script active (Safe DOM Mode).');
