import { useState } from 'react';
import { Send, X, CheckCircle2, Loader, Mail, Phone, MessageCircle } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

// ─── Modal genérico ───────────────────────────────────────────────────────────
function LegalModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#001A26]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto px-8 py-6 text-sm text-slate-600 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="px-8 py-5 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-3 bg-[#001A26] text-white rounded-xl font-bold text-sm hover:bg-[#4A72B2] transition-colors">
            Li e entendi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Ajuda ───────────────────────────────────────────────────────────
function HelpModal({ onClose }) {
  return (
    <LegalModal title="Central de Ajuda" onClose={onClose}>
      <p className="text-slate-500 text-xs">Precisa de suporte? Entre em contato conosco pelos canais abaixo:</p>
      <div className="space-y-3">
        <a href="mailto:universidade@biscoite.com.br"
          className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-[#e2eef9] transition-colors group">
          <div className="w-10 h-10 bg-[#4A72B2]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#4A72B2]/20">
            <Mail size={18} className="text-[#4A72B2]" />
          </div>
          <div>
            <p className="font-bold text-[#001A26] text-sm">E-mail</p>
            <p className="text-slate-400 text-xs">universidade@biscoite.com.br</p>
          </div>
        </a>
        <a href="https://biscoite.com.br" target="_blank" rel="noreferrer"
          className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-[#e2eef9] transition-colors group">
          <div className="w-10 h-10 bg-[#4A72B2]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#4A72B2]/20">
            <Phone size={18} className="text-[#4A72B2]" />
          </div>
          <div>
            <p className="font-bold text-[#001A26] text-sm">Site oficial</p>
            <p className="text-slate-400 text-xs">biscoite.com.br</p>
          </div>
        </a>
      </div>
      <div className="bg-[#e2eef9] rounded-2xl p-4">
        <p className="text-xs text-[#4A72B2] font-bold">Dúvidas frequentes</p>
        <ul className="mt-2 space-y-2 text-xs text-slate-500">
          <li>• <strong>Como acessar os cursos?</strong> — Faça login e acesse a aba "Cursos" no menu.</li>
          <li>• <strong>Como emitir meu certificado?</strong> — Conclua todas as aulas do curso e acesse "Certificados".</li>
          <li>• <strong>Esqueci minha senha.</strong> — Clique em "Recuperar senha" na tela de login.</li>
          <li>• <strong>Meu cadastro está pendente.</strong> — Aguarde a aprovação de um administrador.</li>
        </ul>
      </div>
    </LegalModal>
  );
}

// ─── Footer principal ─────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail]         = useState('');
  const [subStatus, setSubStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [modal, setModal]         = useState(null);  // null | 'privacy' | 'terms' | 'help'

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSubStatus('loading');
    try {
      const res = await fetch('/api/data?resource=newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubStatus('success');
        setEmail('');
        setTimeout(() => setSubStatus(null), 4000);
      } else {
        setSubStatus('error');
        setTimeout(() => setSubStatus(null), 3000);
      }
    } catch {
      setSubStatus('error');
      setTimeout(() => setSubStatus(null), 3000);
    }
  };

  return (
    <>
      {/* Modais */}
      {modal === 'help'    && <HelpModal onClose={() => setModal(null)} />}
      {modal === 'privacy' && (
        <LegalModal title="Política de Privacidade" onClose={() => setModal(null)}>
          <p><strong>Última atualização:</strong> Janeiro de 2026</p>
          <p>A <strong>Universidade Biscoitê</strong> respeita sua privacidade e está comprometida em proteger seus dados pessoais conforme a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.</p>
          <h3 className="font-black text-[#001A26] mt-2">1. Dados coletados</h3>
          <p>Coletamos nome, e-mail, cargo, unidade e dados de progresso nos cursos para personalizar sua experiência na plataforma.</p>
          <h3 className="font-black text-[#001A26] mt-2">2. Uso dos dados</h3>
          <p>Seus dados são utilizados exclusivamente para: gestão do seu perfil, acompanhamento de progresso, emissão de certificados e comunicações internas da Biscoitê.</p>
          <h3 className="font-black text-[#001A26] mt-2">3. Compartilhamento</h3>
          <p>Não compartilhamos seus dados com terceiros, exceto quando exigido por lei ou para operação da plataforma (ex: serviços de e-mail transacional).</p>
          <h3 className="font-black text-[#001A26] mt-2">4. Seus direitos</h3>
          <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail <strong>academy@biscoite.com.br</strong>.</p>
          <h3 className="font-black text-[#001A26] mt-2">5. Retenção</h3>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão, os dados são removidos em até 30 dias.</p>
          <h3 className="font-black text-[#001A26] mt-2">6. Segurança</h3>
          <p>Utilizamos criptografia, autenticação JWT e infraestrutura segura (AWS Aurora, Vercel) para proteger seus dados.</p>
          <h3 className="font-black text-[#001A26] mt-2">7. Contato</h3>
          <p>Dúvidas sobre privacidade: <strong>universidade@biscoite.com.br</strong></p>
        </LegalModal>
      )}
      {modal === 'terms' && (
        <LegalModal title="Termos e Condições de Uso" onClose={() => setModal(null)}>
          <p><strong>Última atualização:</strong> Janeiro de 2026</p>
          <p>Ao acessar a <strong>Universidade Biscoitê</strong>, você concorda com os seguintes termos:</p>
          <h3 className="font-black text-[#001A26] mt-2">1. Acesso à plataforma</h3>
          <p>O acesso é exclusivo para colaboradores, gestores e franqueados da rede Biscoitê, mediante cadastro aprovado por um administrador.</p>
          <h3 className="font-black text-[#001A26] mt-2">2. Uso adequado</h3>
          <p>É vedado compartilhar credenciais de acesso, reproduzir conteúdos sem autorização ou utilizar a plataforma para fins alheios ao treinamento profissional.</p>
          <h3 className="font-black text-[#001A26] mt-2">3. Propriedade intelectual</h3>
          <p>Todo o conteúdo disponibilizado (vídeos, textos, materiais) é propriedade da Biscoitê e não pode ser reproduzido, distribuído ou comercializado sem autorização expressa.</p>
          <h3 className="font-black text-[#001A26] mt-2">4. Certificados</h3>
          <p>Os certificados emitidos pela Universidade Biscoitê têm validade interna e refletem a conclusão dos cursos na plataforma.</p>
          <h3 className="font-black text-[#001A26] mt-2">5. Suspensão de acesso</h3>
          <p>A Biscoitê reserva o direito de suspender ou encerrar o acesso de qualquer usuário que viole estes termos.</p>
          <h3 className="font-black text-[#001A26] mt-2">6. Atualizações</h3>
          <p>Estes termos podem ser atualizados a qualquer momento. O uso continuado da plataforma implica aceite das novas condições.</p>
          <h3 className="font-black text-[#001A26] mt-2">7. Contato</h3>
          <p>Dúvidas: <strong>universidade@biscoite.com.br</strong></p>
        </LegalModal>
      )}

      <footer className="bg-[#00263B] text-white pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6 space-y-12">

          {/* Newsletter */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-serif italic text-2xl">Biscoitê</span>
              <div className="h-6 w-[1px] bg-slate-500" />
              <span className="text-slate-400 text-sm uppercase tracking-widest">Universidade</span>
            </div>
            <h3 className="text-lg font-medium">Assine nossa newsletter</h3>
            <div className="flex w-full max-w-md gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                placeholder="Seu email"
                disabled={subStatus === 'loading' || subStatus === 'success'}
                className="flex-1 bg-transparent border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-[#4A72B2] transition-colors disabled:opacity-50 text-sm"
              />
              <button
                onClick={handleSubscribe}
                disabled={subStatus === 'loading' || subStatus === 'success' || !email.trim()}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm disabled:opacity-50 ${
                  subStatus === 'success' ? 'bg-emerald-500 text-white' :
                  subStatus === 'error'   ? 'bg-red-400 text-white' :
                  'bg-[#b9d2eb] hover:bg-[#4A72B2] text-[#001A26] hover:text-white'
                }`}
              >
                {subStatus === 'loading' ? <Loader size={16} className="animate-spin" /> :
                 subStatus === 'success' ? <><CheckCircle2 size={16} /> Inscrito!</> :
                 subStatus === 'error'   ? 'Erro, tente novamente' :
                 <><Send size={14} /> Assine</>}
              </button>
            </div>
            {subStatus === 'success' && (
              <p className="text-emerald-400 text-xs font-bold">✓ Email cadastrado com sucesso!</p>
            )}
          </div>

          {/* Bottom Links */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 text-xs text-slate-400 font-bold uppercase">
              <button onClick={() => setModal('help')}    className="hover:text-white transition-colors">Ajuda</button>
              <button onClick={() => setModal('privacy')} className="hover:text-white transition-colors">Política de Privacidade</button>
              <button onClick={() => setModal('terms')}   className="hover:text-white transition-colors">Termos & Condições</button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              © Biscoitê 2026 CNPJ: 35.689.008/0001-91. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
