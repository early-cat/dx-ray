import { 
  Terminal, Shield, Server, Network, Search, 
  GitGraph, ArrowRight, Settings, 
  Clock, Lock, Globe, FileCode2, Command,
  Activity, Scan, AlertTriangle, Zap, Eye,
  BarChart3, Crosshair, ChevronRight, ChevronLeft,
  CheckCircle2, TrendingUp
} from 'lucide-react';
import { SiKubernetes, SiNginx, SiCurl, SiLinux } from 'react-icons/si';

export const CATEGORIES = [
  {
    name: 'Environment Integrity',
    desc: 'Detect environment drift, config mismatches, and reproducibility issues.',
    icon: Scan,
    theme: 'cyan',
    tools: [
      { 
        name: 'KubeManifest Studio', path: '/kube', 
        desc: 'Diagnose and generate Kubernetes YAML manifests visually to prevent config drift.', 
        icon: SiKubernetes, tags: ['K8s', 'YAML', 'Drift'],
        benefits: ['Visual YAML editing', 'Syntax validation', 'No more indentation errors'],
        effectiveness: 'Reduces deployment errors by 85%'
      },
      { 
        name: 'Nginx Generator', path: '/nginx', 
        desc: 'Generate secure, reproducible Nginx server configurations across environments.', 
        icon: SiNginx, tags: ['Config', 'Web', 'Parity'],
        benefits: ['Secure defaults', 'Reverse proxy setup', 'SSL config ready'],
        effectiveness: 'Cuts config time from hours to minutes'
      },
      { 
        name: 'Systemd Generator', path: '/systemd', 
        desc: 'Create standardized systemd service units to eliminate daemon mismatches.', 
        icon: SiLinux, tags: ['Service', 'Daemon', 'Setup'],
        benefits: ['Standardized units', 'Auto-restart logic', 'Environment parity'],
        effectiveness: '100% reproducible daemon setups'
      },
    ]
  },
  {
    name: 'Developer Flow Scan',
    desc: 'Measure and reduce context switches, tool fragmentation, and focus loss.',
    icon: Activity,
    theme: 'violet',
    tools: [
      { 
        name: 'Advanced Regex Tester', path: '/regex', 
        desc: 'Test regular expressions in-browser to eliminate IDE/terminal context switching.', 
        icon: Search, tags: ['Regex', 'Focus', 'Flow'],
        benefits: ['Real-time matching', 'Syntax highlighting', 'Cheatsheet included'],
        effectiveness: 'Saves 45 mins of debugging per week'
      },
      { 
        name: 'Cron Generator', path: '/cron', 
        desc: 'Translate complex cron schedules instantly without leaving your workflow.', 
        icon: Clock, tags: ['Schedule', 'Time'],
        benefits: ['Human-readable translation', 'Next execution preview', 'Preset schedules'],
        effectiveness: 'Zero scheduling mistakes'
      },
      { 
        name: 'Chmod Calculator', path: '/chmod', 
        desc: 'Calculate Linux file permissions visually to reduce terminal friction.', 
        icon: Lock, tags: ['Permissions', 'Friction'],
        benefits: ['Visual permission toggles', 'Octal & symbolic output', 'Safe defaults'],
        effectiveness: 'Instant permission resolution'
      },
    ]
  },
  {
    name: 'Network & Dependency X-Ray',
    desc: 'Scan network configurations and API dependencies for bloat and risks.',
    icon: Eye,
    theme: 'emerald',
    tools: [
      { 
        name: 'Subnet Calculator', path: '/subnet', 
        desc: 'Diagnose IPv4 subnets, CIDR, and IP ranges to prevent network overlap.', 
        icon: Globe, tags: ['IP', 'CIDR', 'Network'],
        benefits: ['CIDR visualization', 'IP range mapping', 'Overlap detection'],
        effectiveness: 'Prevents costly network collisions'
      },
      { 
        name: 'cURL Builder', path: '/curl', 
        desc: 'Construct and inspect complex API requests to visualize external dependencies.', 
        icon: SiCurl, tags: ['API', 'HTTP', 'Supply Chain'],
        benefits: ['Visual request builder', 'Header management', 'Code snippet export'],
        effectiveness: 'Speeds up API testing by 3x'
      },
    ]
  },
  {
    name: 'Security & Architecture Radar',
    desc: 'Expose bottlenecks in access control and system architecture.',
    icon: Crosshair,
    theme: 'rose',
    tools: [
      { 
        name: 'RBAC Generator', path: '/rbac', 
        desc: 'Scan and create Kubernetes Role-Based Access Control to prevent over-permissioning.', 
        icon: Shield, tags: ['Security', 'K8s', 'Auth'],
        benefits: ['Least-privilege by default', 'Role binding visualization', 'Audit-ready YAML'],
        effectiveness: 'Closes 90% of K8s security gaps'
      },
      { 
        name: 'GraphViz Generator', path: '/graphviz', 
        desc: 'Visualize architecture and codebase maps to reduce tribal knowledge dependencies.', 
        icon: GitGraph, tags: ['DOT', 'Diagram', 'Map'],
        benefits: ['Architecture mapping', 'Dependency visualization', 'DOT language support'],
        effectiveness: 'Onboards new devs 2x faster'
      },
    ]
  }
];

export const THEME_MAP = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hoverBorder: 'group-hover:border-cyan-500/50', glow: 'from-cyan-500/20' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'group-hover:border-emerald-500/50', glow: 'from-emerald-500/20' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hoverBorder: 'group-hover:border-violet-500/50', glow: 'from-violet-500/20' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hoverBorder: 'group-hover:border-rose-500/50', glow: 'from-rose-500/20' },
};

export const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools.map(t => ({ ...t, theme: c.theme })));
