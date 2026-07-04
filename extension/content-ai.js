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
    // Grok: Target message bubbles. Grok frequently changes class names.
    // A common pattern is looking for the text container inside message rows.
    // We will look for elements containing user text.
    // As a fallback, we target generic message blocks.
    messages = Array.from(document.querySelectorAll('.message-row.user-message, div[data-message-author-role="user"], .whitespace-pre-wrap:not(textarea)'));
    // Filter out obvious non-user messages if possible, or just attach to all text blocks.
    // For MVP, if we attach to AI messages too, it's not the end of the world, 
    // but let's try to target right-aligned or specific user bubbles.
  }
  
  // Fallback for any unknown or if specific selectors fail
  if (messages.length === 0) {
    messages = Array.from(document.querySelectorAll('[data-message-author-role="user"], .user-message'));
    
    // Ultimate fallback for Grok/others: find paragraphs inside the main chat view
    if (messages.length === 0) {
       // Look for elements that have a lot of text but aren't inputs
       const potentialTexts = Array.from(document.querySelectorAll('.whitespace-pre-wrap'));
       // Filter out the main input box
       messages = potentialTexts.filter(el => !el.closest('textarea') && !el.closest('form'));
    }
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
console.log('PromptServer Copilot content script active (History Mode).');
