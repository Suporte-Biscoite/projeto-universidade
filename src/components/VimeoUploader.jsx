// src/components/VimeoUploader.jsx
// Upload de vídeo direto ao Vimeo via TUS
// Props: value (vimeoId atual), onChange(vimeoId), courseTitle, courseDesc

import { useState, useRef } from 'react';
import { Upload, Check, X, Loader, Film, Link, ExternalLink } from 'lucide-react';

const VIMEO_TOKEN = import.meta.env.VITE_VIMEO_TOKEN;

function VimeoEmbed({ vimeoId }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vídeo"
      />
    </div>
  );
}

export default function VimeoUploader({ value, onChange, courseTitle = '', courseDesc = '' }) {
  const [tab, setTab]             = useState('upload'); // 'upload' | 'url'
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [vimeoUrl, setVimeoUrl]   = useState('');
  const fileInputRef              = useRef(null);

  // Extrai ID de uma URL do Vimeo
  const extractVimeoId = (url) => {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  };

  // Upload via TUS (protocolo resumível do Vimeo)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!VIMEO_TOKEN) { setError('Token do Vimeo não configurado.'); return; }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // 1. Cria o vídeo no Vimeo e obtém a upload URL
      const createRes = await fetch('https://api.vimeo.com/me/videos', {
        method: 'POST',
        headers: {
          Authorization: `bearer ${VIMEO_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
        body: JSON.stringify({
          upload: { approach: 'tus', size: file.size },
          name: courseTitle || file.name,
          description: courseDesc || '',
          privacy: { view: 'anybody' },
        }),
      });

      if (!createRes.ok) throw new Error('Erro ao criar vídeo no Vimeo');
      const createData = await createRes.json();
      const uploadLink = createData.upload?.upload_link;
      const vimeoUri   = createData.uri; // ex: /videos/123456789

      if (!uploadLink) throw new Error('Upload link não retornado');

      // 2. Upload via TUS em chunks
      const chunkSize = 128 * 1024 * 1024; // 128MB chunks
      let offset = 0;

      while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        const uploadRes = await fetch(uploadLink, {
          method: 'PATCH',
          headers: {
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream',
          },
          body: chunk,
        });

        if (!uploadRes.ok) throw new Error('Erro durante o upload');
        const newOffset = parseInt(uploadRes.headers.get('Upload-Offset') || '0');
        offset = newOffset;
        setProgress(Math.round((offset / file.size) * 100));
      }

      // 3. Extrai o ID do vídeo e retorna
      const videoId = vimeoUri.split('/').pop();
      onChange(videoId);
      setUploading(false);

    } catch (err) {
      console.error('VimeoUploader:', err);
      setError(err.message || 'Erro no upload. Tente novamente.');
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    const id = extractVimeoId(vimeoUrl);
    if (!id) { setError('URL do Vimeo inválida.'); return; }
    setError('');
    onChange(id);
    setVimeoUrl('');
  };

  const handleRemove = () => {
    onChange(null);
    setProgress(0);
    setError('');
  };

  // Se já tem vídeo, mostra player + opção de trocar
  if (value) {
    return (
      <div className="space-y-3">
        <VimeoEmbed vimeoId={value} />
        <div className="flex items-center justify-between">
          <a
            href={`https://vimeo.com/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#4A72B2] font-bold hover:underline"
          >
            <ExternalLink size={12} /> Ver no Vimeo
          </a>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-red-600"
          >
            <X size={12} /> Remover vídeo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[['upload', <Upload size={12} />, 'Fazer upload'], ['url', <Link size={12} />, 'Colar URL']].map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${
              tab === id ? 'bg-white text-[#001A26] shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          {uploading ? (
            <div className="border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Loader size={16} className="text-[#4A72B2] animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-black text-[#001A26]">Enviando para o Vimeo...</p>
                  <p className="text-[10px] text-slate-400">{progress}% concluído</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-[#4A72B2] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#4A72B2] transition-colors text-slate-400 hover:text-[#4A72B2] group"
            >
              <Film size={20} />
              <div className="text-left">
                <p className="text-sm font-black">Clique para enviar um vídeo</p>
                <p className="text-[11px] text-slate-300 group-hover:text-[#4A72B2]/60">MP4, MOV, AVI · Enviado direto ao Vimeo</p>
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-4 focus-within:border-[#4A72B2] transition-colors">
            <Link size={13} className="text-slate-300 flex-shrink-0" />
            <input
              value={vimeoUrl}
              onChange={e => setVimeoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://vimeo.com/123456789"
              className="flex-1 py-2.5 text-sm text-[#001A26] outline-none bg-transparent placeholder-slate-300"
            />
            {extractVimeoId(vimeoUrl) && <Check size={13} className="text-emerald-500 flex-shrink-0" />}
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={!vimeoUrl.trim()}
            className="px-4 py-2.5 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-black transition-all disabled:opacity-40"
          >
            Usar
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
}
