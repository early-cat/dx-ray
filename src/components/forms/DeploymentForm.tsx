import React from 'react';
import { K8sResource } from '../../types';

interface DeploymentFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

export const DeploymentForm: React.FC<DeploymentFormProps> = ({ resource, onChange }) => {
  const spec = resource.spec || {};
  const templateSpec = spec.template?.spec || {};
  const container = templateSpec.containers?.[0] || {};

  const handleChange = (path: string[], value: any) => {
    const newResource = JSON.parse(JSON.stringify(resource));
    let current = newResource;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newResource);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Replicas</label>
          <input
            type="number"
            value={spec.replicas || 1}
            onChange={(e) => handleChange(['spec', 'replicas'], parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-md font-medium text-zinc-200 mb-4">Container Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Image</label>
            <input
              type="text"
              value={container.image || ''}
              onChange={(e) => handleChange(['spec', 'template', 'spec', 'containers', '0', 'image'], e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
              placeholder="nginx:latest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Pull Policy</label>
            <select
              value={container.imagePullPolicy || 'IfNotPresent'}
              onChange={(e) => handleChange(['spec', 'template', 'spec', 'containers', '0', 'imagePullPolicy'], e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
            >
              <option value="Always">Always</option>
              <option value="IfNotPresent">IfNotPresent</option>
              <option value="Never">Never</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">CPU Limit</label>
            <input
              type="text"
              value={container.resources?.limits?.cpu || ''}
              onChange={(e) => handleChange(['spec', 'template', 'spec', 'containers', '0', 'resources', 'limits', 'cpu'], e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
              placeholder="100m"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Memory Limit</label>
            <input
              type="text"
              value={container.resources?.limits?.memory || ''}
              onChange={(e) => handleChange(['spec', 'template', 'spec', 'containers', '0', 'resources', 'limits', 'memory'], e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
              placeholder="128Mi"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
