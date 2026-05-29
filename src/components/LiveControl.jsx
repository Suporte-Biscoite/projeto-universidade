// src/components/LiveControl.jsx
// Componente de controle de live para professor e admin
// Uso: <LiveControl /> dentro do dashboard

import { useState, useEffect } from 'react';
import { Radio, Square, Loader } from 'lucide-react';

function getToken() {
  return sessionStorage.getItem('biscoite_access_token')
      || localStorage.getItem('biscoite_access_token') || '';
}

export default function LiveControl() {
  const [live, setLive]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [title, setTitle]     = useState('Live Biscoitê');
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    fetch('/api/live')
      .then(r => r.json())
      .then(data => {
        setLive(data);
        if (data.title) setTitle(data.title);
        if (data.stream_url) setStreamUrl(data.stream_url);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/live?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title, stream_url: streamUrl }),
      });
      const data = await res.json();
      if (res.ok) setLive(data.live);
    } finally { setSaving(false); }
  };

  const handleStop = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/live?action=stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setLive(data.live);
    } finally { setSaving(false); }
  };

  if (loading) return null;

  const isActive = live?.is_active === true;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${isActive ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-red-100' : 'bg-slate-100'}`}>
            <Radio size={16} className={isActive ? 'text-red-500' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-sm font-black text-[#001A26]">Controle de Live</p>
            <p className="text-[10px] text-slate-500">
              {isActive ? `Ao vivo desde ${new Date(live.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Nenhuma live ativa'}
            </p>
          </div>
        </div>
        {isActive && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 bg-red-100 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            AO VIVO
          </span>
        )}
      </div>

      {!isActive && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Título da live</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Treinamento de Páscoa 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">URL do stream (opcional)</label>
            <input
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]"
            />
          </div>
        </div>
      )}

      <button
        onClick={isActive ? handleStop : handleStart}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'
        }`}
      >
        {saving ? <Loader size={16} className="animate-spin" /> : isActive ? <><Square size={14} /> Encerrar live</> : <><Radio size={14} /> Iniciar live</>}
      </button>
    </div>
  );
}
