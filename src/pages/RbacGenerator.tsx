import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Plus, Trash2, Copy, Check, Lock, FileCode2, Terminal } from 'lucide-react';
import { SEO } from '../components/SEO';

type PolicyType = 'Role' | 'ClusterRole';
type SubjectKind = 'User' | 'Group' | 'ServiceAccount';

interface KVP {
  id: string;
  key: string;
  value: string;
}

interface Rule {
  id: string;
  apiGroups: string;
  resources: string;
  verbs: string[];
}

interface Subject {
  id: string;
  kind: SubjectKind;
  name: string;
  namespace: string;
}

const VERBS = ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete', 'deletecollection', '*'];

const createId = () => Math.random().toString(36).substring(7);

export const RbacGenerator = () => {
  const [policyType, setPolicyType] = useState<PolicyType>('Role');
  const [copied, setCopied] = useState(false);

  // Metadata
  const [name, setName] = useState('my-role');
  const [namespace, setNamespace] = useState('default');
  const [labels, setLabels] = useState<KVP[]>([]);
  const [annotations, setAnnotations] = useState<KVP[]>([]);

  // Rules
  const [rules, setRules] = useState<Rule[]>([
    { id: createId(), apiGroups: '""', resources: 'pods', verbs: ['get', 'list'] }
  ]);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: createId(), kind: 'User', name: 'jane.doe@example.com', namespace: 'default' }
  ]);

  // Binding
  const [bindingName, setBindingName] = useState('my-role-binding');

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addRule = () => {
    setRules([...rules, { id: createId(), apiGroups: '""', resources: '', verbs: [] }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof Rule, value: any) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleVerb = (ruleId: string, verb: string) => {
    setRules(rules.map(r => {
      if (r.id !== ruleId) return r;
      const newVerbs = r.verbs.includes(verb)
        ? r.verbs.filter(v => v !== verb)
        : [...r.verbs, verb];
      return { ...r, verbs: newVerbs };
    }));
  };

  const addSubject = () => {
    setSubjects([...subjects, { id: createId(), kind: 'User', name: '', namespace: 'default' }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (id: string, field: keyof Subject, value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const renderKvpEditor = (items: KVP[], setItems: React.Dispatch<React.SetStateAction<KVP[]>>, placeholderKey: string, placeholderValue: string) => {
    const updateItem = (id: string, field: keyof KVP, value: string) => {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));
    const addItem = () => setItems([...items, { id: createId(), key: '', value: '' }]);

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <input
              type="text"
              value={item.key}
              onChange={(e) => updateItem(item.id, 'key', e.target.value)}
              placeholder={placeholderKey}
              className="flex-1 bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(item.id, 'value', e.target.value)}
              placeholder={placeholderValue}
              className="flex-1 bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-md hover:bg-indigo-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Row
        </button>
      </div>
    );
  };

  const generatedYaml = useMemo(() => {
    const formatArray = (str: string) => {
      return str.split(',').map(s => s.trim()).filter(Boolean).map(s => `"${s}"`).join(', ');
    };

    const formatDict = (kvps: KVP[], indent: string) => {
      const valid = kvps.filter(k => k.key.trim());
      if (valid.length === 0) return '';
      return valid.map(k => `${indent}${k.key}: "${k.value}"`).join('\n') + '\n';
    };

    let yaml = `apiVersion: rbac.authorization.k8s.io/v1\nkind: ${policyType}\nmetadata:\n  name: ${name || 'unnamed'}\n`;
    
    if (policyType === 'Role' && namespace) {
      yaml += `  namespace: ${namespace}\n`;
    }

    const labelsYaml = formatDict(labels, '    ');
    if (labelsYaml) yaml += `  labels:\n${labelsYaml}`;

    const annotationsYaml = formatDict(annotations, '    ');
    if (annotationsYaml) yaml += `  annotations:\n${annotationsYaml}`;

    if (rules.length > 0) {
      yaml += `rules:\n`;
      rules.forEach(rule => {
        yaml += `- apiGroups: [${formatArray(rule.apiGroups)}]\n`;
        yaml += `  resources: [${formatArray(rule.resources)}]\n`;
        yaml += `  verbs: [${rule.verbs.map(v => `"${v}"`).join(', ')}]\n`;
      });
    } else {
      yaml += `rules: []\n`;
    }

    yaml += `---\n`;
    yaml += `apiVersion: rbac.authorization.k8s.io/v1\nkind: ${policyType}Binding\nmetadata:\n  name: ${bindingName || 'unnamed-binding'}\n`;
    
    if (policyType === 'Role' && namespace) {
      yaml += `  namespace: ${namespace}\n`;
    }

    if (labelsYaml) yaml += `  labels:\n${labelsYaml}`;
    if (annotationsYaml) yaml += `  annotations:\n${annotationsYaml}`;

    if (subjects.length > 0) {
      yaml += `subjects:\n`;
      subjects.forEach(sub => {
        yaml += `- kind: ${sub.kind}\n`;
        yaml += `  name: ${sub.name || 'unnamed'}\n`;
        if (sub.kind === 'ServiceAccount') {
          yaml += `  namespace: ${sub.namespace || 'default'}\n`;
        } else {
          yaml += `  apiGroup: rbac.authorization.k8s.io\n`;
        }
      });
    } else {
      yaml += `subjects: []\n`;
    }

    yaml += `roleRef:\n  kind: ${policyType}\n  name: ${name || 'unnamed'}\n  apiGroup: rbac.authorization.k8s.io\n`;

    return yaml;
  }, [policyType, name, namespace, labels, annotations, rules, subjects, bindingName]);

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <SEO 
        title="Kubernetes RBAC Generator" 
        description="Generate Kubernetes Role-Based Access Control (RBAC) manifests including Roles, ClusterRoles, and Bindings."
        keywords="kubernetes rbac, rbac generator, k8s rbac, rolebinding, clusterrole"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0f1c]/80 backdrop-blur-md z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium group"
        >
          <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-zinc-100">RBAC Generator</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Left Column: Builder */}
        <div className="flex flex-col gap-6">
          
          {/* Policy Type & Basic Info */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Policy Configuration
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Policy Type</label>
                <div className="flex bg-[#030712] p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setPolicyType('Role')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${policyType === 'Role' ? 'bg-[#1e293b] text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Role
                  </button>
                  <button
                    onClick={() => setPolicyType('ClusterRole')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${policyType === 'ClusterRole' ? 'bg-[#1e293b] text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    ClusterRole
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Role Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. pod-reader"
                  className="w-full bg-[#030712] border border-white/10 text-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                />
              </div>

              {policyType === 'Role' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Namespace</label>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="e.g. default"
                    className="w-full bg-[#030712] border border-white/10 text-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Binding Name</label>
                <input
                  type="text"
                  value={bindingName}
                  onChange={(e) => setBindingName(e.target.value)}
                  placeholder="e.g. read-pods-binding"
                  className="w-full bg-[#030712] border border-white/10 text-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Labels</label>
                {renderKvpEditor(labels, setLabels, 'Key (e.g. app)', 'Value (e.g. web)')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Annotations</label>
                {renderKvpEditor(annotations, setAnnotations, 'Key', 'Value')}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Rules
              </h2>
              <button
                onClick={addRule}
                className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors border border-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>

            <div className="space-y-6">
              {rules.map((rule, index) => (
                <div key={rule.id} className="p-4 rounded-xl border border-white/10 bg-[#030712] relative group">
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Rule {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">API Groups (comma separated)</label>
                      <input
                        type="text"
                        value={rule.apiGroups}
                        onChange={(e) => updateRule(rule.id, 'apiGroups', e.target.value)}
                        placeholder='e.g. "", "apps", "extensions"'
                        className="w-full bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Resources (comma separated)</label>
                      <input
                        type="text"
                        value={rule.resources}
                        onChange={(e) => updateRule(rule.id, 'resources', e.target.value)}
                        placeholder='e.g. "pods", "deployments"'
                        className="w-full bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Verbs</label>
                    <div className="flex flex-wrap gap-2">
                      {VERBS.map(verb => (
                        <button
                          key={verb}
                          onClick={() => toggleVerb(rule.id, verb)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                            rule.verbs.includes(verb)
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-[#0a0f1c] border-white/10 text-zinc-400 hover:border-indigo-500/30 hover:bg-indigo-500/10'
                          }`}
                        >
                          {verb}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-white/10 rounded-xl">
                  No rules defined. Click "Add Rule" to grant permissions.
                </div>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-sky-400" />
                Subjects
              </h2>
              <button
                onClick={addSubject}
                className="flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition-colors border border-sky-500/20"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={subject.id} className="p-4 rounded-xl border border-white/10 bg-[#030712] relative group flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <button
                    onClick={() => removeSubject(subject.id)}
                    className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 sm:hidden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Kind</label>
                    <select
                      value={subject.kind}
                      onChange={(e) => updateSubject(subject.id, 'kind', e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-medium"
                    >
                      <option value="User">User</option>
                      <option value="Group">Group</option>
                      <option value="ServiceAccount">ServiceAccount</option>
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                      placeholder="e.g. jane.doe"
                      className="w-full bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Namespace</label>
                    <input
                      type="text"
                      value={subject.namespace}
                      onChange={(e) => updateSubject(subject.id, 'namespace', e.target.value)}
                      placeholder="e.g. default"
                      disabled={subject.kind !== 'ServiceAccount' && policyType === 'ClusterRole'}
                      className="w-full bg-[#0a0f1c] border border-white/10 text-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono disabled:bg-white/5 disabled:text-zinc-500"
                    />
                  </div>

                  <button
                    onClick={() => removeSubject(subject.id)}
                    className="hidden sm:block p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {subjects.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm border-2 border-dashed border-white/10 rounded-xl">
                  No subjects defined. Click "Add Subject" to bind the role.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#030712] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-white/10 sticky top-24">
            <div className="bg-[#0a0f1c] px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Generated YAML</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[calc(100vh-12rem)] overflow-y-auto">
              <pre className="font-mono text-sm text-emerald-400 leading-relaxed">
                {generatedYaml}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
