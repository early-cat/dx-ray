import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Network, Download, Code2, Play, AlertCircle, Maximize2, Minimize2, FileText, Info, ArrowRight, ArrowDown } from 'lucide-react';
import { instance } from '@viz-js/viz';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { SEO } from '../components/SEO';

const DEFAULT_SIMPLE = `[ User ] -> { label: login; } [ Auth Service ]
[ Auth Service ] -> { label: success; } [ Dashboard ]
[ Auth Service ] -> { label: fail; } [ Login Page ]

( Backend ) {
  [ Auth Service ]
  [ Database ]
}

[ Auth Service ] <-> [ Database ]
[ Dashboard ] -- [ Analytics ]`;

const DEFAULT_DOT = `digraph G {
  node [shape=box, style=rounded, fontname="Helvetica"];
  edge [fontname="Helvetica"];

  "User" -> "Auth Service" [label="login"];
  "Auth Service" -> "Dashboard" [label="success"];
  "Auth Service" -> "Login Page" [label="fail"];

  subgraph "cluster_Backend" {
    label="Backend";
    style=filled;
    color="#f8fafc";
    pencolor="#cbd5e1";
    fontname="Helvetica-Bold";
    margin=20;
    "Auth Service";
    "Database";
  }

  "Auth Service" -> "Database" [dir="both"];
  "Dashboard" -> "Analytics" [dir="none"];
}`;

const SYNTAX_GUIDE = [
  { syntax: '[ Node ]', desc: 'Create a node', example: '[ Server ]' },
  { syntax: '->', desc: 'Directed edge', example: '[ A ] -> [ B ]' },
  { syntax: '<->', desc: 'Bidirectional edge', example: '[ A ] <-> [ B ]' },
  { syntax: '--', desc: 'Undirected edge', example: '[ A ] -- [ B ]' },
  { syntax: '{ label: text; }', desc: 'Edge label', example: '-> { label: yes; } [ B ]' },
  { syntax: '( Group ) { ... }', desc: 'Node group', example: '( Frontend ) {\n  [ Web ]\n}' },
];

function parseSimpleToDOT(input: string, direction: 'TB' | 'LR' = 'TB'): string {
  let dot = 'digraph G {\n';
  dot += `  rankdir="${direction}";\n`;
  dot += '  node [shape=box, style=rounded, fontname="Helvetica"];\n';
  dot += '  edge [fontname="Helvetica"];\n\n';

  const lines = input.split('\n');
  let inGroup = false;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for group start
    const groupMatch = line.match(/^\(\s*([^)]+)\s*\)\s*\{?$/);
    if (groupMatch) {
      const groupName = groupMatch[1].trim();
      dot += `  subgraph "cluster_${groupName.replace(/[^a-zA-Z0-9_]/g, '_')}" {\n`;
      dot += `    label="${groupName}";\n`;
      dot += `    style=filled;\n`;
      dot += `    color="#f8fafc";\n`;
      dot += `    pencolor="#cbd5e1";\n`;
      dot += `    fontname="Helvetica-Bold";\n`;
      dot += `    margin=20;\n`;
      inGroup = true;
      continue;
    }
    
    // Check for group end
    if (line === '}') {
      if (inGroup) {
        dot += `  }\n`;
        inGroup = false;
      }
      continue;
    }
    
    // Tokenize
    const tokenRegex = /(\[[^\]]+\])|(->|<->|--)|(\{\s*label:\s*[^;]+;\s*\})/g;
    const tokens = [...line.matchAll(tokenRegex)].map(m => m[0]);
    
    if (tokens.length === 0) {
      continue;
    }
    
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.startsWith('[')) {
        const node1 = t.slice(1, -1).trim();
        
        if (i + 1 < tokens.length && (tokens[i+1] === '->' || tokens[i+1] === '<->' || tokens[i+1] === '--')) {
          const edge = tokens[i + 1];
          let label = '';
          let nextNodeIdx = i + 2;
          
          if (nextNodeIdx < tokens.length && tokens[nextNodeIdx].startsWith('{')) {
            const labelMatch = tokens[nextNodeIdx].match(/\{\s*label:\s*([^;]+);\s*\}/);
            if (labelMatch) {
              label = labelMatch[1].trim();
            }
            nextNodeIdx++;
          }
          
          if (nextNodeIdx < tokens.length && tokens[nextNodeIdx].startsWith('[')) {
            const node2 = tokens[nextNodeIdx].slice(1, -1).trim();
            
            let edgeStr = '->';
            let edgeAttrs = [];
            
            if (edge === '<->') {
              edgeAttrs.push('dir="both"');
            } else if (edge === '--') {
              edgeAttrs.push('dir="none"');
            }
            
            if (label) {
              edgeAttrs.push(`label="${label}"`);
            }
            
            const attrStr = edgeAttrs.length > 0 ? ` [${edgeAttrs.join(', ')}]` : '';
            
            dot += `  "${node1}" ${edgeStr} "${node2}"${attrStr};\n`;
            
            i = nextNodeIdx;
            continue;
          }
        }
        
        if (tokens.length === 1) {
          dot += `  "${node1}";\n`;
        }
      }
      i++;
    }
  }
  
  if (inGroup) {
    dot += `  }\n`;
  }
  
  dot += '}\n';
  return dot;
}

