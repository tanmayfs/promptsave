import React, { useState } from 'react';
import { X, Edit3, Trash2, Copy, Check, Clock, RotateCcw } from 'lucide-react';
import PromptForm from './PromptForm';

export default function PromptDetail({ prompt, onClose, onUpdatePrompt, onDeletePrompt, onRestoreVersion, onAddToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    onAddToast('Copied to clipboard!', 'success');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleEditSubmit = (title, content, tags) => {
    onUpdatePrompt(prompt.id, title, content, tags);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeletePrompt(prompt.id);
    onClose();
  };

  const handleRestore = (versionId) => {
    onRestoreVersion(prompt.id, versionId);
    onAddToast('Version restored!', 'success');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h2>{isEditing ? 'Edit Prompt' : 'Prompt Details'}</h2>
          <div className="detail-header-actions">
            {!isEditing && (
              <>
                <button
                  className="card-action-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit prompt"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="card-action-btn delete"
                  onClick={handleDelete}
                  title="Move to Bin"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button className="detail-close-btn" onClick={onClose} title="Close panel">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="detail-content">
          {isEditing ? (
            <PromptForm
              initialData={prompt}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save Changes"
            />
          ) : (
            <>
              <div>
                <h1 className="detail-title">{prompt.title}</h1>
                <div className="detail-meta">
                  <span>Last updated: {formatDate(prompt.updatedAt)}</span>
                </div>
              </div>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="detail-tags-section">
                  {prompt.tags.map((tag) => (
                    <span key={tag} className="tag-badge">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="detail-body-card">
                <button
                  className="card-action-btn copy-badge-btn"
                  onClick={handleCopy}
                  title="Copy prompt text"
                >
                  {copied ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <pre className="detail-body-text">{prompt.content}</pre>
              </div>

              {/* Version History section */}
              <div className="history-section">
                <h3 className="history-title">
                  <Clock size={16} className="text-secondary" />
                  Version History
                </h3>
                {prompt.versions && prompt.versions.length > 0 ? (
                  <div className="history-timeline">
                    {prompt.versions.map((version) => (
                      <div key={version.versionId} className="history-item">
                        <div className="history-item-header">
                          <span className="history-item-title">{version.title}</span>
                          <span className="history-item-time">{formatDate(version.updatedAt)}</span>
                        </div>
                        <div className="history-item-content">{version.content}</div>
                        <div className="history-item-actions">
                          <button
                            className="btn btn-secondary btn-success btn-xs"
                            onClick={() => handleRestore(version.versionId)}
                            style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
                          >
                            <RotateCcw size={12} />
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', paddingLeft: '4px' }}>
                    No previous versions found. Original copy.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
