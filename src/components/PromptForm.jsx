import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles, Tag, FileText } from 'lucide-react';

export default function PromptForm({ onSubmit, initialData = null, onCancel = null, submitLabel = "Save to Library" }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTags(initialData.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [initialData]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase();
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    onSubmit(title, content, tags);
    
    // Clear form if it's a create-form (no initialData)
    if (!initialData) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="prompt-title">
          <Sparkles size={16} className="text-secondary" />
          Prompt Title
        </label>
        <input
          id="prompt-title"
          type="text"
          className="form-input"
          placeholder="e.g., Python Code Refactorer, Marketing Copywriter..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="prompt-content">
          <FileText size={16} className="text-secondary" />
          Prompt Text
        </label>
        <textarea
          id="prompt-content"
          className="form-textarea"
          placeholder="Write or paste your system instructions or prompt template here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="prompt-tags">
          <Tag size={16} className="text-secondary" />
          Tags (Press Enter or comma to add)
        </label>
        <div className="tags-input-container">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag-badge">
              {tag}
              <button
                type="button"
                className="tag-remove-btn"
                onClick={() => handleRemoveTag(idx)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            id="prompt-tags"
            type="text"
            className="tags-text-input"
            placeholder={tags.length === 0 ? "coding, writing, summary..." : ""}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!title.trim() || !content.trim()}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
