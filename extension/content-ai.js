// content-ai.js - Injected into AI chat pages to extract prompts

function getSource() {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('grok')) return 'grok';
  if (host.includes('openai') || host.includes('chatgpt')) return 'chatgpt';
  if (host.includes('claude')) return 'claude';
  return 'ai';
}

// Trusted Types Safe SVG Generators
function createTerminalIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", "4 17 10 11 4 5");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "12");
  line.setAttribute("y1", "19");
  line.setAttribute("x2", "20");
  line.setAttribute("y2", "19");

  svg.appendChild(polyline);
  svg.appendChild(line);
  return svg;
}

function createCheckIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", "20 6 9 17 4 12");
  
  svg.appendChild(polyline);
  return svg;
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

  // Use the safe SVG Terminal (logo) icon by default
  fab.appendChild(createTerminalIcon());

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
    fab.disabled = true;
    
    // Change icon to loading (we can just text for loading to avoid complex svg)
    fab.innerHTML = '';
    fab.textContent = '...';

    chrome.runtime.sendMessage({
      action: 'SAVE_PROMPT',
      content: currentSelection,
      source: getSource()
    }, (response) => {
      fab.disabled = false;
      fab.classList.remove('saving');
      fab.innerHTML = '';
      
      if (response && response.success) {
        fab.classList.add('success');
        fab.appendChild(createCheckIcon());
        showTooltip('Saved successfully!', 'success');
        
        setTimeout(() => {
          fab.classList.remove('success');
          window.getSelection().removeAllRanges();
          updateFABState(); // Revert to locked/ready state based on new selection
        }, 1500);
      } else {
        fab.classList.add('error');
        fab.textContent = 'X';
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

  // Reset icon
  fab.innerHTML = '';

  if (currentSelection) {
    fab.classList.remove('locked');
    fab.classList.add('ready');
    // Checkmark when text is selected
    fab.appendChild(createCheckIcon());
  } else {
    fab.classList.add('locked');
    fab.classList.remove('ready');
    // Terminal (Logo) icon when no text is selected
    fab.appendChild(createTerminalIcon());
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

console.log('PromptServer Copilot content script active (Global SVG FAB Mode).');
