'use client';

import { useState, useRef } from 'react';

interface UploadFormProps {
  onGenerate: (description: string, platforms: string[], files: File[]) => void;
  loading: boolean;
}

export default function UploadForm({ onGenerate, loading }: UploadFormProps) {
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);

    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || platforms.length === 0) return;
    onGenerate(description, platforms, files);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">Create Post</h2>

      <div
        className="upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('dragover');
          const dropped = Array.from(e.dataTransfer.files);
          setFiles(prev => [...prev, ...dropped]);
          dropped.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
          });
        }}
      >
        <p>Click or drag images/videos here</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {previews.length > 0 && (
          <div className="file-preview">
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={src} className="file-thumb" alt={`Preview ${i}`} />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#ef4444', color: 'white', border: 'none',
                    cursor: 'pointer', fontSize: 12, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your event, photo, or content..."
          style={{ marginTop: 8 }}
        />
      </div>

      <div className="platform-selector">
        {['linkedin', 'instagram', 'facebook'].map(platform => (
          <label key={platform} className="platform-checkbox">
            <input
              type="checkbox"
              checked={platforms.includes(platform)}
              onChange={() => togglePlatform(platform)}
            />
            <span style={{ textTransform: 'capitalize' }}>{platform}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !description.trim() || platforms.length === 0}
      >
        {loading ? 'Generating...' : 'Generate Post'}
      </button>
    </form>
  );
}
