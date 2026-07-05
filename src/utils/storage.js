import { supabase } from './supabaseClient';

// Helper to generate unique IDs if needed
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const getPrompts = async () => {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch prompts from Supabase', error);
    return [];
  }
};

export const addPrompt = async (title, content, tags = []) => {
  try {
    const now = Date.now();
    const newPrompt = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      versions: []
    };
    
    const { error } = await supabase
      .from('prompts')
      .insert([newPrompt]);
      
    if (error) throw error;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to add prompt', error);
    return await getPrompts(); // return current state if failed
  }
};

export const updatePrompt = async (id, title, content, tags = []) => {
  try {
    // First, fetch the current prompt to get its state for versioning
    const { data: currentPrompts, error: fetchError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id);
      
    if (fetchError || !currentPrompts || currentPrompts.length === 0) {
      throw new Error('Prompt not found');
    }
    
    const current = currentPrompts[0];
    const now = Date.now();
    
    const versionSnapshot = {
      versionId: generateId(),
      title: current.title,
      content: current.content,
      updatedAt: current.updatedAt
    };
    
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        title: title.trim(),
        content: content.trim(),
        tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
        updatedAt: now,
        versions: [versionSnapshot, ...(current.versions || [])]
      })
      .eq('id', id);
      
    if (updateError) throw updateError;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to update prompt', error);
    return await getPrompts();
  }
};

export const restoreVersion = async (promptId, versionId) => {
  try {
    const { data: currentPrompts, error: fetchError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId);
      
    if (fetchError || !currentPrompts || currentPrompts.length === 0) {
      throw new Error('Prompt not found');
    }
    
    const current = currentPrompts[0];
    const versions = current.versions || [];
    const versionIndex = versions.findIndex(v => v.versionId === versionId);
    if (versionIndex === -1) return await getPrompts();
    
    const selectedVersion = versions[versionIndex];
    const now = Date.now();
    
    const currentSnapshot = {
      versionId: generateId(),
      title: current.title,
      content: current.content,
      updatedAt: current.updatedAt
    };
    
    const remainingVersions = [...versions];
    remainingVersions.splice(versionIndex, 1);
    
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        title: selectedVersion.title,
        content: selectedVersion.content,
        updatedAt: now,
        versions: [currentSnapshot, ...remainingVersions]
      })
      .eq('id', promptId);
      
    if (updateError) throw updateError;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to restore version', error);
    return await getPrompts();
  }
};

export const deletePrompt = async (id) => {
  try {
    const { error } = await supabase
      .from('prompts')
      .update({
        status: 'deleted',
        updatedAt: Date.now()
      })
      .eq('id', id);
      
    if (error) throw error;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to delete prompt', error);
    return await getPrompts();
  }
};

export const restorePrompt = async (id) => {
  try {
    const { error } = await supabase
      .from('prompts')
      .update({
        status: 'active',
        updatedAt: Date.now()
      })
      .eq('id', id);
      
    if (error) throw error;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to restore prompt', error);
    return await getPrompts();
  }
};

export const deletePromptPermanently = async (id) => {
  try {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return await getPrompts();
  } catch (error) {
    console.error('Failed to delete prompt permanently', error);
    return await getPrompts();
  }
};
