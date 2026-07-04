import React from 'react';
import { RotateCcw, Trash2, Info, RefreshCw } from 'lucide-react';

export default function Bin({ deletedPrompts, onRestorePrompt, onDeletePermanently, onAddToast }) {
  const handleRestore = (id) => {
    onRestorePrompt(id);
  };

  const handleDeletePermanently = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this prompt? This action is irrecoverable.')) {
      onDeletePermanently(id);
    }
  };

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
      {deletedPrompts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Trash2 size={28} />
          </div>
          <h3 className="empty-state-title">Your trash is empty</h3>
          <p className="empty-state-description">
            Prompts you delete will appear here. You can restore them to your library or delete them permanently.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              backgroundColor: 'var(--accent-warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Info size={16} />
            <span>Items in the trash can be restored back to your library or permanently destroyed.</span>
          </div>

          <div className="prompts-grid">
            {deletedPrompts.map((prompt) => (
              <div key={prompt.id} className="prompt-card" style={{ cursor: 'default' }}>
                <div className="prompt-card-header">
                  <h3 className="prompt-card-title">{prompt.title}</h3>
                  <span className="prompt-card-date">Deleted: {formatDate(prompt.updatedAt)}</span>
                </div>
                <p className="prompt-card-body">{prompt.content}</p>
                
                <div className="prompt-card-footer">
                  <div className="prompt-card-tags">
                    {prompt.tags && prompt.tags.map((tag) => (
                      <span key={tag} className="prompt-card-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="prompt-card-actions">
                    <button
                      className="card-action-btn restore"
                      onClick={() => handleRestore(prompt.id)}
                      title="Restore to Library"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      className="card-action-btn delete"
                      onClick={() => handleDeletePermanently(prompt.id)}
                      title="Delete Permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
