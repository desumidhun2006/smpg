'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UploadForm from './components/UploadForm';
import PostPreview from './components/PostPreview';

const API_BASE = 'http://localhost:5000';

interface Draft {
  id: string;
  content: Record<string, string> | string;
  platforms: string[];
  description: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  content: Record<string, string> | string;
  platforms: string[];
  description: string;
  postedAt: string;
}

export default function Home() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string> | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drafts`);
      const data = await res.json();
      setDrafts(data);
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchDrafts();
    fetchHistory();
  }, []);

  const handleGenerate = async (desc: string, platforms: string[], files: File[]) => {
    setLoading(true);
    setError(null);
    setDescription(desc);

    try {
      const formData = new FormData();
      formData.append('description', desc);
      formData.append('platforms', JSON.stringify(platforms));
      files.forEach(file => formData.append('images', file));

      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedPosts(data.posts);
    } catch (err: any) {
      setError(err.message || 'Failed to generate post');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (content: Record<string, string>, platforms: string[], desc: string) => {
    try {
      await fetch(`${API_BASE}/api/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms, description: desc }),
      });
      fetchDrafts();
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handlePost = async (content: Record<string, string>, platforms: string[], desc: string) => {
    try {
      await fetch(`${API_BASE}/api/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms, description: desc }),
      });
      fetchHistory();
    } catch (err) {
      console.error('Failed to post:', err);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/drafts/${id}`, { method: 'DELETE' });
      fetchDrafts();
      if (activeDraftId === id) {
        setGeneratedPosts(null);
        setActiveDraftId(null);
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const handleSelectDraft = (draft: Draft) => {
    setActiveDraftId(draft.id);
    setDescription(draft.description);
    if (typeof draft.content === 'object') {
      setGeneratedPosts(draft.content as Record<string, string>);
    } else {
      const platforms = draft.platforms || ['linkedin'];
      const posts: Record<string, string> = {};
      platforms.forEach(p => { posts[p] = draft.content as string; });
      setGeneratedPosts(posts);
    }
    setSidebarOpen(false);
  };

  const handleClear = () => {
    setGeneratedPosts(null);
    setDescription('');
    setActiveDraftId(null);
  };

  return (
    <div className="app-container">
      <Sidebar
        drafts={drafts}
        history={history}
        activeDraftId={activeDraftId}
        onSelectDraft={handleSelectDraft}
        onDeleteDraft={handleDeleteDraft}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="main-content">
        {error && (
          <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner" />
            Generating posts...
          </div>
        )}

        {!loading && generatedPosts ? (
          <PostPreview
            posts={generatedPosts}
            onSaveDraft={handleSaveDraft}
            onPost={handlePost}
            description={description}
            onClear={handleClear}
          />
        ) : (
          !loading && <UploadForm onGenerate={handleGenerate} loading={loading} />
        )}
      </main>
    </div>
  );
}
