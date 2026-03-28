import React from 'react';
import { K8sResource } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface RBACFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

const ALL_VERBS = ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'];
const COMMON_RESOURCES = ['pods', 'services', 'endpoints', 'persistentvolumeclaims', 'events', 'configmaps', 'secrets', 'namespaces', 'nodes', 'deployments', 'statefulsets', 'daemonsets', 'replicasets', 'jobs', 'cronjobs', 'ingresses', 'networkpolicies'];

export const RBACForm: React.FC<RBACFormProps> = ({ resource, onChange }) => {
  const rules = resource.rules || [];

  const handleAddRule = () => {
    const newRules = [...rules, { apiGroups: [''], resources: ['pods'], verbs: ['get', 'list'] }];
    onChange({ ...resource, rules: newRules });
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    onChange({ ...resource, rules: newRules });
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...resource, rules: newRules });
  };

  const toggleVerb = (ruleIndex: number, verb: string) => {
    const rule = rules[ruleIndex];
    const verbs = rule.verbs || [];
    const newVerbs = verbs.includes(verb) 
      ? verbs.filter((v: string) => v !== verb)
      : [...verbs, verb];
    handleRuleChange(ruleIndex, 'verbs', newVerbs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-zinc-200">Rules</h4>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {rules.map((rule: any, index: number) => (
        <div key={index} className="p-4 border border-white/10 rounded-lg bg-[#030712] relative">
          <button
            onClick={() => handleRemoveRule(index)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:pr-8">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">API Groups</label>
              <input
                type="text"
                value={(rule.apiGroups || []).join(', ')}
                onChange={(e) => handleRuleChange(index, 'apiGroups', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
                placeholder="e.g. '', 'apps', 'extensions'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Resources</label>
              <input
                type="text"
                value={(rule.resources || []).join(', ')}
                onChange={(e) => handleRuleChange(index, 'resources', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-3 py-2 bg-[#0a0f1c] text-white border border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 sm:text-sm"
                placeholder="e.g. pods, deployments"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Verbs</label>
            <div className="flex flex-wrap gap-2">
              {ALL_VERBS.map(verb => {
                const isSelected = (rule.verbs || []).includes(verb);
                return (
                  <button
                    key={verb}
                    onClick={() => toggleVerb(index, verb)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      isSelected 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                        : 'bg-[#0a0f1c] text-zinc-400 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {verb}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      {rules.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-white/10 rounded-lg">
          No rules defined. Click "Add Rule" to configure permissions.
        </div>
      )}
    </div>
  );
};
