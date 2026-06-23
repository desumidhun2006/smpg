'use client';

import DraftCard from './DraftCard';

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

interface SidebarProps {
  drafts: Draft[];
  history: HistoryItem[];
  activeDraftId: string | null;
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ drafts, history, activeDraftId, onSelectDraft, onDeleteDraft, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          SMPG
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

        <div className="sidebar-section" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="sidebar-section-title">Posted ({history.length})</div>
          {history.length === 0 && (
            <div className="empty-state" style={{ padding: 16, fontSize: 13 }}>
              No posts yet
            </div>
          )}
          {history.map(item => (
            <DraftCard
              key={item.id}
              draft={item}
              onClick={() => {}}
              type="history"
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
