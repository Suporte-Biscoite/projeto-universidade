import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/forgot-password?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      setStatus('success');
      setMessage(data.message || 'Se o email existir, você receberá um link em breve.');
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2">
      {/* LADO ESQUERDO — imagem */}
      <div className="hidden lg:block relative rounded-[32px] m-6 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800"
          className="w-full h-full object-cover rounded-[32px]"
          alt=""
        />
        <div className="absolute inset-0 bg-black/20 rounded-[32px]" />
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <h2 className="text-4xl font-black mb-4 leading-tight">Recuperar acesso</h2>
          <p className="text-sm font-medium opacity-90">
            Não se preocupe. Vamos te ajudar a recuperar o acesso à sua conta Biscoitê Academy.
          </p>
        </div>
      </div>

      {/* LADO DIREITO — formulário */}
      <div className="flex items-center justify-center px-6 lg:pr-20 py-10">
        <div className="w-full max-w-sm">
          <img src="/logo-biscoite.svg" alt="Logo Biscoitê" className="h-20 mb-8" />

          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#6385B7] mb-8 transition-colors">
            <ArrowLeft size={16} /> Voltar para o login
          </Link>

          <h1 className="text-2xl font-black text-[#001A26] mb-2">Esqueceu sua senha?</h1>
          <p className="text-sm text-slate-500 mb-8">
            Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
          </p>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="font-bold text-[#001A26]">Email enviado!</p>
              <p className="text-sm text-slate-500">{message}</p>
              <Link to="/login" className="text-sm font-bold text-[#6385B7] hover:underline mt-2">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-[#6385B7] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full py-3 bg-[#6385B7] hover:bg-[#001A26] text-white font-bold rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
