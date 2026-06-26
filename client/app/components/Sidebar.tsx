'use client';

import DraftCard from './DraftCard';

interface Draft {
  id: string;
  content: Record<string, string> | string;
  platforms: string[];
  description: string;
  createdAt: string;
}

interface LinkedInUser {
  sub: string;
  name: string;
  picture: string;
}

interface SidebarProps {
  drafts: Draft[];
  activeDraftId: string | null;
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  linkedinUser: LinkedInUser | null;
  onLinkedInLogin: () => void;
  onLinkedInLogout: () => void;
}

export default function Sidebar({ drafts, activeDraftId, onSelectDraft, onDeleteDraft, isOpen, onToggle, linkedinUser, onLinkedInLogin, onLinkedInLogout }: SidebarProps) {
  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          SMPG
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          {linkedinUser ? (
            <div style={{ position: 'relative' }}>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 6,
                  border: '1px solid #0a66c2', background: 'white',
                  color: '#0a66c2', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', width: '100%',
                }}
              >
                {linkedinUser.picture && (
                  <img src={linkedinUser.picture} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                )}
                <span>{linkedinUser.name}</span>
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); onLinkedInLogout(); }}
                title="Disconnect LinkedIn"
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#ef4444', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: 10, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                x
              </button>
            </div>
          ) : (
            <button onClick={onLinkedInLogin} style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid #0a66c2', background: '#0a66c2',
              color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Connect LinkedIn
            </button>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Drafts ({drafts.length})</div>
          {drafts.length === 0 && (
            <div className="empty-state" style={{ padding: 16, fontSize: 13 }}>
              No drafts yet
            </div>
          )}
          {drafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              isActive={activeDraftId === draft.id}
              onClick={() => onSelectDraft(draft)}
              onDelete={() => onDeleteDraft(draft.id)}
              type="draft"
            />
          ))}
        </div>
      </div>

      <button className="mobile-sidebar-toggle" onClick={onToggle}>
        {isOpen ? 'x' : '='}
      </button>
    </>
  );
}
