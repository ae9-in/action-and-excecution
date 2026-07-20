'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, Download, Trash2, FileText, Film, Image, Music,
  Eye, X, Loader2, Plus, Search
} from 'lucide-react';
import { cn, formatBytes, formatDate } from '@/lib/utils';

interface FileRecord {
  id: string;
  title: string;
  cloudinaryUrl: string;
  thumbnailUrl?: string | null;
  resourceType: 'image' | 'video' | 'raw' | 'pdf';
  fileSizeBytes?: number | null;
  tags?: string[] | null;
  createdAt: string;
}

interface FileCategoryViewProps {
  businessId: string;
  businessSlug: string;
  categoryKey: string;
  categoryLabel: string;
  orgSlug: string;
  userRole: 'user' | 'admin' | 'super_admin';
  categoryId: number;
}

const RESOURCE_ICONS = {
  image: Image,
  video: Film,
  raw: FileText,
  pdf: FileText,
};

const STAGE_COLORS: Record<string, string> = {
  image: 'bg-violet-500/20 text-violet-300',
  video: 'bg-blue-500/20 text-blue-300',
  raw: 'bg-slate-500/20 text-slate-300',
  pdf: 'bg-rose-500/20 text-rose-300',
};

export function FileCategoryView({
  businessId,
  businessSlug,
  categoryKey,
  categoryLabel,
  orgSlug,
  userRole,
  categoryId,
}: FileCategoryViewProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<FileRecord | null>(null);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAdmin = userRole === 'admin' || userRole === 'super_admin';

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/files?businessId=${businessId}&categoryId=${categoryId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch files');
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [businessId, categoryId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = useCallback(
    async (rawFiles: FileList | File[]) => {
      const fileList = Array.from(rawFiles);
      if (fileList.length === 0) return;

      setUploading(true);
      setUploadProgress(0);
      setError('');

      for (const file of fileList) {
        try {
          // Determine resource type
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');
          const resourceType: 'image' | 'video' | 'raw' = isVideo ? 'video' : isImage ? 'image' : 'raw';

          // 1. Get signed signature
          const sigRes = await fetch('/api/upload-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgSlug,
              businessSlug,
              categoryKey,
              resourceType,
            }),
          });
          const sigData = await sigRes.json();
          if (!sigRes.ok) throw new Error(sigData.error || 'Failed to generate upload signature');

          // 2. Prepare Cloudinary FormData
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', sigData.apiKey);
          formData.append('timestamp', sigData.timestamp.toString());
          formData.append('signature', sigData.signature);
          formData.append('folder', sigData.folder);
          formData.append('public_id', sigData.publicId);
          if (sigData.eager) {
            formData.append('eager', sigData.eager);
          }

          // 3. Upload directly to Cloudinary
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          const cloudinaryUploadResponse = await new Promise<any>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                let errText = 'Cloudinary upload failed';
                try {
                  errText = JSON.parse(xhr.responseText).error?.message || errText;
                } catch {}
                reject(new Error(errText));
              }
            };
            xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`);
            xhr.send(formData);
          });

          // 4. Save metadata to internal database
          let thumbnailUrl = null;
          if (cloudinaryUploadResponse.eager && cloudinaryUploadResponse.eager.length > 0) {
            thumbnailUrl = cloudinaryUploadResponse.eager[0].secure_url;
          }

          // If the file is a PDF, we store it in the database with resourceType: 'pdf'
          const finalResourceType = file.type === 'application/pdf' ? 'pdf' : resourceType;

          const registerRes = await fetch('/api/files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId,
              categoryId,
              title: file.name.replace(/\.[^.]+$/, ''),
              cloudinaryPublicId: cloudinaryUploadResponse.public_id,
              cloudinaryUrl: cloudinaryUploadResponse.secure_url,
              thumbnailUrl,
              resourceType: finalResourceType,
              fileSizeBytes: file.size,
            }),
          });
          const registerData = await registerRes.json();
          if (!registerRes.ok) {
            throw new Error(registerData.error || 'Failed to save file metadata');
          }
        } catch (err: any) {
          console.error('Upload failed:', err);
          setError(err.message || 'File upload failed');
          break; // Stop uploading subsequent files
        }
      }

      setUploading(false);
      setUploadProgress(0);
      await fetchFiles();
    },
    [businessId, businessSlug, categoryId, categoryKey, fetchFiles, orgSlug]
  );

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file? This can be undone within 30 days.')) return;
    setError('');
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete file');
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const filtered = files.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400 underline font-medium">
            Dismiss
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
          dragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 hover:border-white/20'
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-slate-500" />
        <p className="text-slate-400 text-sm">
          Drag & drop files here, or{' '}
          <button onClick={() => fileInputRef.current?.click()} className="text-indigo-400 hover:text-indigo-300 underline">
            browse
          </button>
        </p>
        <p className="text-slate-600 text-xs mt-1">Supports all file types · videos streamed via Cloudinary</p>
      </div>

      {/* File grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search ? 'No files match your search' : 'No files yet — upload your first one'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((file) => {
            const Icon = RESOURCE_ICONS[file.resourceType] ?? FileText;
            const fileUrl = file.cloudinaryUrl || `/api/files/download/${file.id}`;
            const thumbUrl = file.thumbnailUrl || (file.resourceType === 'image' ? `/api/files/download/${file.id}` : null);
            return (
              <div
                key={file.id}
                className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt={file.title}
                      className="w-full h-full object-cover"
                    />
                  ) : file.resourceType === 'video' ? (
                    <Film className="w-10 h-10 text-slate-600" />
                  ) : (
                    <Icon className="w-10 h-10 text-slate-600" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPreview(file)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <a
                      href={fileUrl}
                      download={file.title}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </a>
                    {canAdmin && (
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-200 truncate" title={file.title}>
                    {file.title}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', STAGE_COLORS[file.resourceType])}>
                      {file.resourceType.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {file.fileSizeBytes ? formatBytes(file.fileSizeBytes) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{formatDate(file.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-slate-200 truncate">{preview.title}</h3>
              <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              {preview.resourceType === 'video' ? (
                <video
                  src={preview.cloudinaryUrl || `/api/files/download/${preview.id}`}
                  controls
                  autoPlay
                  className="w-full"
                />
              ) : preview.resourceType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.cloudinaryUrl || `/api/files/download/${preview.id}`} alt={preview.title} className="w-full object-contain max-h-[70vh]" />
              ) : preview.resourceType === 'pdf' ? (
                <iframe src={preview.cloudinaryUrl || `/api/files/download/${preview.id}`} className="w-full h-[70vh]" />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>Preview not available for this file type.</p>
                  <a href={preview.cloudinaryUrl || `/api/files/download/${preview.id}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                    <Download className="w-4 h-4" /> Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
