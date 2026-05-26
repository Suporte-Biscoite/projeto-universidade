import fs from 'fs';
import path from 'path';

const folders = [
  'src/api',
  'src/components',
  'src/layouts',
  'src/pages',
  'src/hooks',
  'src/styles',
  'src/assets',
];

const files = {
  // Configuração inicial do nosso Layout Sênior
  'src/layouts/MainLayout.jsx': `
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-biscoite-bg font-sans">
      {/* Aqui entrará nossa Navbar */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-50">
        <h1 className="text-biscoite-dark font-bold text-xl">Universidade Biscoitê</h1>
      </header>

      <main className="p-8">
        <Outlet />
      </main>

      {/* Footer azul marinho profundo do Figma */}
      <footer className="bg-biscoite-dark text-white p-12 mt-20">
        <p>© 2026 Biscoitê Academy - Educação Corporativa</p>
      </footer>
    </div>
  );
}`,
  
  'src/api/base44Client.js': '// Configuração do base44Client\nexport const base44Client = {};',
  'src/styles/index.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
};

// Criação das pastas
folders.forEach(folder => {
  const folderPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(\`✅ Pasta criada: \${folder}\`);
  }
});

// Criação dos arquivos iniciais
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(process.cwd(), filePath);
  fs.writeFileSync(fullPath, content.trim());
  console.log(\`📄 Arquivo criado: \${filePath}\`);
});

console.log('\n🚀 Estrutura da Universidade Biscoitê pronta para o deploy!');
