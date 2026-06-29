'use client';

import { useState } from 'react';

interface PostPreviewProps {
  posts: Record<string, string>;
  onSaveDraft: (content: Record<string, string>, platforms: string[], description: string) => void;
  onPost: (content: Record<string, string>, platforms: string[], description: string) => void;
  description: string;
  onClear: () => void;
  linkedinConnected?: boolean;
  instagramConnected?: boolean;
  posting?: boolean;
  hasImages?: boolean;
}

export default function PostPreview({ posts, onSaveDraft, onPost, description, onClear, linkedinConnected, instagramConnected, posting, hasImages }: PostPreviewProps) {
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
  };

  const needsLinkedIn = platforms.includes('linkedin') && !linkedinConnected;
  const needsInstagram = platforms.includes('instagram') && !instagramConnected;
  const instagramNeedsImage = platforms.includes('instagram') && instagramConnected && !hasImages;

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

      {needsLinkedIn && (
        <div style={{ padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, marginBottom: 16, color: '#1d4ed8', fontSize: 14 }}>
          Connect your LinkedIn account in the sidebar to post here.
        </div>
      )}

      {needsInstagram && (
        <div style={{ padding: 12, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, marginBottom: 16, color: '#be123c', fontSize: 14 }}>
          Connect your Instagram account in the sidebar to post here.
        </div>
      )}

      {instagramNeedsImage && (
        <div style={{ padding: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, marginBottom: 16, color: '#c2410c', fontSize: 14 }}>
          Instagram requires at least one image to post.
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
          {editing ? 'Done Editing' : 'Edit'}
        </button>
        <button className="btn btn-primary" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button
          className="btn btn-success"
          onClick={handlePost}
          disabled={posting || needsLinkedIn || needsInstagram || instagramNeedsImage}
        >
          {posting ? 'Posting...' : needsLinkedIn ? 'Connect LinkedIn First' : needsInstagram ? 'Connect Instagram First' : instagramNeedsImage ? 'Add Image for Instagram' : 'Post Now'}
        </button>
      </div>
    </div>
  );
}
