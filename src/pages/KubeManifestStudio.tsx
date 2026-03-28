import React, { useState, useMemo } from 'react';
import { ResourceKind, K8sResource } from '../types';
import { generateDefaultResource } from '../utils/k8s';
import yaml from 'js-yaml';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Plus, Trash2, FileCode2, X, Menu, ArrowLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { ResourceForm } from '../components/ResourceForm';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const KubeManifestStudio = () => {
  const [resources, setResources] = useState<K8sResource[]>([generateDefaultResource('Deployment')]);
  const [activeResourceId, setActiveResourceId] = useState<string>(resources[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'yaml' | 'json'>('yaml');

  const activeResource = useMemo(() => resources.find(r => r.id === activeResourceId) || resources[0], [resources, activeResourceId]);

  const handleResourceChange = (updatedResource: K8sResource) => {
    setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
  };

  const handleAddResource = (kind: ResourceKind) => {
    const newResource = generateDefaultResource(kind);
    setResources([newResource]); // Replaces existing resources to clear the section
    setActiveResourceId(newResource.id);
  };

  const handleRemoveResource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (resources.length === 1) return;
    const newResources = resources.filter(r => r.id !== id);
    setResources(newResources);
    if (activeResourceId === id) {
      setActiveResourceId(newResources[0].id);
    }
  };

  const generatedOutput = useMemo(() => {
    const cleanResources = resources.map(r => {
      const { id, ...rest } = r;
      return rest;
    });

    if (outputFormat === 'yaml') {
      return cleanResources.map(r => yaml.dump(r, { noRefs: true, lineWidth: -1 })).join('\n---\n');
    } else {
      if (cleanResources.length === 1) {
        return JSON.stringify(cleanResources[0], null, 2);
      } else {
        return JSON.stringify({
          apiVersion: "v1",
          kind: "List",
          items: cleanResources
        }, null, 2);
      }
    }
  }, [resources, outputFormat]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOutput);
  };

  const downloadFile = () => {
    const blob = new Blob([generatedOutput], { type: outputFormat === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k8s-manifest.${outputFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#030712] text-zinc-50 font-sans overflow-hidden">
      <SEO 
        title="Kubernetes Manifest Studio" 
        description="Generate and manage Kubernetes YAML manifests with ease. Support for Deployments, Services, ConfigMaps, and more."
        keywords="kubernetes, k8s, manifest generator, yaml generator, devops"
      />
      {/* Top Navigation Bar */}
      <div className="bg-[#0a0f1c] border-b border-white/10 text-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            Kubernetes Manifest Studio
          </h1>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
        
        {/* Sidebar Container */}
        <div className={`absolute inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onSelectResource={(kind) => { handleAddResource(kind); setIsSidebarOpen(false); }} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Bar for Multi-Doc Tabs */}
          <div className="bg-[#0a0f1c] border-b border-white/10 flex items-center px-2 sm:px-4 py-2 overflow-x-auto gap-2 shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:bg-white/5 rounded-md shrink-0 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {resources.map(r => (
              <div 
                key={r.id}
                onClick={() => setActiveResourceId(r.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-colors whitespace-nowrap ${
                  activeResourceId === r.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                {r.metadata.name} ({r.kind})
                {resources.length > 1 && (
                  <button 
                    onClick={(e) => handleRemoveResource(r.id, e)}
                    className="p-0.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const newResource = generateDefaultResource('Pod');
                setResources(prev => [...prev, newResource]);
                setActiveResourceId(newResource.id);
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors whitespace-nowrap ml-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Doc
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Left Pane: Form */}
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full overflow-y-auto p-4 sm:p-6 bg-[#030712] border-b lg:border-b-0 lg:border-r border-white/10 relative custom-scrollbar">
              <ResourceForm resource={activeResource} onChange={handleResourceChange} />
            </div>

            {/* Right Pane: YAML Preview */}
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-[#1e1e1e] relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3d3d3d] gap-3 sm:gap-0 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-slate-200 font-medium text-sm flex items-center gap-2">
                    <FileCode2 className="w-4 h-4" />
                    Generated Code
                  </h3>
                  <div className="flex bg-[#1e1e1e] rounded p-0.5">
                    <button
                      onClick={() => setOutputFormat('yaml')}
                      className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${outputFormat === 'yaml' ? 'bg-[#3d3d3d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      YAML
                    </button>
                    <button
                      onClick={() => setOutputFormat('json')}
                      className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${outputFormat === 'json' ? 'bg-[#3d3d3d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      JSON
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-slate-200 text-xs font-medium rounded transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  <button onClick={downloadFile} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-slate-200 text-xs font-medium rounded transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto relative">
                <SyntaxHighlighter
                  language={outputFormat}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '13px' }}
                  wrapLines={true}
                >
                  {generatedOutput}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
