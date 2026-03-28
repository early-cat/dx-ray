import React from 'react';
import { K8sResource } from '../../types';

interface CronJobFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

export const CronJobForm: React.FC<CronJobFormProps> = ({ resource, onChange }) => {
  const spec = resource.spec || {};

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

  const schedulePresets = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every 5 Minutes', value: '*/5 * * * *' },
    { label: 'Hourly', value: '0 * * * *' },
    { label: 'Daily (Midnight)', value: '0 0 * * *' },
    { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
    { label: 'Monthly', value: '0 0 1 * *' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Schedule (Cron Expression)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={spec.schedule || ''}
            onChange={(e) => handleChange(['spec', 'schedule'], e.target.value)}
            className="flex-1 px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm font-mono"
            placeholder="* * * * *"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {schedulePresets.map(preset => (
            <button
              key={preset.value}
              onClick={() => handleChange(['spec', 'schedule'], preset.value)}
              className="px-2 py-1 text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 rounded-md transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Concurrency Policy</label>
          <select
            value={spec.concurrencyPolicy || 'Allow'}
            onChange={(e) => handleChange(['spec', 'concurrencyPolicy'], e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
          >
            <option value="Allow">Allow</option>
            <option value="Forbid">Forbid</option>
            <option value="Replace">Replace</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Suspend</label>
          <div className="flex items-center h-10">
            <input
              type="checkbox"
              checked={spec.suspend || false}
              onChange={(e) => handleChange(['spec', 'suspend'], e.target.checked)}
              className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/50 border-white/10 rounded bg-[#0a0f1c]"
            />
            <span className="ml-2 text-sm text-zinc-400">Suspend execution</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-md font-medium text-zinc-200 mb-4">Job Template</h4>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Command</label>
          <input
            type="text"
            value={(spec.jobTemplate?.spec?.template?.spec?.containers?.[0]?.command || []).join(' ')}
            onChange={(e) => handleChange(['spec', 'jobTemplate', 'spec', 'template', 'spec', 'containers', '0', 'command'], e.target.value.split(' '))}
            className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm font-mono"
            placeholder="/bin/sh -c 'date'"
          />
        </div>
      </div>
    </div>
  );
};
