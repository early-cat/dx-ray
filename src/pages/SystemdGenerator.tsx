import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Server, Settings, Shield, Clock, Terminal, Copy, Check, Plus, Trash2, Code2, PlayCircle, Info } from 'lucide-react';
import { SEO } from '../components/SEO';

interface KVP {
  id: string;
  key: string;
  value: string;
}

const createId = () => Math.random().toString(36).substring(7);

export const SystemdGenerator = () => {
  const [copied, setCopied] = useState(false);

  // Basic Info
  const [unitName, setUnitName] = useState('my-app');
  const [description, setDescription] = useState('My awesome application');
  const [after, setAfter] = useState('network.target');
  const [serviceType, setServiceType] = useState('simple');

  // Execution Context
  const [execStart, setExecStart] = useState('/usr/bin/node /opt/myapp/index.js');
  const [execReload, setExecReload] = useState('');
  const [execStop, setExecStop] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('/opt/myapp');
  const [user, setUser] = useState('www-data');
  const [group, setGroup] = useState('www-data');
  const [restart, setRestart] = useState('on-failure');
  const [restartSec, setRestartSec] = useState('5s');
  const [envVars, setEnvVars] = useState<KVP[]>([
    { id: createId(), key: 'NODE_ENV', value: 'production' }
  ]);

  // Security Hardening
  const [protectSystem, setProtectSystem] = useState('full');
  const [protectHome, setProtectHome] = useState('true');
  const [privateTmp, setPrivateTmp] = useState(true);
  const [noNewPrivileges, setNoNewPrivileges] = useState(true);

  // Timer
  const [enableTimer, setEnableTimer] = useState(false);
  const [onCalendar, setOnCalendar] = useState('*-*-* 00:00:00');
  const [onBootSec, setOnBootSec] = useState('');
  const [onUnitActiveSec, setOnUnitActiveSec] = useState('');

  // Output Tab
  const [activeTab, setActiveTab] = useState<'service' | 'timer' | 'install'>('service');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderKvpEditor = (items: KVP[], setItems: React.Dispatch<React.SetStateAction<KVP[]>>, placeholderKey: string, placeholderValue: string) => {
    const updateItem = (id: string, field: keyof KVP, value: string) => {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));
    const addItem = () => setItems([...items, { id: createId(), key: '', value: '' }]);

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <input
              type="text"
              value={item.key}
              onChange={(e) => updateItem(item.id, 'key', e.target.value)}
              placeholder={placeholderKey}
              className="flex-1 bg-[#0a0f1c] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(item.id, 'value', e.target.value)}
              placeholder={placeholderValue}
              className="flex-1 bg-[#0a0f1c] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="flex items-center gap-2 text-sm font-medium text-amber-500 hover:text-amber-400 px-2 py-1 rounded-md hover:bg-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Variable
        </button>
      </div>
    );
  };

  const generatedService = useMemo(() => {
    let ini = `[Unit]\n`;
    if (description) ini += `Description=${description}\n`;
    if (after) ini += `After=${after}\n`;
    
    ini += `\n[Service]\n`;
    ini += `Type=${serviceType}\n`;
    if (user) ini += `User=${user}\n`;
    if (group) ini += `Group=${group}\n`;
    if (workingDirectory) ini += `WorkingDirectory=${workingDirectory}\n`;
    if (execStart) ini += `ExecStart=${execStart}\n`;
    if (execReload) ini += `ExecReload=${execReload}\n`;
    if (execStop) ini += `ExecStop=${execStop}\n`;
    if (restart !== 'no') {
      ini += `Restart=${restart}\n`;
      if (restartSec) ini += `RestartSec=${restartSec}\n`;
    }

    const validEnvVars = envVars.filter(v => v.key.trim());
    if (validEnvVars.length > 0) {
      ini += `\n# Environment Variables\n`;
      validEnvVars.forEach(v => {
        ini += `Environment="${v.key}=${v.value}"\n`;
      });
    }

    ini += `\n# Security Hardening\n`;
    if (protectSystem !== 'false') ini += `ProtectSystem=${protectSystem}\n`;
    if (protectHome !== 'false') ini += `ProtectHome=${protectHome}\n`;
    ini += `PrivateTmp=${privateTmp ? 'yes' : 'no'}\n`;
    ini += `NoNewPrivileges=${noNewPrivileges ? 'yes' : 'no'}\n`;

    ini += `\n[Install]\n`;
    ini += `WantedBy=multi-user.target\n`;

    return ini;
  }, [description, after, serviceType, user, group, workingDirectory, execStart, execReload, execStop, restart, restartSec, envVars, protectSystem, protectHome, privateTmp, noNewPrivileges]);

  const generatedTimer = useMemo(() => {
    if (!enableTimer) return '';
    let ini = `[Unit]\n`;
    ini += `Description=Timer for ${description || unitName}\n`;
    
    ini += `\n[Timer]\n`;
    if (onCalendar) ini += `OnCalendar=${onCalendar}\n`;
    if (onBootSec) ini += `OnBootSec=${onBootSec}\n`;
    if (onUnitActiveSec) ini += `OnUnitActiveSec=${onUnitActiveSec}\n`;
    
    ini += `\n[Install]\n`;
    ini += `WantedBy=timers.target\n`;

    return ini;
  }, [enableTimer, description, unitName, onCalendar, onBootSec, onUnitActiveSec]);

  const installationGuide = useMemo(() => {
    const safeName = unitName || 'my-app';
    let bash = `# 1. Create the service file\n`;
    bash += `sudo nano /etc/systemd/system/${safeName}.service\n`;
    bash += `# (Paste the generated service content and save)\n\n`;

    if (enableTimer) {
      bash += `# 2. Create the timer file\n`;
      bash += `sudo nano /etc/systemd/system/${safeName}.timer\n`;
      bash += `# (Paste the generated timer content and save)\n\n`;
    }

    bash += `# ${enableTimer ? '3' : '2'}. Reload systemd to recognize the new unit(s)\n`;
    bash += `sudo systemctl daemon-reload\n\n`;

    if (enableTimer) {
      bash += `# 4. Enable and start the timer\n`;
      bash += `sudo systemctl enable --now ${safeName}.timer\n\n`;
      bash += `# 5. Check timer status\n`;
      bash += `systemctl list-timers | grep ${safeName}\n`;
    } else {
      bash += `# 4. Enable the service to start on boot\n`;
      bash += `sudo systemctl enable ${safeName}.service\n\n`;
      bash += `# 5. Start the service immediately\n`;
      bash += `sudo systemctl start ${safeName}.service\n\n`;
      bash += `# 6. Check the status\n`;
      bash += `sudo systemctl status ${safeName}.service\n\n`;
      bash += `# 7. View logs\n`;
      bash += `sudo journalctl -u ${safeName}.service -f\n`;
    }

    return bash;
  }, [unitName, enableTimer]);

  const activeContent = activeTab === 'service' ? generatedService : activeTab === 'timer' ? generatedTimer : installationGuide;

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-amber-500/30 relative overflow-hidden">
      <SEO 
        title="Systemd Service Generator" 
        description="Generate systemd service and timer unit files for Linux. Configure execution context, environment variables, security hardening, and scheduling."
        keywords="systemd generator, systemd service, systemd timer, linux service, systemctl"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#030712]/80 backdrop-blur-md z-50">
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
          <Server className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-zinc-200">Systemd Generator</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Left Column: Builder */}
        <div className="flex flex-col gap-6">
          
          {/* Basic Info */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-500" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Unit Name</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. my-app"
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-medium"
                >
                  <option value="simple">simple (default)</option>
                  <option value="exec">exec</option>
                  <option value="forking">forking</option>
                  <option value="oneshot">oneshot</option>
                  <option value="notify">notify</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. My awesome application"
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">After (Dependencies)</label>
                <input
                  type="text"
                  value={after}
                  onChange={(e) => setAfter(e.target.value)}
                  placeholder="e.g. network.target syslog.target"
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Execution Context */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-orange-500" />
              Execution Context
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ExecStart (Required)</label>
                <input
                  type="text"
                  value={execStart}
                  onChange={(e) => setExecStart(e.target.value)}
                  placeholder="e.g. /usr/bin/node /opt/myapp/index.js"
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ExecReload (Optional)</label>
                  <input
                    type="text"
                    value={execReload}
                    onChange={(e) => setExecReload(e.target.value)}
                    placeholder="e.g. /bin/kill -s HUP $MAINPID"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ExecStop (Optional)</label>
                  <input
                    type="text"
                    value={execStop}
                    onChange={(e) => setExecStop(e.target.value)}
                    placeholder="e.g. /bin/kill -s TERM $MAINPID"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Working Directory</label>
                  <input
                    type="text"
                    value={workingDirectory}
                    onChange={(e) => setWorkingDirectory(e.target.value)}
                    placeholder="e.g. /opt/myapp"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">User</label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="e.g. www-data"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Group</label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="e.g. www-data"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Restart Policy</label>
                  <select
                    value={restart}
                    onChange={(e) => setRestart(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-medium"
                  >
                    <option value="no">no</option>
                    <option value="always">always</option>
                    <option value="on-success">on-success</option>
                    <option value="on-failure">on-failure</option>
                    <option value="on-abnormal">on-abnormal</option>
                    <option value="on-abort">on-abort</option>
                    <option value="on-watchdog">on-watchdog</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">RestartSec</label>
                  <input
                    type="text"
                    value={restartSec}
                    onChange={(e) => setRestartSec(e.target.value)}
                    placeholder="e.g. 5s"
                    disabled={restart === 'no'}
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono disabled:bg-white/5 disabled:text-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Environment Variables</label>
                {renderKvpEditor(envVars, setEnvVars, 'Key (e.g. NODE_ENV)', 'Value (e.g. production)')}
              </div>
            </div>
          </div>

          {/* Security Hardening */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Security Hardening
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ProtectSystem</label>
                <select
                  value={protectSystem}
                  onChange={(e) => setProtectSystem(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-medium"
                >
                  <option value="false">false (No protection)</option>
                  <option value="true">true (Mounts /usr, /boot, /etc read-only)</option>
                  <option value="full">full (Also mounts /etc read-only)</option>
                  <option value="strict">strict (Entire file system read-only)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">ProtectHome</label>
                <select
                  value={protectHome}
                  onChange={(e) => setProtectHome(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-medium"
                >
                  <option value="false">false (No protection)</option>
                  <option value="true">true (Inaccessible /home, /root)</option>
                  <option value="read-only">read-only (Read-only /home, /root)</option>
                  <option value="tmpfs">tmpfs (Mounts empty tmpfs on /home, /root)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={privateTmp}
                  onChange={(e) => setPrivateTmp(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-white/10 focus:ring-amber-500/50 bg-[#030712]"
                />
                <div>
                  <span className="text-sm font-medium text-white block">PrivateTmp</span>
                  <span className="text-xs text-zinc-400">Sets up a new file system namespace for the executed processes and mounts private /tmp and /var/tmp directories.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={noNewPrivileges}
                  onChange={(e) => setNoNewPrivileges(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-white/10 focus:ring-amber-500/50 bg-[#030712]"
                />
                <div>
                  <span className="text-sm font-medium text-white block">NoNewPrivileges</span>
                  <span className="text-xs text-zinc-400">Ensures that the service process and all its children can never gain new privileges through execve().</span>
                </div>
              </label>
            </div>
          </div>

          {/* Timer (Cron Replacement) */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-500" />
                Timer (Cron Replacement)
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-zinc-400">Enable Timer</span>
                <input
                  type="checkbox"
                  checked={enableTimer}
                  onChange={(e) => setEnableTimer(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-white/10 focus:ring-amber-500/50 bg-[#030712]"
                />
              </label>
            </div>

            {enableTimer ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">OnCalendar (Cron-like schedule)</label>
                  <input
                    type="text"
                    value={onCalendar}
                    onChange={(e) => setOnCalendar(e.target.value)}
                    placeholder="e.g. *-*-* 00:00:00 (Daily at midnight) or Mon *-*-* 08:00:00"
                    className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">OnBootSec (Optional)</label>
                    <input
                      type="text"
                      value={onBootSec}
                      onChange={(e) => setOnBootSec(e.target.value)}
                      placeholder="e.g. 15min"
                      className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">OnUnitActiveSec (Optional)</label>
                    <input
                      type="text"
                      value={onUnitActiveSec}
                      onChange={(e) => setOnUnitActiveSec(e.target.value)}
                      placeholder="e.g. 1h"
                      className="w-full bg-[#030712] border border-white/10 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-white/10 rounded-xl">
                Timer is disabled. Enable it to generate a .timer unit file for scheduled execution.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0a0f1c] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-white/10 sticky top-24">
            <div className="bg-[#030712] px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('service')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'service' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  .service
                </button>
                {enableTimer && (
                  <button
                    onClick={() => setActiveTab('timer')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'timer' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    .timer
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('install')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'install' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Install Guide
                </button>
              </div>
              <button
                onClick={() => handleCopy(activeContent)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[calc(100vh-12rem)] overflow-y-auto">
              <pre className="font-mono text-sm text-emerald-400 leading-relaxed">
                {activeContent}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
