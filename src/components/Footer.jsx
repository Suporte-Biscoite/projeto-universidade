import { Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#00263B] text-white pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        
        {/* Newsletter Section */}
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
              placeholder="Seu email" 
              className="flex-1 bg-transparent border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-[#4A72B2] transition-colors"
            />
            <button className="bg-[#b9d2eb] hover:bg-[#4A72B2] text-[#001A26] hover:text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
              Assine
            </button>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6 text-xs text-slate-400 font-bold uppercase">
            <a href="#" className="hover:text-white transition-colors">Ajuda</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos & Condições</a>
          </div>
          
          <p className="text-[10px] text-slate-500 text-center">
            © Biscoitê 2026 CNPJ: 35.689.008/0001-91. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}