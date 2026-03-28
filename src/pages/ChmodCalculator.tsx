import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Copy, Check, Shield, File, Folder, Settings2 } from 'lucide-react';
import { SEO } from '../components/SEO';

export const ChmodCalculator = () => {
  const [copied, setCopied] = useState<string | null>(null);

  // Permissions State
  const [owner, setOwner] = useState({ read: true, write: true, execute: false });
  const [group, setGroup] = useState({ read: true, write: false, execute: false });
  const [publicPerms, setPublicPerms] = useState({ read: true, write: false, execute: false });
  
  // Special Bits
  const [special, setSpecial] = useState({ suid: false, sgid: false, sticky: false });
  
  // Options
  const [isDir, setIsDir] = useState(false);
  const [recursive, setRecursive] = useState(false);
  const [target, setTarget] = useState('file.txt');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Calculations
  const octal = useMemo(() => {
    const calc = (perms: { read: boolean, write: boolean, execute: boolean }) => 
      (perms.read ? 4 : 0) + (perms.write ? 2 : 0) + (perms.execute ? 1 : 0);
    
    const specialVal = (special.suid ? 4 : 0) + (special.sgid ? 2 : 0) + (special.sticky ? 1 : 0);
    const ownerVal = calc(owner);
    const groupVal = calc(group);
    const publicVal = calc(publicPerms);

    return specialVal > 0 
      ? `${specialVal}${ownerVal}${groupVal}${publicVal}`
      : `0${ownerVal}${groupVal}${publicVal}`;
  }, [owner, group, publicPerms, special]);

  const symbolic = useMemo(() => {
    const type = isDir ? 'd' : '-';
    
    const ownerR = owner.read ? 'r' : '-';
    const ownerW = owner.write ? 'w' : '-';
    const ownerX = special.suid 
      ? (owner.execute ? 's' : 'S') 
      : (owner.execute ? 'x' : '-');

    const groupR = group.read ? 'r' : '-';
    const groupW = group.write ? 'w' : '-';
    const groupX = special.sgid 
      ? (group.execute ? 's' : 'S') 
      : (group.execute ? 'x' : '-');

    const publicR = publicPerms.read ? 'r' : '-';
    const publicW = publicPerms.write ? 'w' : '-';
    const publicX = special.sticky 
      ? (publicPerms.execute ? 't' : 'T') 
      : (publicPerms.execute ? 'x' : '-');

    return `${type}${ownerR}${ownerW}${ownerX}${groupR}${groupW}${groupX}${publicR}${publicW}${publicX}`;
  }, [owner, group, publicPerms, special, isDir]);

  const command = useMemo(() => {
    const flags = recursive ? '-R ' : '';
    const safeTarget = target.trim() || (isDir ? 'directory' : 'file.txt');
    return `chmod ${flags}${octal} ${safeTarget}`;
  }, [octal, recursive, target, isDir]);

  const renderCheckbox = (
    label: string, 
    checked: boolean, 
    onChange: (val: boolean) => void, 
    colorClass: string
  ) => (
    <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? colorClass : 'bg-white/10'}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      <SEO 
        title="Chmod Calculator" 
        description="Calculate Linux file permissions using octal and symbolic notation. Generate chmod commands with support for special bits (SUID, SGID, Sticky)."
        keywords="chmod calculator, linux permissions, octal permissions, symbolic permissions, file permissions"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0f1c]/80 backdrop-blur-md z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </Link>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-500" />
          <span className="font-semibold text-white">Chmod Calculator</span>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Builder */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Permissions Grid */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" />
              Standard Permissions
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Owner */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Owner (User)</h3>
                {renderCheckbox('Read (r)', owner.read, (v) => setOwner({...owner, read: v}), 'bg-cyan-500')}
                {renderCheckbox('Write (w)', owner.write, (v) => setOwner({...owner, write: v}), 'bg-cyan-500')}
                {renderCheckbox('Execute (x)', owner.execute, (v) => setOwner({...owner, execute: v}), 'bg-cyan-500')}
              </div>

              {/* Group */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Group</h3>
                {renderCheckbox('Read (r)', group.read, (v) => setGroup({...group, read: v}), 'bg-blue-500')}
                {renderCheckbox('Write (w)', group.write, (v) => setGroup({...group, write: v}), 'bg-blue-500')}
                {renderCheckbox('Execute (x)', group.execute, (v) => setGroup({...group, execute: v}), 'bg-blue-500')}
              </div>

              {/* Public */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Public (Others)</h3>
                {renderCheckbox('Read (r)', publicPerms.read, (v) => setPublicPerms({...publicPerms, read: v}), 'bg-indigo-500')}
                {renderCheckbox('Write (w)', publicPerms.write, (v) => setPublicPerms({...publicPerms, write: v}), 'bg-indigo-500')}
                {renderCheckbox('Execute (x)', publicPerms.execute, (v) => setPublicPerms({...publicPerms, execute: v}), 'bg-indigo-500')}
              </div>
            </div>
          </div>

          {/* Special Bits & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-fuchsia-500" />
                Special Bits
              </h2>
              <div className="space-y-3">
                {renderCheckbox('SetUID (SUID)', special.suid, (v) => setSpecial({...special, suid: v}), 'bg-fuchsia-500')}
                {renderCheckbox('SetGID (SGID)', special.sgid, (v) => setSpecial({...special, sgid: v}), 'bg-fuchsia-500')}
                {renderCheckbox('Sticky Bit', special.sticky, (v) => setSpecial({...special, sticky: v}), 'bg-fuchsia-500')}
              </div>
            </div>

            <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-500" />
                Target Options
              </h2>
              <div className="space-y-4">
                <div className="flex bg-[#030712] border border-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setIsDir(false)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${!isDir ? 'bg-white/10 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <File className="w-4 h-4" /> File
                  </button>
                  <button
                    onClick={() => setIsDir(true)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${isDir ? 'bg-white/10 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Folder className="w-4 h-4" /> Directory
                  </button>
                </div>
                
                {renderCheckbox('Recursive (-R)', recursive, setRecursive, 'bg-emerald-500')}

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target Name</label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder={isDir ? "e.g. /var/www/html" : "e.g. script.sh"}
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#0a0f1c] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-white/10 sticky top-24">
            
            {/* Octal Output */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Octal Notation</span>
                <button
                  onClick={() => handleCopy(octal, 'octal')}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied === 'octal' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-5xl font-mono font-bold text-cyan-400 tracking-widest">
                {octal}
              </div>
            </div>

            {/* Symbolic Output */}
            <div className="p-6 border-b border-white/10 bg-[#030712]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Symbolic Notation</span>
                <button
                  onClick={() => handleCopy(symbolic, 'symbolic')}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied === 'symbolic' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-3xl font-mono font-bold text-blue-400 tracking-widest">
                {symbolic}
              </div>
            </div>

            {/* Command Output */}
            <div className="p-6 bg-[#030712]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Bash Command</span>
                <button
                  onClick={() => handleCopy(command, 'command')}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  {copied === 'command' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'command' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-black/50 rounded-xl border border-white/10 overflow-x-auto">
                <pre className="font-mono text-sm text-emerald-400">
                  $ {command}
                </pre>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
