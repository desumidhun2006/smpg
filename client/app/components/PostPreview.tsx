'use client';

import { useState } from 'react';

interface PostPreviewProps {
  posts: Record<string, string>;
  onSaveDraft: (content: Record<string, string>, platforms: string[], description: string) => void;
  onPost: (content: Record<string, string>, platforms: string[], description: string) => void;
  description: string;
  onClear: () => void;
}

export default function PostPreview({ posts, onSaveDraft, onPost, description, onClear }: PostPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(Object.values(posts)[0] || '');

  const platforms = Object.keys(posts);
  const isUniversal = platforms.length > 1 && new Set(Object.values(posts)).size === 1;

  const handleSaveDraft = () => {
    const content: Record<string, string> = {};
    for (const p of platforms) content[p] = editedContent;
    onSaveDraft(content, platforms, description);
    onClear();
  };

  const handlePost = () => {
    const content: Record<string, string> = {};
    for (const p of platforms) content[p] = editedContent;
    onPost(content, platforms, description);
    onClear();
  };

  return (
    <div className="post-preview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Generated Post</h2>
        <button className="btn btn-secondary" onClick={onClear} style={{ fontSize: 12 }}>
          New Post
        </button>
      </div>

      {isUniversal && (
        <div className="draft-card-platforms" style={{ margin: '8px 0 16px' }}>
          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>Posting to:</span>
          {platforms.map(p => (
            <span key={p} className="platform-badge">{p}</span>
          ))}
        </div>
      )}

      {!isUniversal && (
        <div className="platform-tabs">
          {platforms.map(platform => (
            <button
              key={platform}
              className="platform-tab active"
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="post-content">
        {editing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ minHeight: 200 }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{editedContent}</div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
          {editing ? 'Done Editing' : 'Edit'}
        </button>
        <button className="btn btn-primary" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button className="btn btn-success" onClick={handlePost}>
          Post Now
        </button>
      </div>
    </div>
  );
}
