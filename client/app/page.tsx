'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UploadForm from './components/UploadForm';
import PostPreview from './components/PostPreview';

const API_BASE = 'http://localhost:5001';

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
  postUrl?: string;
}

interface LinkedInUser {
  sub: string;
  name: string;
  picture: string;
  profileUrl: string;
}

function loadDrafts(): Draft[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('smpg_drafts') || '[]'); } catch { return []; }
}

function saveDrafts(drafts: Draft[]) {
  localStorage.setItem('smpg_drafts', JSON.stringify(drafts));
}

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('smpg_history') || '[]'); } catch { return []; }
}

function saveHistory(history: HistoryItem[]) {
  localStorage.setItem('smpg_history', JSON.stringify(history));
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
  const [linkedinUser, setLinkedinUser] = useState<LinkedInUser | null>(null);
  const [linkedinToken, setLinkedinToken] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  useEffect(() => {
    const loadedHistory = loadHistory();
    setDrafts(loadDrafts());

    const savedToken = localStorage.getItem('smpg_linkedin_token');
    const savedUser = localStorage.getItem('smpg_linkedin_user');
    if (savedToken && savedUser) {
      setLinkedinToken(savedToken);
      setLinkedinUser(JSON.parse(savedUser));
      verifyLinkedInPosts(loadedHistory, savedToken);
    } else {
      const cleaned = loadedHistory.filter(i => i.postUrl);
      if (cleaned.length !== loadedHistory.length) {
        setHistory(cleaned);
        saveHistory(cleaned);
      } else {
        setHistory(loadedHistory);
      }
    }

    const handler = (e: MessageEvent) => {
      if (e.data && e.data.accessToken) {
        setLinkedinToken(e.data.accessToken);
        setLinkedinUser(e.data.user);
        localStorage.setItem('smpg_linkedin_token', e.data.accessToken);
        localStorage.setItem('smpg_linkedin_user', JSON.stringify(e.data.user));
        verifyLinkedInPosts(loadHistory(), e.data.accessToken);
      }
      if (e.data && e.data.error) {
        setError('LinkedIn login failed: ' + e.data.error);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const verifyLinkedInPosts = async (items: HistoryItem[], token: string) => {
    const linkedinPosts = items.filter(i => i.postUrl && i.platforms.includes('linkedin'));
    const nonLinkedin = items.filter(i => !i.postUrl || !i.platforms.includes('linkedin'));

    const toKeep: HistoryItem[] = [...nonLinkedin];

    const checks = linkedinPosts.map(async (item) => {
      try {
        const res = await fetch(`${API_BASE}/api/linkedin/check-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postUrl: item.postUrl, accessToken: token }),
        });
        const data = await res.json();
        if (data.exists) toKeep.push(item);
      } catch {
        toKeep.push(item);
      }
    });

    await Promise.all(checks);

    setHistory(toKeep);
    saveHistory(toKeep);
  };

  const handleLinkedInLogin = () => {
    window.open(`${API_BASE}/api/linkedin/auth`, 'linkedin-auth', 'width=600,height=700');
  };

  const handleLinkedInLogout = () => {
    setLinkedinToken(null);
    setLinkedinUser(null);
    localStorage.removeItem('smpg_linkedin_token');
    localStorage.removeItem('smpg_linkedin_user');
  };

  const handleGenerate = async (desc: string, platforms: string[], files: File[]) => {
    setLoading(true);
    setError(null);
    setDescription(desc);

    const base64Images: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      base64Images.push(base64);
    }
    setCurrentImages(base64Images);

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

  const handleSaveDraft = (content: Record<string, string>, platforms: string[], desc: string) => {
    const draft: Draft = {
      id: crypto.randomUUID(),
      content,
      platforms,
      description: desc,
      createdAt: new Date().toISOString(),
    };
    const updated = [draft, ...drafts];
    setDrafts(updated);
    saveDrafts(updated);
  };

  const handlePost = async (content: Record<string, string>, platforms: string[], desc: string) => {
    let postUrl: string | undefined;

    if (platforms.includes('linkedin')) {
      if (!linkedinToken) {
        setError('Please connect LinkedIn first');
        return;
      }

      setPosting(true);
      try {
        const postText = Object.values(content)[0];
        const res = await fetch(`${API_BASE}/api/linkedin/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: postText,
            accessToken: linkedinToken,
            images: currentImages,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'LinkedIn post failed');
        }

        const result = await res.json();
        postUrl = result.postUrl;
      } catch (err: any) {
        setError('LinkedIn post failed: ' + err.message);
        setPosting(false);
        return;
      }
      setPosting(false);
    }

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      content,
      platforms,
      description: desc,
      postedAt: new Date().toISOString(),
      postUrl,
    };
    const updated = [item, ...history];
    setHistory(updated);
    saveHistory(updated);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    saveDrafts(updated);
    if (activeDraftId === id) {
      setGeneratedPosts(null);
      setActiveDraftId(null);
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
    setCurrentImages([]);
  };

  return (
    <div className="app-container">
      <Sidebar
        drafts={drafts}
        activeDraftId={activeDraftId}
        onSelectDraft={handleSelectDraft}
        onDeleteDraft={handleDeleteDraft}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        linkedinUser={linkedinUser}
        onLinkedInLogin={handleLinkedInLogin}
        onLinkedInLogout={handleLinkedInLogout}
      />

      <main className="main-content">
        {error && (
          <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 16, color: '#dc2626', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>x</button>
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
            linkedinConnected={!!linkedinToken}
            posting={posting}
          />
        ) : (
          !loading && <UploadForm onGenerate={handleGenerate} loading={loading} />
        )}
      </main>
    </div>
  );
}
