import React, { useState } from 'react';
import { Search, Trash2, Copy, Check, FileText, ChevronRight, Inbox } from 'lucide-react';

export default function PromptList({ prompts, onSelectPrompt, onDeletePrompt, onAddToast, onNavigateToAdd }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Extract all unique tags from active prompts
  const allTags = Array.from(
    new Set(prompts.flatMap((p) => p.tags || []))
  ).sort();

  const handleCopy = (e, prompt) => {
    e.stopPropagation(); // Prevent opening the detail card
    navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    onAddToast('Copied to clipboard!', 'success');
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // Prevent opening the detail card
    onDeletePrompt(id);
  };

  // Filter prompts based on search and selected tag
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    const matchesTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {prompts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={28} />
          </div>
          <h3 className="empty-state-title">Your library is empty</h3>
          <p className="empty-state-description">
            Create your first reusable prompt to start building your library.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            Add a Prompt
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="search-container">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, content, or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="filter-tags-row">
              <button
                className={`filter-tag-chip ${selectedTag === null ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                All Prompts
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`filter-tag-chip ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {filteredPrompts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={28} />
              </div>
              <h3 className="empty-state-title">No prompts found</h3>
              <p className="empty-state-description">
                Try adjusting your search terms or clearing your tag filters.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearch('');
                  setSelectedTag(null);
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="prompts-grid">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="prompt-card"
                  onClick={() => onSelectPrompt(prompt)}
                >
                  <div className="prompt-card-header">
                    <h3 className="prompt-card-title">{prompt.title}</h3>
                    <span className="prompt-card-date">{formatDate(prompt.updatedAt)}</span>
                  </div>
                  <p className="prompt-card-body">{prompt.content}</p>
                  
                  <div className="prompt-card-footer">
                    <div className="prompt-card-tags">
                      {prompt.tags && prompt.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="prompt-card-tag">
                          #{tag}
                        </span>
                      ))}
                      {prompt.tags && prompt.tags.length > 3 && (
                        <span className="prompt-card-tag">
                          +{prompt.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="prompt-card-actions">
                      <button
                        className="card-action-btn"
                        onClick={(e) => handleCopy(e, prompt)}
                        title="Copy to clipboard"
                      >
                        {copiedId === prompt.id ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        className="card-action-btn delete"
                        onClick={(e) => handleDelete(e, prompt.id)}
                        title="Move to Bin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
