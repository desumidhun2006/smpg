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
  const [activePlatform, setActivePlatform] = useState<string>(Object.keys(posts)[0] || 'linkedin');
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({...posts});

  const platforms = Object.keys(posts);

  const handleSaveDraft = () => {
    onSaveDraft(editedContent, platforms, description);
    onClear();
  };

  const handlePost = () => {
    onPost(editedContent, platforms, description);
    onClear();
  };

  const content = editing ? (editedContent[activePlatform] || '') : (posts[activePlatform] || '');

  return (
    <div className="post-preview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Generated Posts</h2>
        <button className="btn btn-secondary" onClick={onClear} style={{ fontSize: 12 }}>
          New Post
        </button>
      </div>

      <div className="platform-tabs">
        {platforms.map(platform => (
          <button
            key={platform}
            className={`platform-tab ${activePlatform === platform ? 'active' : ''}`}
            onClick={() => setActivePlatform(platform)}
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      <div className="post-content">
        {editing ? (
          <textarea
            value={editedContent[activePlatform] || ''}
            onChange={(e) => setEditedContent(prev => ({ ...prev, [activePlatform]: e.target.value }))}
            style={{ minHeight: 200 }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
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
