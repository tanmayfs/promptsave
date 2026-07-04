const STORAGE_KEY = 'prompt_server_mvp_prompts';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const getPrompts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to parse prompts from localStorage', error);
    return [];
  }
};

export const savePrompts = (prompts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to save prompts to localStorage', error);
  }
};

export const addPrompt = (title, content, tags = []) => {
  const prompts = getPrompts();
  const now = Date.now();
  const newPrompt = {
    id: generateId(),
    title: title.trim(),
    content: content.trim(),
    tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    versions: [] // empty version history initially
  };
  
  prompts.unshift(newPrompt); // Add to the top
  savePrompts(prompts);
  return prompts;
};

export const updatePrompt = (id, title, content, tags = []) => {
  const prompts = getPrompts();
  const index = prompts.findIndex(p => p.id === id);
  if (index === -1) return prompts;
  
  const current = prompts[index];
  const now = Date.now();
  
  // Create a snapshot of the current state for version history before editing
  const versionSnapshot = {
    versionId: generateId(),
    title: current.title,
    content: current.content,
    updatedAt: current.updatedAt
  };
  
  // Update details and prepend the old snapshot to versions list
  prompts[index] = {
    ...current,
    title: title.trim(),
    content: content.trim(),
    tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
    updatedAt: now,
    versions: [versionSnapshot, ...current.versions]
  };
  
  savePrompts(prompts);
  return prompts;
};

export const restoreVersion = (promptId, versionId) => {
  const prompts = getPrompts();
  const index = prompts.findIndex(p => p.id === promptId);
  if (index === -1) return prompts;
  
  const current = prompts[index];
  const versionIndex = current.versions.findIndex(v => v.versionId === versionId);
  if (versionIndex === -1) return prompts;
  
  const selectedVersion = current.versions[versionIndex];
  const now = Date.now();
  
  // Save current state to history before restoring
  const currentSnapshot = {
    versionId: generateId(),
    title: current.title,
    content: current.content,
    updatedAt: current.updatedAt
  };
  
  // Remove the restored version from the history list, and prepend current snapshot
  const remainingVersions = [...current.versions];
  remainingVersions.splice(versionIndex, 1);
  
  prompts[index] = {
    ...current,
    title: selectedVersion.title,
    content: selectedVersion.content,
    updatedAt: now,
    versions: [currentSnapshot, ...remainingVersions]
  };
  
  savePrompts(prompts);
  return prompts;
};

export const deletePrompt = (id) => {
  const prompts = getPrompts();
  const index = prompts.findIndex(p => p.id === id);
  if (index === -1) return prompts;
  
  prompts[index] = {
    ...prompts[index],
    status: 'deleted',
    updatedAt: Date.now()
  };
  
  savePrompts(prompts);
  return prompts;
};

export const restorePrompt = (id) => {
  const prompts = getPrompts();
  const index = prompts.findIndex(p => p.id === id);
  if (index === -1) return prompts;
  
  prompts[index] = {
    ...prompts[index],
    status: 'active',
    updatedAt: Date.now()
  };
  
  savePrompts(prompts);
  return prompts;
};

export const deletePromptPermanently = (id) => {
  const prompts = getPrompts();
  const filtered = prompts.filter(p => p.id !== id);
  savePrompts(filtered);
  return filtered;
};