export const GraphVizGenerator = () => {
  const [mode, setMode] = useState<'simple' | 'dot'>('simple');
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
  const [simpleInput, setSimpleInput] = useState(DEFAULT_SIMPLE);
  const [dotInput, setDotInput] = useState(DEFAULT_DOT);
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [vizInstance, setVizInstance] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    instance().then(viz => {
      if (mounted) {
        setVizInstance(viz);
      }
    }).catch(err => {
      console.error("Failed to initialize Viz.js", err);
      if (mounted) setError("Failed to initialize rendering engine.");
    });
    return () => { mounted = false; };
  }, []);

  const renderGraph = () => {
    if (!vizInstance) return;
    
    const inputToRender = mode === 'simple' ? simpleInput : dotInput;
    if (!inputToRender.trim()) return;
    
    setIsRendering(true);
    setError(null);
    
    try {
      const dotToRender = mode === 'simple' ? parseSimpleToDOT(simpleInput, direction) : dotInput;
      const svgString = vizInstance.renderString(dotToRender, { format: 'svg' });
      setSvgOutput(svgString);
    } catch (err: any) {
      console.error("Render error:", err);
      setError(err.message || "Syntax error in graph notation.");
    } finally {
      setIsRendering(false);
    }
  };

  // Render on initial load once vizInstance is ready
  useEffect(() => {
    if (vizInstance && !svgOutput && !error) {
      renderGraph();
    }
  }, [vizInstance]);

  // Re-render when direction changes in simple mode
  useEffect(() => {
    if (vizInstance && mode === 'simple' && simpleInput.trim()) {
      renderGraph();
    }
  }, [direction]);

  const handleModeSwitch = (newMode: 'simple' | 'dot') => {
    if (newMode === 'dot' && mode === 'simple') {
      // Generate DOT from simple and populate the DOT editor
      setDotInput(parseSimpleToDOT(simpleInput, direction));
    }
    setMode(newMode);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    if (!svgOutput) return;
    downloadFile(svgOutput, 'graph.svg', 'image/svg+xml');
  };

  const exportPNG = () => {
    if (!svgOutput) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Add some padding
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'graph.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportPDF = async () => {
    if (!svgOutput) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svgOutput;
    const svgElement = tempDiv.querySelector('svg');
    
    if (!svgElement) return;

    const width = parseFloat(svgElement.getAttribute('width') || '0');
    const height = parseFloat(svgElement.getAttribute('height') || '0');
    
    if (!width || !height) {
      alert("Could not determine SVG dimensions for PDF export.");
      return;
    }

    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [width + 40, height + 40]
    });

    try {
      await pdf.svg(svgElement, {
        x: 20,
        y: 20,
        width: width,
        height: height
      });
      pdf.save('graph.pdf');
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#030712] text-white font-sans selection:bg-rose-500/30 relative overflow-hidden">
      <SEO 
        title="GraphViz DOT Generator" 
        description="Create and render GraphViz DOT diagrams using simple notation or raw DOT syntax. Export to SVG, PNG, and PDF."
        keywords="graphviz generator, dot language, graph visualization, diagram generator, viz.js"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#030712]/80 backdrop-blur-md z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </Link>
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-rose-500" />
          <span className="font-semibold text-zinc-100">GraphViz DOT Generator</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 flex-1 min-h-0">
        
        {/* Left Column: Editor */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col h-full">
            
            {/* Editor Header & Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-[#030712] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => handleModeSwitch('simple')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${mode === 'simple' ? 'bg-white/10 text-rose-400 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                  <FileText className="w-4 h-4" /> Simple Notation
                </button>
                <button
                  onClick={() => handleModeSwitch('dot')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${mode === 'dot' ? 'bg-white/10 text-rose-400 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Code2 className="w-4 h-4" /> Raw DOT
                </button>
              </div>

              <div className="flex items-center gap-2">
                {mode === 'simple' && (
                  <>
                    <div className="flex bg-[#030712] p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setDirection('TB')}
                        className={`p-1.5 rounded-lg transition-colors ${direction === 'TB' ? 'bg-white/10 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Top to Bottom"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDirection('LR')}
                        className={`p-1.5 rounded-lg transition-colors ${direction === 'LR' ? 'bg-white/10 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Left to Right"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowSyntax(!showSyntax)}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Toggle Syntax Guide"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={renderGraph}
                  disabled={isRendering || !vizInstance}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-rose-500/20"
                >
                  {isRendering ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Render
                </button>
              </div>
            </div>

            {/* Syntax Guide (Collapsible) */}
            {mode === 'simple' && showSyntax && (
              <div className="mb-4 p-4 bg-[#030712] border border-white/10 rounded-xl text-sm">
                <h3 className="font-semibold text-zinc-100 mb-2">Simple Syntax Guide</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {SYNTAX_GUIDE.map((item, idx) => (
                    <div key={idx} className="flex flex-col py-1 border-b border-white/10 last:border-0 sm:last:border-b sm:nth-last-2:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <code className="text-rose-400 font-mono text-xs bg-rose-500/10 px-1.5 py-0.5 rounded">{item.syntax}</code>
                        <span className="text-zinc-500 text-xs">{item.desc}</span>
                      </div>
                      <code className="text-zinc-300 font-mono text-xs whitespace-pre">{item.example}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Textarea */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-[#030712] group">
              <textarea
                value={mode === 'simple' ? simpleInput : dotInput}
                onChange={(e) => mode === 'simple' ? setSimpleInput(e.target.value) : setDotInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    renderGraph();
                  }
                }}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-rose-100 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-rose-500/50"
                spellCheck={false}
                placeholder={mode === 'simple' ? "Enter simple notation here..." : "Enter raw DOT format here..."}
              />
              <div className="absolute bottom-4 right-4 text-xs font-medium text-zinc-500 bg-[#030712]/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Press Cmd/Ctrl + Enter to render
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col gap-4 h-full">
          <div 
            ref={containerRef}
            className={`bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-[100] rounded-none' : 'h-full'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-400" />
                Preview
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#030712] rounded-lg p-1 border border-white/10">
                  <button
                    onClick={exportSVG}
                    disabled={!svgOutput}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Download className="w-3.5 h-3.5" /> SVG
                  </button>
                  <button
                    onClick={exportPNG}
                    disabled={!svgOutput}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={!svgOutput}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex-1 relative rounded-xl border border-white/10 bg-[#030712] overflow-hidden flex items-center justify-center">
              {/* Background pattern for preview area */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzZjNmNDYiLz48L3N2Zz4=')] opacity-30 pointer-events-none"></div>
              
              {error ? (
                <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-2">Rendering Error</h3>
                  <p className="text-xs text-zinc-400 font-mono bg-[#0a0f1c] p-3 rounded-lg border border-white/10 w-full overflow-x-auto text-left">
                    {error}
                  </p>
                </div>
              ) : svgOutput ? (
                <div 
                  className="relative z-10 w-full h-full overflow-auto p-4 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto bg-white rounded-lg m-4"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <div className="relative z-10 text-zinc-500 text-sm flex flex-col items-center gap-3">
                  {!vizInstance ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-700 border-t-rose-500 rounded-full animate-spin" />
                      Loading rendering engine...
                    </>
                  ) : (
                    <>
                      <Network className="w-8 h-8 opacity-20" />
                      Click "Render" to preview
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
