import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Code, BookOpen, Clock, Hash, Check, Copy, Terminal, AlertCircle, List, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

const PATTERN_LIBRARY = [
  {
    category: 'Common',
    patterns: [
      { name: 'Email Address', regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', test: 'Contact us at support@example.com or sales@example.com.' },
      { name: 'URL', regex: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', test: 'Visit https://www.example.com or http://test.org/path?q=1' },
      { name: 'Phone Number (US)', regex: '(?:\\+?1[-.]?)?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}', test: 'Call 1-800-555-1234 or (555) 123-4567.' },
      { name: 'Strong Password', regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', test: 'P@ssw0rd123!' },
      { name: 'IPv4 Address', regex: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b', test: 'Server IP is 192.168.1.1 and 10.0.0.255' },
    ]
  },
  {
    category: 'Date & Time',
    patterns: [
      { name: 'Date (YYYY-MM-DD)', regex: '\\b\\d{4}-\\d{2}-\\d{2}\\b', test: 'Today is 2026-03-22.' },
      { name: 'Time (HH:MM or HH:MM:SS)', regex: '\\b([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?\\b', test: 'Meeting at 14:30 or 09:15:00.' },
    ]
  },
  {
    category: 'Text Processing',
    patterns: [
      { name: 'Capitalized Words', regex: '\\b[A-Z][a-z]+\\b', test: 'John Doe lives in New York.' },
      { name: 'Hex Color Code', regex: '#[a-fA-F0-9]{6}\\b', test: 'Colors: #FF5733, #000000, #ffffff.' },
      { name: 'Numbers (Int/Float)', regex: '\\d+\\.?\\d*', test: 'Prices: 10, 99.99, 0.50.' },
    ]
  },
  {
    category: 'Advanced',
    patterns: [
      { name: 'Dollar Amount (Lookbehind)', regex: '(?<=\\$)\\d+(?:\\.\\d{2})?', test: 'Cost is $100.50 or $50.' },
      { name: 'Words (Not "test")', regex: '\\b(?!test\\b)\\w+', test: 'This is a test string testing things.' },
    ]
  }
];

const CHEAT_SHEET = [
  { char: '.', desc: 'Any character' },
  { char: '\\d', desc: 'Digit (0-9)' },
  { char: '\\w', desc: 'Word char (a-zA-Z0-9_)' },
  { char: '\\s', desc: 'Whitespace' },
  { char: '^', desc: 'Start of string' },
  { char: '$', desc: 'End of string' },
  { char: '*', desc: '0 or more' },
  { char: '+', desc: '1 or more' },
  { char: '?', desc: '0 or 1' },
  { char: '{n}', desc: 'Exactly n times' },
  { char: '[abc]', desc: 'Character set' },
  { char: '(x)', desc: 'Capture group' },
];

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'PHP', 'Ruby'];

const FLAG_DETAILS: Record<string, { name: string; desc: string }> = {
  g: { name: 'Global', desc: "Don't return after first match" },
  i: { name: 'Case Insensitive', desc: 'Match upper and lower case' },
  m: { name: 'Multiline', desc: '^ and $ match start/end of line' },
  s: { name: 'Dotall', desc: 'Dot (.) matches newline' },
  u: { name: 'Unicode', desc: 'Match with full unicode' },
};

export const RegexTester = () => {
  const [pattern, setPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false, u: false });
  const [testString, setTestString] = useState('Contact us at support@example.com or sales@example.com.');
  
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [execTime, setExecTime] = useState(0);
  const [error, setError] = useState('');
  
  const [activeLang, setActiveLang] = useState('JavaScript');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    try {
      setError('');
      const flagStr = Object.entries(flags).filter(([_, v]) => v).map(([k]) => k).join('');
      const re = new RegExp(pattern, flagStr);
      
      const start = performance.now();
      const newMatches: MatchResult[] = [];
      
      if (pattern) {
        if (re.global) {
          let m;
          let lastIndex = -1;
          while ((m = re.exec(testString)) !== null) {
            if (m.index === re.lastIndex) {
              re.lastIndex++;
            }
            newMatches.push({
              match: m[0],
              index: m.index,
              groups: m.slice(1)
            });
            if (lastIndex === re.lastIndex) break;
            lastIndex = re.lastIndex;
          }
        } else {
          const m = re.exec(testString);
          if (m) {
            newMatches.push({
              match: m[0],
              index: m.index,
              groups: m.slice(1)
            });
          }
        }
      }
      
      const end = performance.now();
      setMatches(newMatches);
      setExecTime(end - start);
    } catch (err: any) {
      setError(err.message);
      setMatches([]);
      setExecTime(0);
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flag: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const loadPattern = (regex: string, test: string) => {
    setPattern(regex);
    setTestString(test);
    setFlags({ g: true, i: true, m: false, s: false, u: false });
  };

  const renderHighlightedText = () => {
    if (error || !pattern || matches.length === 0) return testString;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, i) => {
      if (m.index > lastIndex) {
        elements.push(<span key={`text-${i}`}>{testString.substring(lastIndex, m.index)}</span>);
      }
      
      if (m.match.length > 0) {
        elements.push(
          <mark key={`match-${i}`} className="bg-emerald-200/80 text-emerald-900 rounded px-0.5 py-0.5 font-medium shadow-sm">
            {m.match}
          </mark>
        );
        lastIndex = m.index + m.match.length;
      } else {
        elements.push(
          <mark key={`match-${i}`} className="bg-emerald-400 w-1 inline-block h-4 align-middle mx-0.5 rounded-sm shadow-sm" title="Zero-width match">
          </mark>
        );
      }
    });

    if (lastIndex < testString.length) {
      elements.push(<span key="text-end">{testString.substring(lastIndex)}</span>);
    }

    return elements;
  };

  const generateCode = () => {
    const flagStr = Object.entries(flags).filter(([_, v]) => v).map(([k]) => k).join('');
    
    switch (activeLang) {
      case 'JavaScript':
        return `const regex = /${pattern.replace(/\//g, '\\/')}/${flagStr};\nconst str = \`${testString.replace(/`/g, '\\`')}\`;\nlet m;\n\nwhile ((m = regex.exec(str)) !== null) {\n    if (m.index === regex.lastIndex) {\n        regex.lastIndex++;\n    }\n    console.log(\`Found match, group 0: \${m[0]}\`);\n}`;
      case 'Python':
        return `import re\n\nregex = r"${pattern.replace(/"/g, '\\"')}"\ntest_str = "${testString.replace(/"/g, '\\"')}"\n\nmatches = re.finditer(regex, test_str, re.MULTILINE)\n\nfor matchNum, match in enumerate(matches, start=1):\n    print ("Match {matchNum} was found at {start}-{end}: {match}".format(matchNum = matchNum, start = match.start(), end = match.end(), match = match.group()))`;
      case 'Java':
        return `import java.util.regex.Matcher;\nimport java.util.regex.Pattern;\n\npublic class RegexTest {\n    public static void main(String[] args) {\n        final String regex = "${pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";\n        final String string = "${testString.replace(/"/g, '\\"')}";\n\n        final Pattern pattern = Pattern.compile(regex, Pattern.MULTILINE);\n        final Matcher matcher = pattern.matcher(string);\n\n        while (matcher.find()) {\n            System.out.println("Full match: " + matcher.group(0));\n            for (int i = 1; i <= matcher.groupCount(); i++) {\n                System.out.println("Group " + i + ": " + matcher.group(i));\n            }\n        }\n    }\n}`;
      case 'PHP':
        return `<?php\n$re = '/${pattern.replace(/\//g, '\\/')}/${flagStr}';\n$str = '${testString.replace(/'/g, "\\\\'")}';\n\npreg_match_all($re, $str, $matches, PREG_SET_ORDER, 0);\n\nvar_dump($matches);\n?>`;
      case 'Ruby':
        return `re = /${pattern.replace(/\//g, '\\/')}/${flagStr}\nstr = '${testString.replace(/'/g, "\\'")}'\n\nstr.scan(re) do |match|\n    puts match.to_s\nend`;
      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalGroups = matches.reduce((acc, m) => acc + m.groups.filter(g => g !== undefined).length, 0);

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-indigo-500/30">
      <SEO 
        title="Advanced Regex Tester" 
        description="Test regular expressions in real-time, explore common patterns, and generate code snippets in multiple languages."
        keywords="regex tester, regular expression, regex generator, regex cheat sheet, javascript regex"
      />
      {/* Header */}
      <header className="px-6 py-4 bg-[#0a0f1c] border-b border-white/10 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Search className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white">Advanced Regex Tester</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Main Workspace */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* 1. Regex Input Area */}
          <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-[#030712] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                Regular Expression
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Input Field */}
                <div className="flex-1 flex items-center bg-slate-900 rounded-xl overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                  <div className="px-4 py-4 text-slate-500 font-mono text-lg select-none border-r border-slate-800 bg-slate-950">/</div>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full px-4 py-4 bg-transparent outline-none font-mono text-lg text-emerald-400 placeholder-slate-600"
                    placeholder="Enter regex pattern..."
                    spellCheck={false}
                  />
                  <div className="px-4 py-4 text-slate-500 font-mono text-lg select-none border-l border-slate-800 bg-slate-950">/</div>
                </div>
                
                {/* Flags */}
                <div className="flex flex-wrap gap-2 items-center bg-[#030712] p-2 rounded-xl border border-white/10">
                  {Object.entries(flags).map(([flag, isActive]) => (
                    <div key={flag} className="relative group">
                      <button
                        onClick={() => toggleFlag(flag as keyof typeof flags)}
                        className={`w-10 h-10 rounded-lg font-mono text-sm font-bold transition-all flex items-center justify-center ${
                          isActive 
                            ? 'bg-white/10 text-indigo-400 shadow-sm border border-white/20' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        {flag}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                        <div className="font-bold mb-0.5">{FLAG_DETAILS[flag].name}</div>
                        <div className="text-slate-300">{FLAG_DETAILS[flag].desc}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 px-4 py-3 rounded-lg border border-rose-500/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* 2. Test String & Live Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test String Input */}
            <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-[#030712] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">Test String</h3>
              </div>
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="w-full flex-1 min-h-[200px] p-4 bg-transparent outline-none font-mono text-sm text-zinc-300 resize-none"
                placeholder="Enter text to test against..."
                spellCheck={false}
              />
            </div>

            {/* Match Result Highlight */}
            <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-[#030712] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">Live Match</h3>
                <div className="flex gap-3 text-xs font-medium text-zinc-500">
                  <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {matches.length}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {execTime.toFixed(1)}ms</span>
                </div>
              </div>
              <div className="flex-1 p-4 bg-[#030712] font-mono text-sm whitespace-pre-wrap break-words leading-relaxed text-zinc-400 overflow-y-auto max-h-[400px] custom-scrollbar">
                {renderHighlightedText()}
              </div>
            </div>
          </div>

          {/* 3. Match Details List */}
          {matches.length > 0 && (
            <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-[#030712] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <List className="w-4 h-4 text-indigo-500" />
                  Match Details
                </h3>
                <span className="text-xs font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                  {totalGroups} Capture Groups
                </span>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar bg-[#030712]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matches.map((m, i) => (
                    <div key={i} className="bg-[#0a0f1c] border border-white/10 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Match {i + 1}</span>
                        <span className="text-xs font-mono text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">Index: {m.index}</span>
                      </div>
                      <div className="font-mono text-sm text-zinc-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg mb-3 break-all">
                        {m.match}
                      </div>
                      
                      {m.groups.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-zinc-500">Capture Groups:</div>
                          {m.groups.map((g, j) => (
                            <div key={j} className="flex items-start gap-2 font-mono text-xs">
                              <span className="text-indigo-400 mt-0.5">Group {j + 1}:</span>
                              <span className="text-zinc-400 break-all">{g !== undefined ? g : <span className="text-zinc-600 italic">undefined</span>}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Code Generation */}
          <div className="bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-slate-800 overflow-x-auto custom-scrollbar">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 border-r border-slate-700 pr-4">
                  <Code className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </div>
                <div className="flex gap-1">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        activeLang === lang 
                          ? 'bg-indigo-500/20 text-indigo-400' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-medium rounded-lg transition-colors ml-4"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-auto custom-scrollbar bg-[#1e1e1e] max-h-[300px]">
              <pre className="font-mono text-sm text-slate-300">
                <code>{generateCode()}</code>
              </pre>
            </div>
          </div>

        </div>

        {/* Right Column: Library & Cheat Sheet */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Pattern Library */}
          <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-[#030712]">
              <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Pattern Library
              </h2>
            </div>
            <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
              {PATTERN_LIBRARY.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{category.category}</h3>
                  <div className="space-y-2">
                    {category.patterns.map((pat, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => loadPattern(pat.regex, pat.test)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-[#030712] hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-zinc-300 group-hover:text-indigo-400 text-sm transition-colors">{pat.name}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="font-mono text-xs text-zinc-500 truncate">{pat.regex}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cheat Sheet */}
          <div className="bg-[#0a0f1c] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-[#030712]">
              <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-500" />
                Cheat Sheet
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-1">
                {CHEAT_SHEET.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <code className="px-2 py-1 bg-[#030712] border border-white/10 text-indigo-400 rounded text-xs font-mono font-bold">{item.char}</code>
                    <span className="text-sm text-zinc-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
