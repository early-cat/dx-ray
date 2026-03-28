import React from 'react';
import { ResourceCategory, ResourceKind } from '../types';
import { Box, Network, Database, Shield, Activity, ChevronRight } from 'lucide-react';

const categories: { name: ResourceCategory; icon: React.ReactNode; items: ResourceKind[] }[] = [
  {
    name: 'Workloads',
    icon: <Box className="w-4 h-4" />,
    items: ['Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob'],
  },
  {
    name: 'Networking',
    icon: <Network className="w-4 h-4" />,
    items: ['Service', 'Ingress', 'NetworkPolicy'],
  },
  {
    name: 'Config & Storage',
    icon: <Database className="w-4 h-4" />,
    items: ['ConfigMap', 'Secret', 'PersistentVolume', 'PersistentVolumeClaim', 'StorageClass'],
  },
  {
    name: 'Security & RBAC',
    icon: <Shield className="w-4 h-4" />,
    items: ['ServiceAccount', 'Role', 'ClusterRole', 'RoleBinding', 'ClusterRoleBinding'],
  },
  {
    name: 'Scaling',
    icon: <Activity className="w-4 h-4" />,
    items: ['HorizontalPodAutoscaler', 'ResourceQuota', 'LimitRange'],
  },
];

interface SidebarProps {
  onSelectResource: (kind: ResourceKind) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectResource }) => {
  return (
    <div className="w-64 bg-[#0a0f1c] text-zinc-400 flex flex-col h-full overflow-y-auto border-r border-white/10">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Box className="w-5 h-5 text-cyan-400" />
          Manifest Studio
        </h1>
      </div>
      <div className="flex-1 py-4">
        {categories.map((category) => (
          <div key={category.name} className="mb-6">
            <div className="px-4 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {category.icon}
              {category.name}
            </div>
            <ul className="space-y-0.5">
              {category.items.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onSelectResource(item)}
                    className="w-full flex items-center justify-between px-4 py-1.5 text-sm hover:bg-white/5 hover:text-white transition-colors group"
                  >
                    <span>{item}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
