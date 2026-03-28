import React from 'react';
import { ResourceMetadata } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface MetadataFormProps {
  metadata: ResourceMetadata;
  onChange: (metadata: ResourceMetadata) => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  const handleLabelChange = (oldKey: string, newKey: string, value: string) => {
    const newLabels = { ...metadata.labels };
    if (oldKey !== newKey) {
      delete newLabels[oldKey];
    }
    newLabels[newKey] = value;
    onChange({ ...metadata, labels: newLabels });
  };

  const handleAddLabel = () => {
    onChange({ ...metadata, labels: { ...metadata.labels, '': '' } });
  };

  const handleRemoveLabel = (key: string) => {
    const newLabels = { ...metadata.labels };
    delete newLabels[key];
    onChange({ ...metadata, labels: newLabels });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => onChange({ ...metadata, name: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
            placeholder="my-resource"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Namespace</label>
          <input
            type="text"
            value={metadata.namespace || 'default'}
            onChange={(e) => onChange({ ...metadata, namespace: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
            placeholder="default"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-300">Labels</label>
          <button
            onClick={handleAddLabel}
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            <Plus className="w-3 h-3" /> Add Label
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(metadata.labels || {}).map(([key, value], index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => handleLabelChange(key, e.target.value, value)}
                placeholder="Key"
                className="flex-1 px-3 py-1.5 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleLabelChange(key, key, e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-1.5 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
              />
              <button
                onClick={() => handleRemoveLabel(key)}
                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {Object.keys(metadata.labels || {}).length === 0 && (
            <div className="text-sm text-zinc-500 italic">No labels defined.</div>
          )}
        </div>
      </div>
    </div>
  );
};
