import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Network, Calculator, Download, CheckCircle2, XCircle, History, Info, Server, Globe, Code2 } from 'lucide-react';
import { SEO } from '../components/SEO';

// --- IP Math Utilities ---
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

function toBinary(int: number): string {
  return (int >>> 0).toString(2).padStart(32, '0').match(/.{1,8}/g)!.join('.');
}

function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const num = parseInt(p, 10);
    return num >= 0 && num <= 255 && p === num.toString();
  });
}

interface SubnetInfo {
  ip: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsable: string;
  lastUsable: string;
  totalAddresses: number;
  usableHosts: number;
  networkBinary: string;
  maskBinary: string;
  broadcastBinary: string;
}

function calculateSubnet(ip: string, cidr: number): SubnetInfo | null {
  if (!isValidIp(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) return null;

  const ipInt = ipToInt(ip);
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalAddresses = cidr === 0 ? 4294967296 : Math.pow(2, 32 - cidr);
  let usableHosts = totalAddresses - 2;
  if (cidr === 32) usableHosts = 1;
  else if (cidr === 31) usableHosts = 2;

  let firstUsableInt = networkInt + 1;
  let lastUsableInt = broadcastInt - 1;

  if (cidr === 32) {
    firstUsableInt = networkInt;
    lastUsableInt = networkInt;
  } else if (cidr === 31) {
    firstUsableInt = networkInt;
    lastUsableInt = broadcastInt;
  }

  return {
    ip,
    cidr,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    firstUsable: intToIp(firstUsableInt),
    lastUsable: intToIp(lastUsableInt),
    totalAddresses,
    usableHosts,
    networkBinary: toBinary(networkInt),
    maskBinary: toBinary(maskInt),
    broadcastBinary: toBinary(broadcastInt),
  };
}

export const SubnetCalculator = () => {
  const [input, setInput] = useState('192.168.1.0/24');
  const [info, setInfo] = useState<SubnetInfo | null>(null);
  const [error, setError] = useState('');
  
  const [checkIp, setCheckIp] = useState('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    parseAndCalculate(input);
  }, [input]);

  const parseAndCalculate = (val: string) => {
    setError('');
    const parts = val.split('/');
    if (parts.length !== 2) {
      setInfo(null);
      return;
    }
    const ip = parts[0].trim();
    const cidr = parseInt(parts[1].trim(), 10);

    if (!isValidIp(ip)) {
      setError('Invalid IP address format.');
      setInfo(null);
      return;
    }
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      setError('CIDR must be between 0 and 32.');
      setInfo(null);
      return;
    }

    const result = calculateSubnet(ip, cidr);
    setInfo(result);
    
    if (result && !history.includes(val)) {
      setHistory(prev => [val, ...prev].slice(0, 10));
    }
  };

  useEffect(() => {
    if (!info || !checkIp) {
      setCheckResult(null);
      return;
    }
    if (!isValidIp(checkIp)) {
      setCheckResult(null);
      return;
    }
    const checkInt = ipToInt(checkIp);
    const networkInt = ipToInt(info.networkAddress);
    const broadcastInt = ipToInt(info.broadcastAddress);
    
    setCheckResult(checkInt >= networkInt && checkInt <= broadcastInt);
  }, [checkIp, info]);

  const downloadJSON = () => {
    if (!info) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(info, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `subnet_${info.networkAddress}_${info.cidr}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <SEO 
        title="IP Subnet Calculator" 
        description="Calculate IPv4 subnets, network addresses, broadcast addresses, and usable host ranges. Includes an IP in subnet checker."
        keywords="subnet calculator, ip calculator, cidr calculator, ipv4 subnetting, network calculator"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none"></div>
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
          <Globe className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-white">IP Subnet Calculator</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Inputs & Tools */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main Input */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Calculate Subnet
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1">IP Address / CIDR</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 192.168.1.0/24"
                className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-mono text-sm text-white"
              />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
            <div className="text-xs text-zinc-400 bg-[#030712] p-3 rounded-xl border border-white/10">
              <p className="font-medium text-zinc-300 mb-1">Quick Reference:</p>
              <ul className="grid grid-cols-2 gap-1">
                <li>/8 - 16.7M hosts</li>
                <li>/16 - 65,534 hosts</li>
                <li>/24 - 254 hosts</li>
                <li>/32 - 1 host</li>
              </ul>
            </div>
          </div>

          {/* IP Checker */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              IP in Subnet Checker
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Check IP Address</label>
              <input
                type="text"
                value={checkIp}
                onChange={(e) => setCheckIp(e.target.value)}
                placeholder="e.g. 192.168.1.50"
                className="w-full px-4 py-2 bg-[#030712] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all font-mono text-sm text-white"
              />
            </div>
            {checkIp && isValidIp(checkIp) && info && (
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${checkResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {checkResult ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">
                  {checkResult ? 'IP belongs to this subnet' : 'IP is outside this subnet'}
                </span>
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-blue-500" />
              Recent Calculations
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No history yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(h)}
                    className="text-left px-3 py-2 text-sm font-mono text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {info ? (
            <>
              {/* Main Info Card */}
              <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-zinc-300 flex items-center gap-2">
                    <Server className="w-6 h-6 text-indigo-500" />
                    Subnet Information
                  </h2>
                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoBox label="Network Address" value={info.networkAddress} />
                  <InfoBox label="Broadcast Address" value={info.broadcastAddress} />
                  <InfoBox label="Subnet Mask" value={info.subnetMask} />
                  <InfoBox label="Wildcard Mask" value={info.wildcardMask} />
                  <InfoBox label="First Usable IP" value={info.firstUsable} />
                  <InfoBox label="Last Usable IP" value={info.lastUsable} />
                  <InfoBox label="Total Addresses" value={info.totalAddresses.toLocaleString()} />
                  <InfoBox label="Usable Hosts" value={info.usableHosts.toLocaleString()} />
                  <InfoBox label="CIDR Notation" value={`/${info.cidr}`} />
                  <InfoBox label="Prefix / Host Bits" value={`${info.cidr} / ${32 - info.cidr}`} />
                </div>
              </div>

              {/* Binary Representation */}
              <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5 text-blue-500" />
                  Binary Representation
                </h2>
                <div className="space-y-4 font-mono text-sm">
                  <div>
                    <div className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Network Address</div>
                    <div className="bg-[#030712] border border-white/10 text-emerald-400 p-3 rounded-xl overflow-x-auto">
                      {info.networkBinary}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Subnet Mask</div>
                    <div className="bg-[#030712] border border-white/10 text-blue-400 p-3 rounded-xl overflow-x-auto">
                      {info.maskBinary}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Broadcast Address</div>
                    <div className="bg-[#030712] border border-white/10 text-rose-400 p-3 rounded-xl overflow-x-auto">
                      {info.broadcastBinary}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Space Map */}
              <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-300 flex items-center gap-2 mb-4">
                  <Network className="w-5 h-5 text-emerald-500" />
                  Address Space Map
                </h2>
                <div className="relative pt-8 pb-4 px-4">
                  <div className="h-4 bg-[#030712] rounded-full flex overflow-hidden relative border border-white/10">
                    {info.cidr >= 31 ? (
                      <div className="h-full bg-indigo-500 w-full" title="All addresses"></div>
                    ) : (
                      <>
                        <div className="h-full bg-rose-500" style={{ width: '2%' }} title="Network Address"></div>
                        <div className="h-full bg-emerald-500" style={{ width: '96%' }} title="Usable Hosts"></div>
                        <div className="h-full bg-blue-500" style={{ width: '2%' }} title="Broadcast Address"></div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs font-mono text-zinc-500">
                    <div className="flex flex-col items-start">
                      <span className="text-rose-400 font-bold mb-1">Network</span>
                      <span>{info.networkAddress}</span>
                    </div>
                    {info.cidr < 31 && (
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-bold mb-1">Usable Range</span>
                        <span>{info.firstUsable} - {info.lastUsable}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-blue-400 font-bold mb-1">Broadcast</span>
                      <span>{info.broadcastAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">Enter a valid IP/CIDR</h3>
              <p className="text-zinc-500 max-w-md">
                Type an IP address and CIDR prefix (e.g., 10.0.0.0/8) in the input field to see detailed subnet calculations.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const InfoBox = ({ label, value }: { label: string, value: string }) => (
  <div className="p-4 bg-[#030712] border border-white/10 rounded-xl flex flex-col">
    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-lg font-mono font-semibold text-zinc-300">{value}</span>
  </div>
);
