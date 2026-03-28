import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Server, Copy, Check, Download, ShieldCheck, Zap, Globe, Route } from 'lucide-react';
import { SEO } from '../components/SEO';

interface NginxConfig {
  serverName: string;
  listenPort: number;
  rootDir: string;
  
  // Routing & Proxy
  isReverseProxy: boolean;
  upstreamServers: string;
  supportWebSockets: boolean;
  spaMode: boolean;

  // Security & HTTPS
  enableHttps: boolean;
  forceHttpsRedirect: boolean;
  enableHsts: boolean;
  xFrameOptions: boolean;
  xXssProtection: boolean;
  cspBasic: boolean;

  // Performance
  gzipCompression: boolean;
  browserCaching: boolean;
  clientMaxBodySize: string;
  keepaliveTimeout: number;
}

const DEFAULT_CONFIG: NginxConfig = {
  serverName: 'example.com',
  listenPort: 80,
  rootDir: '/var/www/html',
  isReverseProxy: false,
  upstreamServers: '127.0.0.1:3000\n127.0.0.1:3001',
  supportWebSockets: false,
  spaMode: false,
  enableHttps: false,
  forceHttpsRedirect: true,
  enableHsts: true,
  xFrameOptions: true,
  xXssProtection: true,
  cspBasic: false,
  gzipCompression: false,
  browserCaching: false,
  clientMaxBodySize: '10M',
  keepaliveTimeout: 65,
};

function generateNginxConfig(config: NginxConfig): string {
  let out = '';
  
  // Upstream block if reverse proxy
  if (config.isReverseProxy && config.upstreamServers.trim()) {
    const servers = config.upstreamServers.split('\n').map(s => s.trim()).filter(s => s);
    if (servers.length > 0) {
      out += `upstream backend {\n`;
      servers.forEach(s => {
        out += `    server ${s};\n`;
      });
      out += `}\n\n`;
    }
  }

  // HTTP to HTTPS redirect block
  if (config.enableHttps && config.forceHttpsRedirect) {
    out += `server {\n`;
    out += `    listen 80;\n`;
    out += `    listen [::]:80;\n`;
    out += `    server_name ${config.serverName || '_'};\n`;
    out += `    return 301 https://$host$request_uri;\n`;
    out += `}\n\n`;
  }

  // Main server block
  out += `server {\n`;
  
  if (config.enableHttps) {
    out += `    listen 443 ssl http2;\n`;
    out += `    listen [::]:443 ssl http2;\n`;
    out += `    ssl_certificate /etc/nginx/ssl/${config.serverName || 'example.com'}.crt;\n`;
    out += `    ssl_certificate_key /etc/nginx/ssl/${config.serverName || 'example.com'}.key;\n`;
  } else {
    out += `    listen ${config.listenPort};\n`;
    out += `    listen [::]:${config.listenPort};\n`;
  }

  out += `    server_name ${config.serverName || '_'};\n`;
  
  if (!config.isReverseProxy) {
    out += `    root ${config.rootDir || '/var/www/html'};\n`;
    out += `    index index.html index.htm;\n`;
  }

  out += `\n`;

  // Security Headers
  let hasSecurity = false;
  if (config.enableHsts && config.enableHttps) {
    out += `    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\n`;
    hasSecurity = true;
  }
  if (config.xFrameOptions) {
    out += `    add_header X-Frame-Options "DENY" always;\n`;
    hasSecurity = true;
  }
  if (config.xXssProtection) {
    out += `    add_header X-XSS-Protection "1; mode=block" always;\n`;
    hasSecurity = true;
  }
  if (config.cspBasic) {
    out += `    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;\n`;
    hasSecurity = true;
  }
  if (hasSecurity) out += `\n`;

  // Performance
  if (config.clientMaxBodySize) {
    out += `    client_max_body_size ${config.clientMaxBodySize};\n`;
  }
  if (config.keepaliveTimeout) {
    out += `    keepalive_timeout ${config.keepaliveTimeout};\n`;
  }
  out += `\n`;

  // Gzip
  if (config.gzipCompression) {
    out += `    gzip on;\n`;
    out += `    gzip_vary on;\n`;
    out += `    gzip_proxied any;\n`;
    out += `    gzip_comp_level 6;\n`;
    out += `    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;\n\n`;
  }

  // Routing
  out += `    location / {\n`;
  
  if (config.isReverseProxy) {
    out += `        proxy_pass http://backend;\n`;
    out += `        proxy_http_version 1.1;\n`;
    out += `        proxy_set_header Host $host;\n`;
    out += `        proxy_set_header X-Real-IP $remote_addr;\n`;
    out += `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n`;
    out += `        proxy_set_header X-Forwarded-Proto $scheme;\n`;
    
    if (config.supportWebSockets) {
      out += `\n        # WebSocket support\n`;
      out += `        proxy_set_header Upgrade $http_upgrade;\n`;
      out += `        proxy_set_header Connection "upgrade";\n`;
    }
  } else {
    if (config.spaMode) {
      out += `        try_files $uri $uri/ /index.html;\n`;
    } else {
      out += `        try_files $uri $uri/ =404;\n`;
    }
  }
  out += `    }\n`;

  // Browser Caching
  if (config.browserCaching && !config.isReverseProxy) {
    out += `\n    # Cache static assets\n`;
    out += `    location ~* \\.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc)$ {\n`;
    out += `        expires 1M;\n`;
    out += `        access_log off;\n`;
    out += `        add_header Cache-Control "public";\n`;
    out += `    }\n`;
  }

  // Deny hidden files
  out += `\n    # Deny access to hidden files\n`;
  out += `    location ~ /\\. {\n`;
  out += `        deny all;\n`;
  out += `    }\n`;

  out += `}\n`;

  return out;
}

