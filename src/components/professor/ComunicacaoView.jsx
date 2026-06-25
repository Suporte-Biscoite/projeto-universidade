// src/components/professor/ComunicacaoView.jsx
import ChatPanel from '../ChatPanel';
import { getLoggedId } from './ProfessorHelpers';

function ComunicacaoView({ onRead }) {
  const currentUserId = getLoggedId();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-[#001A26]">Comunicação</h2>
        <p className="text-sm text-slate-400 mt-1">Converse com seus alunos diretamente pela plataforma.</p>
      </div>
      <ChatPanel currentUserId={currentUserId} />
    </div>
  );
}

export default ComunicacaoView;
