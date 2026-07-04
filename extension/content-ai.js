// content-ai.js - Injected into AI chat pages to extract prompts

function getSource() {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('grok')) return 'grok';
  if (host.includes('openai') || host.includes('chatgpt')) return 'chatgpt';
  if (host.includes('claude')) return 'claude';
  return 'ai';
}

function getPromptText(inputEl) {
  if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
    return inputEl.value;
  }
  // contenteditable elements
  return inputEl.innerText || inputEl.textContent || '';
}

function injectSaveButton() {
  const source = getSource();
  let inputEl = null;

  if (source === 'chatgpt') {
    inputEl = document.querySelector('#prompt-textarea');
  } else if (source === 'claude') {
    // Claude uses a contenteditable div inside a editor container
    inputEl = document.querySelector('div[contenteditable="true"], [role="textbox"]');
  } else if (source === 'grok') {
    // Grok uses textarea or contenteditable input
    inputEl = document.querySelector('textarea, div[contenteditable="true"]');
  }

  if (!inputEl) return;

  // Find the container to append to (parent of input element)
  const container = inputEl.parentElement;
  if (!container) return;

  // Prevent duplicate injections
  if (container.querySelector('.promptserver-save-btn')) return;

  // Create the save button
  const button = document.createElement('button');
  button.className = 'promptserver-save-btn';
  button.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
    <span>Save to Library</span>
  `;
  button.title = 'Save prompt template to your PromptServer Library';

  // Ensure parent container has relative position to absolute place the button
  const containerStyle = window.getComputedStyle(container);
  if (containerStyle.position === 'static') {
    container.style.position = 'relative';
  }

  // Adjust button position absolute inside container
  // Placing it on the right side next to other input actions
  button.style.position = 'absolute';
  button.style.zIndex = '99';
  
  if (source === 'chatgpt') {
    button.style.right = '58px';
    button.style.bottom = '10px';
  } else if (source === 'claude') {
    button.style.right = '48px';
    button.style.bottom = '12px';
  } else {
    // Grok / Default
    button.style.right = '48px';
    button.style.bottom = '10px';
  }

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const text = getPromptText(inputEl).trim();
    if (!text) {
      // Temporarily show empty warning on the button
      const label = button.querySelector('span');
      const originalText = label.textContent;
      label.textContent = 'Prompt is empty!';
      button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      setTimeout(() => {
        label.textContent = originalText;
        button.style.borderColor = '';
      }, 2000);
      return;
    }

    const label = button.querySelector('span');
    label.textContent = 'Saving...';
    button.disabled = true;

    chrome.runtime.sendMessage({
      action: 'SAVE_PROMPT',
      content: text,
      source: source
    }, (response) => {
      button.disabled = false;
      if (response && response.success) {
        label.textContent = 'Saved!';
        button.classList.add('success');
        setTimeout(() => {
          label.textContent = 'Save to Library';
          button.classList.remove('success');
        }, 2000);
      } else {
        label.textContent = 'Failed';
        button.classList.add('error');
        setTimeout(() => {
          label.textContent = 'Save to Library';
          button.classList.remove('error');
        }, 2000);
      }
    });
  });

  container.appendChild(button);
}

// Polling interval to detect dynamically loaded input areas
const intervalId = setInterval(injectSaveButton, 1000);
console.log('PromptServer Copilot content script active.');
