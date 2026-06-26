// src/components/professor/ShortsView.jsx
import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, Pencil, Trash, Play, Link, Image as ImageIcon, Clapperboard } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { authFetch } from '../../utils/authFetch';
import { Toast, getLoggedId } from './ProfessorHelpers';

const REEL_TAGS = ['Dica', 'Novidade', 'Aviso', 'Evento', 'Vendas', 'Operações', 'IA', 'Motivação'];

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}


// Detecta YouTube ou Vimeo de qualquer URL e retorna iframe correto
function VideoPlayer({ url, className = "w-full h-full rounded-[20px]" }) {
  if (!url) return (
    <div className={`${className} bg-slate-800 flex items-center justify-center text-white/40`}>
      <p className="text-sm">Nenhum vídeo configurado</p>
    </div>
  );

  // YouTube — aceita watch, shorts, live, youtu.be
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return (
    <iframe
      src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1`}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );

  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) return (
    <iframe src={`https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&title=0&byline=0`}
      className={className} allow="autoplay; fullscreen; picture-in-picture" />
  );

  // URL direta — abre em nova aba
  return (
    <div className={`${className} bg-slate-800 flex flex-col items-center justify-center gap-3 text-white/60`}>
      <p className="text-sm font-bold text-white">Vídeo externo</p>
      <a href={url} target="_blank" rel="noreferrer"
        className="px-4 py-2 bg-[#4A72B2] text-white rounded-xl text-sm font-bold hover:bg-white hover:text-[#001A26] transition-colors">
        Abrir vídeo ↗
      </a>
    </div>
  );
}

function ShortsView() {
  const { profileImage, shorts: cachedShorts, addShort, deleteShort } = useProfile();
  const [shorts, setShorts]               = useState(cachedShorts || []);
  const [loadingShorts, setLoadingShorts] = useState(true);

  useEffect(() => {
    // Sempre busca do banco para garantir dados frescos
    // cachedShorts é usado como estado inicial enquanto o fetch não retorna
    authFetch('/api/data?resource=shorts')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setShorts(data); })
      .catch(() => {})
      .finally(() => setLoadingShorts(false));
  }, []);

  const handleAddShort = async (data) => {
    const res = await authFetch('/api/data?resource=shorts', {
      method: 'POST',
      body: JSON.stringify({
        caption:       data.caption,
        tag:           data.tag || 'Dica',
        thumbnail_url: data.thumbnail || null,
        vimeo_id:      data.vimeoId   || null,
      }),
    });
    if (res.ok) {
      const newShort = await res.json();
      setShorts(prev => [newShort, ...prev]);
    }
  };

  const handleDeleteShort = async (id) => {
    if (!window.confirm('Excluir este short?')) return;
    setShorts(prev => prev.filter(r => r.id !== id));
    await authFetch(`/api/data?resource=shorts&id=${id}`, { method: 'DELETE' }).catch(() => {});
  };
  const loggedId = getLoggedId();
  // Admin vê todos, professor vê só os seus
  const myShorts = shorts.filter(r =>
    !loggedId || r.instructor_id === loggedId || r.instructorId === loggedId
  );

  const [showForm, setShowForm]       = useState(false);
  const [caption, setCaption]         = useState('');
  const [tag, setTag]                 = useState('Dica');
  const [videoTab, setVideoTab]       = useState('vimeo'); // vimeo only
  const [videoUrl, setVideoUrl]       = useState('');
  const [videoFile, setVideoFile]     = useState(null);
  const [thumbnail, setThumbnail]     = useState('');
  const [thumbFile, setThumbFile]     = useState(null);
  const [hoveredId, setHoveredId]     = useState(null);
  const [selectedShort, setSelectedShort] = useState(null);
  const [editingShort, setEditingShort]   = useState(null); // short sendo editado
  const [editForm, setEditForm]           = useState({});
  const [toast, setToast]             = useState(null);
  const thumbInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const openEdit = (short) => {
    setEditForm({ caption: short.caption || '', tag: short.tag || 'Dica', vimeo_id: short.vimeo_id || '' });
    setEditingShort(short);
  };

  const saveEdit = async () => {
    if (!editingShort || !editForm.caption?.trim()) return;
    try {
      const res = await authFetch(`/api/data?resource=shorts&id=${editingShort.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          caption:  editForm.caption.trim(),
          tag:      editForm.tag,
          vimeo_id: editForm.vimeo_id || null,
        }),
      });
      if (res.ok) {
        setShorts(prev => prev.map(r =>
          r.id === editingShort.id
            ? { ...r, caption: editForm.caption.trim(), tag: editForm.tag, vimeo_id: editForm.vimeo_id }
            : r
        ));
        setEditingShort(null);
      }
    } catch {}
  };

  const vimeoId = extractVimeoId(videoUrl);
  const previewThumb = thumbFile ? thumbnail : thumbnail;

  const handleThumbFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setThumbFile(file); setThumbnail(e.target.result); };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
  };

  const handleSubmit = () => {
    if (!caption.trim()) return;
    const finalThumb = previewThumb || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400';
    handleAddShort({ caption, tag, thumbnail: finalThumb, vimeoId: vimeoId || null });
    setShowForm(false);
    setCaption(''); setTag('Dica'); setVideoUrl(''); setVideoFile(null); setThumbnail(''); setThumbFile(null);
    setToast('Short publicado com sucesso!');
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mt-1">Publique vídeos curtos visíveis para todos na Home</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#4A72B2] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#001A26] transition-colors shadow-lg shadow-blue-100 text-sm"
        >
          <Plus size={15} /> Novo Short
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100">
              <h3 className="font-black text-[#001A26] text-lg">Novo Short</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Thumbnail */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Thumbnail</p>
                <div
                  className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group border-2 border-dashed border-slate-200 hover:border-[#4A72B2] transition-colors"
                  onClick={() => thumbInputRef.current?.click()}
                >
                  {previewThumb ? (
                    <>
                      <img src={previewThumb} className="w-full h-full object-cover" alt="thumb" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold">Trocar imagem</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                      <ImageIcon size={24} />
                      <p className="text-xs font-medium">Clique para adicionar thumbnail</p>
                      <p className="text-[10px] text-slate-300">ou cole a URL do YouTube abaixo para importar automaticamente</p>
                    </div>
                  )}
                </div>
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleThumbFile(e.target.files?.[0])} />
              </div>

              {/* Legenda */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Legenda</p>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="O que você quer compartilhar com os alunos?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#4A72B2] outline-none text-sm text-slate-700 resize-none"
                />
                <p className="text-[10px] text-slate-300 text-right mt-1">{caption.length}/200</p>
              </div>

              {/* Tag */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {REEL_TAGS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${tag === t ? 'bg-[#4A72B2] text-white border-[#4A72B2]' : 'border-slate-200 text-slate-500 hover:border-[#4A72B2] hover:text-[#4A72B2]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vídeo */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Vídeo Vimeo (opcional)</p>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-[#4A72B2]">
                  <Link size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://vimeo.com/123456789"
                    className="flex-1 text-sm outline-none text-slate-700 bg-transparent"
                  />
                  {vimeoId && <span className="text-[10px] text-emerald-500 font-bold whitespace-nowrap">✓ válido</span>}
                </div>
                {vimeoId && (
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">ID detectado: {vimeoId}</p>
                )}
              </div>
            </div>

            <div className="px-7 pb-7 pt-4 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!caption.trim()}
                className="flex-1 py-3 rounded-2xl bg-[#4A72B2] text-white font-bold text-sm hover:bg-[#001A26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Publicar Short
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player modal */}
      {selectedShort && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setSelectedShort(null)}>
          <div className="relative w-full max-w-sm" style={{ aspectRatio: '9/16' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedShort(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white font-bold text-sm flex items-center gap-1">
              <X size={16} /> Fechar
            </button>
            {selectedShort.vimeo_id ? (
              <iframe
                src={`https://player.vimeo.com/video/${selectedShort.vimeo_id}?autoplay=1&title=0&byline=0`}
                className="w-full h-full rounded-[20px]"
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="w-full h-full rounded-[20px] bg-slate-800 flex flex-col items-center justify-center gap-3 text-white/50">
                <Play size={40} />
                <p className="text-sm">Nenhum vídeo configurado</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-[20px]">
              <p className="text-white font-bold text-sm">{selectedShort.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingShort && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#001A26]">Editar Short</h3>
              <button onClick={() => setEditingShort(null)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda</label>
              <textarea value={editForm.caption} onChange={e => setEditForm(p => ({ ...p, caption: e.target.value }))}
                rows={3} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2] resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tag</label>
              <select value={editForm.tag} onChange={e => setEditForm(p => ({ ...p, tag: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2] bg-white">
                {['Dica','Tutorial','Receita','Novidade','Operação','Marketing','Gestão'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Vimeo</label>
              <input value={editForm.vimeo_id} onChange={e => setEditForm(p => ({ ...p, vimeo_id: e.target.value }))}
                placeholder="Ex: https://vimeo.com/123456789"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingShort(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={!editForm.caption?.trim()}
                className="flex-1 py-3 rounded-2xl bg-[#001A26] hover:bg-[#4A72B2] text-white font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Check size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de shorts */}
      {loadingShorts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-[20px] aspect-[9/14] bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : myShorts.length === 0 ? (
        <div className="py-24 text-center text-slate-300 space-y-3">
          <Clapperboard size={40} className="mx-auto" />
          <p className="font-bold text-slate-400">Você ainda não publicou nenhum short</p>
          <p className="text-sm text-slate-300">Clique em "Novo Short" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {myShorts.map(short => {
            const isHovered = hoveredId === short.id;
            const thumb = short.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400';
            return (
              <div
                key={short.id}
                className="relative rounded-[16px] sm:rounded-[20px] overflow-hidden aspect-[9/14] group cursor-pointer shadow-sm"
                onMouseEnter={() => setHoveredId(short.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedShort(short)}
              >
                <img src={thumb} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={short.caption} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Tag */}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 text-[#4A72B2] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{short.tag}</span>
                </div>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(short); }}
                    className="w-6 h-6 rounded-full bg-white/90 text-[#4A72B2] flex items-center justify-center hover:bg-white"
                    title="Editar"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteShort(short.id); }}
                    className="w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600"
                    title="Excluir"
                  >
                    <Trash size={10} />
                  </button>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
                  <p className="text-white text-[11px] font-bold leading-snug line-clamp-2">{short.caption}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[9px]">{short.views} views · {short.time}</span>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Play size={8} fill="#001A26" className="text-[#001A26] translate-x-[1px]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}


export default ShortsView;
