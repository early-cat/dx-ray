import React, { useState } from 'react';
import { K8sResource } from '../../types';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface SecretFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

export const SecretForm: React.FC<SecretFormProps> = ({ resource, onChange }) => {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const data = resource.data || {};

  const handleDataChange = (oldKey: string, newKey: string, value: string) => {
    const newData = { ...data };
    if (oldKey !== newKey) {
      delete newData[oldKey];
    }
    // Automatically base64 encode the value
    newData[newKey] = btoa(value);
    onChange({ ...resource, data: newData });
  };

  const handleAddData = () => {
    onChange({ ...resource, data: { ...data, '': '' } });
  };

  const handleRemoveData = (key: string) => {
    const newData = { ...data };
    delete newData[key];
    onChange({ ...resource, data: newData });
  };

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Secret Type</label>
        <select
          value={resource.type || 'Opaque'}
          onChange={(e) => onChange({ ...resource, type: e.target.value })}
          className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm"
        >
          <option value="Opaque">Opaque</option>
          <option value="kubernetes.io/tls">kubernetes.io/tls</option>
          <option value="kubernetes.io/dockerconfigjson">kubernetes.io/dockerconfigjson</option>
          <option value="kubernetes.io/basic-auth">kubernetes.io/basic-auth</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-300">Data (Auto Base64 Encoded)</label>
          <button
            onClick={handleAddData}
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            <Plus className="w-3 h-3" /> Add Data
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(data).map(([key, encodedValue], index) => {
            const decodedValue = encodedValue ? atob(encodedValue as string) : '';
            const isVisible = showValues[key];

            return (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => handleDataChange(key, e.target.value, decodedValue)}
                  placeholder="Key"
                  className="w-full sm:w-1/3 px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
                />
                <div className="w-full sm:flex-1 relative">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={decodedValue}
                    onChange={(e) => handleDataChange(key, key, e.target.value)}
                    placeholder="Value (will be encoded)"
                    className="w-full px-3 py-2 pr-10 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
                  />
                  <button
                    onClick={() => toggleShowValue(key)}
                    className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveData(key)}
                  className="self-end sm:self-auto p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          {Object.keys(data).length === 0 && (
            <div className="text-sm text-zinc-500 italic">No data defined.</div>
          )}
        </div>
      </div>
    </div>
  );
};
