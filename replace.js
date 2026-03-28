const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-white': 'bg-[#0a0f1c]',
  'bg-slate-50': 'bg-[#030712]',
  'bg-slate-100': 'bg-white/5',
  'bg-slate-200': 'bg-white/10',
  'bg-slate-300': 'bg-white/20',
  'bg-slate-800': 'bg-zinc-900',
  'bg-slate-900': 'bg-[#0a0f1c]',
  'text-slate-900': 'text-white',
  'text-slate-800': 'text-zinc-200',
  'text-slate-700': 'text-zinc-300',
  'text-slate-600': 'text-zinc-400',
  'text-slate-500': 'text-zinc-500',
  'text-slate-400': 'text-zinc-500',
  'text-slate-300': 'text-zinc-400',
  'text-slate-200': 'text-zinc-300',
  'border-slate-200': 'border-white/10',
  'border-slate-300': 'border-white/20',
  'border-slate-800': 'border-white/10',
  'bg-indigo-50': 'bg-cyan-500/10',
  'text-indigo-700': 'text-cyan-400',
  'text-indigo-600': 'text-cyan-400',
  'text-indigo-500': 'text-cyan-500',
  'text-indigo-400': 'text-cyan-400',
  'border-indigo-200': 'border-cyan-500/20',
  'border-indigo-500': 'border-cyan-500/50',
  'focus:ring-indigo-500': 'focus:ring-cyan-500/50',
  'focus:border-indigo-500': 'focus:border-cyan-500/50',
  'text-slate-900/50': 'text-white/50',
  'bg-slate-900/50': 'bg-[#0a0f1c]/50',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${key.replace(/[/.]/g, '\\$&')}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
