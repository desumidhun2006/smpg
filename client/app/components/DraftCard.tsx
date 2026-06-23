'use client';

interface DraftCardProps {
  draft: {
    id: string;
    content: Record<string, string> | string;
    platforms: string[];
    description: string;
    createdAt?: string;
    postedAt?: string;
  };
  isActive?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  type?: 'draft' | 'history';
}

export default function DraftCard({ draft, isActive, onClick, onDelete, type = 'draft' }: DraftCardProps) {
  const dateStr = draft.createdAt || draft.postedAt;
  const date = dateStr ? new Date(dateStr).toLocaleDateString() : '';
  const description = draft.description || 'No description';
  const platforms = draft.platforms || [];

  return (
    <div className={`draft-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="delete-btn-container">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="draft-card-title">{description}</div>
          <div className="draft-card-meta">{date}</div>
          <div className="draft-card-platforms">
            {platforms.map(p => (
              <span key={p} className="platform-badge">{p}</span>
            ))}
          </div>
        </div>
        {onDelete && (
          <button
            className="btn btn-danger"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
