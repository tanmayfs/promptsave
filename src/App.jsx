import React, { useState, useEffect } from 'react';
import { Library, PlusCircle, Trash, Terminal, Sun, Moon } from 'lucide-react';
import {
  getPrompts,
  addPrompt,
  updatePrompt,
  restoreVersion,
  deletePrompt,
  restorePrompt,
  deletePromptPermanently,
} from './utils/storage';
import PromptList from './components/PromptList';
import PromptForm from './components/PromptForm';
import PromptDetail from './components/PromptDetail';
import Bin from './components/Bin';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [currentView, setCurrentView] = useState('library'); // 'library' | 'add' | 'bin'
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prompt_server_theme') || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prompt_server_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load prompts initially
  useEffect(() => {
    setPrompts(getPrompts());
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreatePrompt = (title, content, tags) => {
    const updated = addPrompt(title, content, tags);
    setPrompts(updated);
    addToast('Saved to library', 'success');
    setCurrentView('library');
  };

  const handleUpdatePrompt = (id, title, content, tags) => {
    const updated = updatePrompt(id, title, content, tags);
    setPrompts(updated);
    addToast('Edited', 'success');
    
    // Update active prompt display in detail panel
    const newActivePrompt = updated.find((p) => p.id === id);
    setSelectedPrompt(newActivePrompt);
  };

  const handleRestoreVersion = (promptId, versionId) => {
    const updated = restoreVersion(promptId, versionId);
    setPrompts(updated);
    addToast('Version restored!', 'success');
    
    // Update active prompt display in detail panel
    const newActivePrompt = updated.find((p) => p.id === promptId);
    setSelectedPrompt(newActivePrompt);
  };

  const handleDeletePrompt = (id) => {
    const updated = deletePrompt(id);
    setPrompts(updated);
    addToast('Removed from library', 'danger');
    if (selectedPrompt && selectedPrompt.id === id) {
      setSelectedPrompt(null);
    }
  };

  const handleRestorePrompt = (id) => {
    const updated = restorePrompt(id);
    setPrompts(updated);
    addToast('Restored to library', 'success');
  };

  const handleDeletePermanently = (id) => {
    const updated = deletePromptPermanently(id);
    setPrompts(updated);
    addToast('Deleted permanently', 'danger');
  };

  // Group prompts
  const activePrompts = prompts.filter((p) => p.status === 'active');
  const deletedPrompts = prompts.filter((p) => p.status === 'deleted');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <a href="/" className="brand" onClick={(e) => { e.preventDefault(); setCurrentView('library'); }}>
          <div className="brand-icon">
            <Terminal size={18} />
          </div>
          <span className="brand-title">PromptServer</span>
        </a>

        <nav className="nav-menu">
          <button
            className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentView('library')}
          >
            <Library size={18} className="nav-icon" />
            <span>Library</span>
            <span className="nav-count">{activePrompts.length}</span>
          </button>
          
          <button
            className={`nav-item ${currentView === 'add' ? 'active' : ''}`}
            onClick={() => setCurrentView('add')}
          >
            <PlusCircle size={18} className="nav-icon" />
            <span>Add Prompt</span>
          </button>

          <button
            className={`nav-item ${currentView === 'bin' ? 'active' : ''}`}
            onClick={() => setCurrentView('bin')}
          >
            <Trash size={18} className="nav-icon" />
            <span>Bin</span>
            <span className="nav-count">{deletedPrompts.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Local MVP v1.0.0</p>
          <p style={{ marginTop: '4px' }}>Data stored in browser</p>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title-section">
            {currentView === 'library' && (
              <>
                <h1>Prompt Library</h1>
                <p>Browse, copy, and manage your reusable prompt engineering templates.</p>
              </>
            )}
            {currentView === 'add' && (
              <>
                <h1>New Prompt</h1>
                <p>Compose and save a new instruction template to your library.</p>
              </>
            )}
            {currentView === 'bin' && (
              <>
                <h1>Trash Bin</h1>
                <p>Restore discarded prompts or delete them permanently.</p>
              </>
            )}
          </div>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <div className="workspace-view">
          {currentView === 'library' && (
            <PromptList
              prompts={activePrompts}
              onSelectPrompt={setSelectedPrompt}
              onDeletePrompt={handleDeletePrompt}
              onAddToast={addToast}
              onNavigateToAdd={() => setCurrentView('add')}
            />
          )}

          {currentView === 'add' && (
            <PromptForm onSubmit={handleCreatePrompt} />
          )}

          {currentView === 'bin' && (
            <Bin
              deletedPrompts={deletedPrompts}
              onRestorePrompt={handleRestorePrompt}
              onDeletePermanently={handleDeletePermanently}
              onAddToast={addToast}
            />
          )}
        </div>
      </main>

      {/* Prompt Details Overlay Pane */}
      {selectedPrompt && (
        <PromptDetail
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onUpdatePrompt={handleUpdatePrompt}
          onDeletePrompt={handleDeletePrompt}
          onRestoreVersion={handleRestoreVersion}
          onAddToast={addToast}
        />
      )}

      {/* Flashing Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
