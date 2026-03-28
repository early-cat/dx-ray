import React from 'react';
import { K8sResource } from '../../types';

interface GenericSpecFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

export const GenericSpecForm: React.FC<GenericSpecFormProps> = ({ resource, onChange }) => {
  const spec = resource.spec || {};
  const data = resource.data || {};

  const handleSpecChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onChange({ ...resource, spec: parsed });
    } catch (err) {
      // Ignore parse errors while typing
    }
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onChange({ ...resource, data: parsed });
    } catch (err) {
      // Ignore parse errors while typing
    }
  };

  const isDataResource = resource.kind === 'ConfigMap';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {isDataResource ? 'Data (JSON)' : 'Spec (JSON)'}
        </label>
        <p className="text-xs text-zinc-500 mb-2">
          Advanced configuration for {resource.kind}. Enter valid JSON.
        </p>
        <textarea
          defaultValue={JSON.stringify(isDataResource ? data : spec, null, 2)}
          onChange={isDataResource ? handleDataChange : handleSpecChange}
          rows={15}
          className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm font-mono"
          placeholder="{}"
        />
      </div>
    </div>
  );
};