export const NginxGenerator = () => {
  const [config, setConfig] = useState<NginxConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOutput(generateNginxConfig(config));
  }, [config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.serverName || 'nginx'}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateConfig = (key: keyof NginxConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#030712] text-white font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      <SEO 
        title="Nginx Config Generator" 
        description="Generate Nginx configuration files for reverse proxies, SPAs, and static sites. Configure SSL, security headers, caching, and performance tuning."
        keywords="nginx generator, nginx config, reverse proxy, nginx ssl, nginx security headers"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none"></div>
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
          <Server className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-white">Nginx Config Generator</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1 min-h-0">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Basic Settings */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-500" />
              Basic Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Domain / Server Name</label>
                <input
                  type="text"
                  value={config.serverName}
                  onChange={(e) => updateConfig('serverName', e.target.value)}
                  placeholder="example.com www.example.com"
                  className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Listen Port</label>
                  <input
                    type="number"
                    value={config.listenPort}
                    onChange={(e) => updateConfig('listenPort', parseInt(e.target.value) || 80)}
                    disabled={config.enableHttps}
                    className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm disabled:opacity-50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Root Directory</label>
                  <input
                    type="text"
                    value={config.rootDir}
                    onChange={(e) => updateConfig('rootDir', e.target.value)}
                    disabled={config.isReverseProxy}
                    className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm disabled:opacity-50 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Routing & Proxy */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <Route className="w-5 h-5 text-indigo-500" />
              Routing & Proxy
            </h2>
            <div className="space-y-4">
              <Toggle 
                label="Reverse Proxy / Load Balancer" 
                checked={config.isReverseProxy} 
                onChange={(v) => updateConfig('isReverseProxy', v)} 
              />
              
              {config.isReverseProxy ? (
                <div className="pl-4 border-l-2 border-indigo-500/30 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Upstream Servers (one per line)</label>
                    <textarea
                      value={config.upstreamServers}
                      onChange={(e) => updateConfig('upstreamServers', e.target.value)}
                      rows={3}
                      placeholder="127.0.0.1:3000&#10;127.0.0.1:3001"
                      className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm font-mono resize-none text-white"
                    />
                  </div>
                  <Toggle 
                    label="Support WebSockets" 
                    checked={config.supportWebSockets} 
                    onChange={(v) => updateConfig('supportWebSockets', v)} 
                  />
                </div>
              ) : (
                <Toggle 
                  label="SPA Mode (React/Vue/Angular)" 
                  description="Redirects all 404s to index.html"
                  checked={config.spaMode} 
                  onChange={(v) => updateConfig('spaMode', v)} 
                />
              )}
            </div>
          </div>

          {/* Security & HTTPS */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Security & HTTPS
            </h2>
            <div className="space-y-4">
              <Toggle 
                label="Enable HTTPS (SSL)" 
                checked={config.enableHttps} 
                onChange={(v) => updateConfig('enableHttps', v)} 
              />
              {config.enableHttps && (
                <div className="pl-4 border-l-2 border-emerald-500/30 space-y-4">
                  <Toggle 
                    label="Force HTTP to HTTPS Redirect" 
                    checked={config.forceHttpsRedirect} 
                    onChange={(v) => updateConfig('forceHttpsRedirect', v)} 
                  />
                  <Toggle 
                    label="HSTS (Strict-Transport-Security)" 
                    checked={config.enableHsts} 
                    onChange={(v) => updateConfig('enableHsts', v)} 
                  />
                </div>
              )}
              <div className="pt-2 border-t border-white/10 space-y-4">
                <Toggle 
                  label="X-Frame-Options (DENY)" 
                  checked={config.xFrameOptions} 
                  onChange={(v) => updateConfig('xFrameOptions', v)} 
                />
                <Toggle 
                  label="X-XSS-Protection" 
                  checked={config.xXssProtection} 
                  onChange={(v) => updateConfig('xXssProtection', v)} 
                />
                <Toggle 
                  label="Content-Security-Policy (Basic)" 
                  checked={config.cspBasic} 
                  onChange={(v) => updateConfig('cspBasic', v)} 
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              Performance
            </h2>
            <div className="space-y-4">
              <Toggle 
                label="Gzip Compression" 
                checked={config.gzipCompression} 
                onChange={(v) => updateConfig('gzipCompression', v)} 
              />
              {!config.isReverseProxy && (
                <Toggle 
                  label="Browser Caching (Static Files)" 
                  checked={config.browserCaching} 
                  onChange={(v) => updateConfig('browserCaching', v)} 
                />
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Client Max Body Size</label>
                  <input
                    type="text"
                    value={config.clientMaxBodySize}
                    onChange={(e) => updateConfig('clientMaxBodySize', e.target.value)}
                    placeholder="e.g. 10M, 50M"
                    className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Keepalive Timeout (s)</label>
                  <input
                    type="number"
                    value={config.keepaliveTimeout}
                    onChange={(e) => updateConfig('keepaliveTimeout', parseInt(e.target.value) || 65)}
                    className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-[#0a0f1c] rounded-2xl shadow-xl flex flex-col h-full border border-white/10 overflow-hidden">
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#030712] border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="ml-2 text-sm font-mono text-zinc-500">nginx.conf</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            
            {/* Output Code */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <pre className="font-mono text-sm text-emerald-400">
                <code>{output}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Toggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative flex items-center mt-0.5">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{label}</span>
      {description && <span className="text-xs text-zinc-500 mt-0.5">{description}</span>}
    </div>
  </label>
);

// Add custom scrollbar styles to index.css if not already present
// .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 4px; }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
