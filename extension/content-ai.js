// content-ai.js - Injected into AI chat pages to extract prompts

function getSource() {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('grok')) return 'grok';
  if (host.includes('openai') || host.includes('chatgpt')) return 'chatgpt';
  if (host.includes('claude')) return 'claude';
  return 'ai';
}

// Global Floating Action Button
let fab = null;
let tooltip = null;
let currentSelection = "";

function createFAB() {
  if (document.getElementById('promptserver-global-fab')) return;

  // Create the FAB
  fab = document.createElement('button');
  fab.id = 'promptserver-global-fab';
  fab.className = 'promptserver-fab locked';
  fab.title = 'Save Prompt';

  // Using Emojis to bypass Trusted Types / strict CSP
  // Default state is locked (copy/save icon, but disabled conceptually)
  fab.textContent = '🔒';

  // Create tooltip for messages
  tooltip = document.createElement('div');
  tooltip.className = 'promptserver-fab-tooltip';
  tooltip.textContent = 'No text selected';
  
  // Append to body securely
  try {
    document.body.appendChild(fab);
    document.body.appendChild(tooltip);
  } catch (err) {
    console.warn("PromptServer: Failed to inject global FAB.");
    return;
  }

  // Handle FAB click
  fab.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentSelection) {
      showTooltip('No text selected', 'error');
      return;
    }

    // Attempt to save
    fab.classList.add('saving');
    fab.textContent = '⏳';
    fab.disabled = true;

    chrome.runtime.sendMessage({
      action: 'SAVE_PROMPT',
      content: currentSelection,
      source: getSource()
    }, (response) => {
      fab.disabled = false;
      fab.classList.remove('saving');
      
      if (response && response.success) {
        fab.classList.add('success');
        fab.textContent = '🎉';
        showTooltip('Saved successfully!', 'success');
        
        setTimeout(() => {
          fab.classList.remove('success');
          window.getSelection().removeAllRanges();
          updateFABState(); // Revert to locked state
        }, 1500);
      } else {
        fab.classList.add('error');
        fab.textContent = '❌';
        showTooltip('Failed to save', 'error');
        
        setTimeout(() => {
          fab.classList.remove('error');
          updateFABState();
        }, 1500);
      }
    });
  });
}

function showTooltip(message, type) {
  if (!tooltip) return;
  tooltip.textContent = message;
  tooltip.className = `promptserver-fab-tooltip show ${type}`;
  
  setTimeout(() => {
    tooltip.classList.remove('show');
  }, 2000);
}

function updateFABState() {
  if (!fab) return;
  
  // Don't update state if we are currently saving
  if (fab.classList.contains('saving') || fab.classList.contains('success')) return;

  let selection;
  try {
      selection = window.getSelection();
  } catch (err) {
      return;
  }
  
  currentSelection = selection.toString().trim();

  if (currentSelection) {
    fab.classList.remove('locked');
    fab.classList.add('ready');
    // Checkmark when text is selected
    fab.textContent = '✅';
  } else {
    fab.classList.add('locked');
    fab.classList.remove('ready');
    // Locked / Copy icon when no text is selected
    fab.textContent = '🔒';
  }
}

// Initialize the FAB
createFAB();

// Listen for selection changes using mouse and keyboard
document.addEventListener('mouseup', () => setTimeout(updateFABState, 10), true);
document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
    setTimeout(updateFABState, 10);
  }
}, true);
document.addEventListener('selectionchange', () => setTimeout(updateFABState, 10), true);

console.log('PromptServer Copilot content script active (Global FAB Mode).');
