import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy, Check, Play, Globe, Plus, Trash2, AlertCircle, Code2, Download, History, FileJson, List, Braces, Wand2, Settings2, Trash } from 'lucide-react';
import { SEO } from '../components/SEO';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type AuthType = 'none' | 'basic' | 'bearer';
type BodyType = 'none' | 'raw' | 'form' | 'graphql';
type TargetLanguage = 'curl' | 'fetch' | 'axios' | 'python' | 'go' | 'ruby' | 'java' | 'php' | 'rust';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestHistoryItem {
  id: string;
  timestamp: number;
  method: HttpMethod;
  url: string;
}

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
}

const createKvp = (key = '', value = ''): KeyValuePair => ({
  id: Math.random().toString(36).substring(7),
  key,
  value,
  enabled: true,
});

export const CurlBuilder = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'options'>('params');
  const [copied, setCopied] = useState(false);

  // Request State
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([createKvp()]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    createKvp('Accept', 'application/json'),
    createKvp()
  ]);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [basicAuth, setBasicAuth] = useState({ username: '', password: '' });
  const [bearerToken, setBearerToken] = useState('');
  
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [rawBody, setRawBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [formData, setFormData] = useState<KeyValuePair[]>([createKvp()]);
  const [graphqlQuery, setGraphqlQuery] = useState('query {\n  user(id: 1) {\n    name\n    email\n  }\n}');
  const [graphqlVariables, setGraphqlVariables] = useState('{\n  \n}');

  const [options, setOptions] = useState({
    insecure: false,
    followRedirects: true,
    silent: false,
    verbose: false,
  });

  // Advanced State
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('curl');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [history, setHistory] = useState<RequestHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('curl_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>(() => {
    try {
      const saved = localStorage.getItem('curl_env');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showEnvModal, setShowEnvModal] = useState(false);

  // Response State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
    time: number;
    error?: string;
  } | null>(null);
  const [responseCopied, setResponseCopied] = useState(false);

  const interpolate = (text: string) => {
    if (!text) return text;
    let result = text;
    envVars.forEach(v => {
      if (v.key) {
        result = result.split(`{{${v.key}}}`).join(v.value);
      }
    });
    return result;
  };

  // Derived URL with Query Params
  const fullUrl = useMemo(() => {
    try {
      const interpolatedUrl = interpolate(url);
      const urlObj = new URL(interpolatedUrl || 'http://example.com');
      const activeParams = queryParams.filter(p => p.enabled && p.key);
      
      urlObj.search = '';
      activeParams.forEach(p => urlObj.searchParams.append(interpolate(p.key), interpolate(p.value)));
      
      return interpolatedUrl ? urlObj.toString() : '';
    } catch (e) {
      return interpolate(url);
    }
  }, [url, queryParams, envVars]);

  const activeHeaders = useMemo(() => headers.filter(h => h.enabled && h.key), [headers]);
  const activeForm = useMemo(() => formData.filter(f => f.enabled && f.key), [formData]);

  // Code Generators
  const generatedCode = useMemo(() => {
    if (!url) return '';

    const reqHeaders: Record<string, string> = {};
    activeHeaders.forEach(h => { reqHeaders[interpolate(h.key)] = interpolate(h.value); });

    if (authType === 'basic' && basicAuth.username) {
      reqHeaders['Authorization'] = 'Basic ' + btoa(`${interpolate(basicAuth.username)}:${interpolate(basicAuth.password)}`);
    } else if (authType === 'bearer' && bearerToken) {
      reqHeaders['Authorization'] = `Bearer ${interpolate(bearerToken)}`;
    }

    let finalBody: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      if (bodyType === 'raw' && rawBody) {
        finalBody = interpolate(rawBody);
      } else if (bodyType === 'graphql' && graphqlQuery) {
        try {
          finalBody = JSON.stringify({
            query: interpolate(graphqlQuery),
            variables: graphqlVariables ? JSON.parse(interpolate(graphqlVariables)) : {}
          });
          reqHeaders['Content-Type'] = 'application/json';
        } catch (e) {
          finalBody = JSON.stringify({ query: interpolate(graphqlQuery) });
        }
      } else if (bodyType === 'form' && activeForm.length > 0) {
        finalBody = activeForm.map(f => `${encodeURIComponent(interpolate(f.key))}=${encodeURIComponent(interpolate(f.value))}`).join('&');
        reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    switch (targetLanguage) {
      case 'curl': {
        const parts = ['curl'];
        if (options.insecure) parts.push('-k');
        if (options.followRedirects) parts.push('-L');
        if (options.silent) parts.push('-s');
        if (options.verbose) parts.push('-v');
        if (method !== 'GET') parts.push(`-X ${method}`);
        
        Object.entries(reqHeaders).forEach(([k, v]) => {
          parts.push(`-H "${k}: ${v}"`);
        });

        if (finalBody) {
          const escapedBody = finalBody.replace(/'/g, "'\\''");
          parts.push(`-d '${escapedBody}'`);
        }
        parts.push(`"${fullUrl}"`);
        return parts.join(' \\\n  ');
      }

      case 'fetch': {
        const opts: any = { method };
        if (Object.keys(reqHeaders).length > 0) opts.headers = reqHeaders;
        if (finalBody) opts.body = finalBody;
        
        return `fetch("${fullUrl}", ${JSON.stringify(opts, null, 2)})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
      }

      case 'axios': {
        const opts: any = { method, url: fullUrl };
        if (Object.keys(reqHeaders).length > 0) opts.headers = reqHeaders;
        if (finalBody) {
          try {
            opts.data = JSON.parse(finalBody);
          } catch {
            opts.data = finalBody;
          }
        }
        
        return `const axios = require('axios');\n\nconst config = ${JSON.stringify(opts, null, 2)};\n\naxios(config)\n  .then(function (response) {\n    console.log(response.data);\n  })\n  .catch(function (error) {\n    console.log(error);\n  });`;
      }

      case 'python': {
        let py = `import requests\n\nurl = "${fullUrl}"\n`;
        if (Object.keys(reqHeaders).length > 0) {
          py += `headers = ${JSON.stringify(reqHeaders, null, 2)}\n`;
        }
        if (finalBody) {
          py += `data = """${finalBody.replace(/"""/g, '\\"\\"\\"')}"""\n`;
        }
        py += `\nresponse = requests.request("${method}", url`;
        if (Object.keys(reqHeaders).length > 0) py += `, headers=headers`;
        if (finalBody) py += `, data=data`;
        py += `)\n\nprint(response.text)`;
        return py;
      }

      case 'go': {
        let go = `package main\n\nimport (\n\t"fmt"\n\t"strings"\n\t"net/http"\n\t"io/ioutil"\n)\n\nfunc main() {\n\turl := "${fullUrl}"\n\tmethod := "${method}"\n`;
        if (finalBody) {
          go += `\n\tpayload := strings.NewReader(\`${finalBody.replace(/`/g, '`+"`"+`')}\`)\n`;
          go += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, payload)\n`;
        } else {
          go += `\tclient := &http.Client {}\n\treq, err := http.NewRequest(method, url, nil)\n`;
        }
        go += `\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n`;
        Object.entries(reqHeaders).forEach(([k, v]) => {
          go += `\treq.Header.Add("${k}", "${v}")\n`;
        });
        go += `\n\tres, err := client.Do(req)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tdefer res.Body.Close()\n\n\tbody, err := ioutil.ReadAll(res.Body)\n\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n\tfmt.Println(string(body))\n}`;
        return go;
      }

      case 'ruby': {
        let ruby = `require 'uri'\nrequire 'net/http'\n\nurl = URI("${fullUrl}")\n\nhttp = Net::HTTP.new(url.host, url.port)\n`;
        if (fullUrl.startsWith('https')) {
          ruby += `http.use_ssl = true\n`;
        }
        ruby += `\nrequest = Net::HTTP::${method.charAt(0) + method.slice(1).toLowerCase()}.new(url)\n`;
        Object.entries(reqHeaders).forEach(([k, v]) => {
          ruby += `request["${k}"] = '${v}'\n`;
        });
        if (finalBody) {
          ruby += `request.body = '${finalBody.replace(/'/g, "\\'")}'\n`;
        }
        ruby += `\nresponse = http.request(request)\nputs response.read_body`;
        return ruby;
      }

      case 'php': {
        let php = `<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, array(\n  CURLOPT_URL => '${fullUrl}',\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_ENCODING => '',\n  CURLOPT_MAXREDIRS => 10,\n  CURLOPT_TIMEOUT => 0,\n  CURLOPT_FOLLOWLOCATION => true,\n  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n  CURLOPT_CUSTOMREQUEST => '${method}',\n`;
        if (finalBody) {
          php += `  CURLOPT_POSTFIELDS => '${finalBody.replace(/'/g, "\\'")}',\n`;
        }
        if (Object.keys(reqHeaders).length > 0) {
          php += `  CURLOPT_HTTPHEADER => array(\n`;
          Object.entries(reqHeaders).forEach(([k, v]) => {
            php += `    '${k}: ${v}',\n`;
          });
          php += `  ),\n`;
        }
        php += `));\n\n$response = curl_exec($curl);\n\ncurl_close($curl);\necho $response;\n`;
        return php;
      }

      case 'java': {
        let java = `import okhttp3.*;\nimport java.io.IOException;\n\npublic class Main {\n  public static void main(String[] args) throws IOException {\n    OkHttpClient client = new OkHttpClient().newBuilder().build();\n`;
        if (finalBody) {
          java += `    MediaType mediaType = MediaType.parse("${reqHeaders['Content-Type'] || 'text/plain'}");\n`;
          java += `    RequestBody body = RequestBody.create(mediaType, "${finalBody.replace(/"/g, '\\"')}");\n`;
        }
        java += `    Request request = new Request.Builder()\n      .url("${fullUrl}")\n`;
        if (method !== 'GET' && method !== 'HEAD') {
          java += finalBody ? `      .method("${method}", body)\n` : `      .method("${method}", RequestBody.create(null, new byte[0]))\n`;
        } else {
          java += `      .method("${method}", null)\n`;
        }
        Object.entries(reqHeaders).forEach(([k, v]) => {
          java += `      .addHeader("${k}", "${v}")\n`;
        });
        java += `      .build();\n    Response response = client.newCall(request).execute();\n    System.out.println(response.body().string());\n  }\n}`;
        return java;
      }

      case 'rust': {
        let rust = `extern crate reqwest;\n\nfn main() -> Result<(), Box<dyn std::error::Error>> {\n    let client = reqwest::blocking::Client::new();\n    let res = client.request(reqwest::Method::${method}, "${fullUrl}")\n`;
        Object.entries(reqHeaders).forEach(([k, v]) => {
          rust += `        .header("${k}", "${v}")\n`;
        });
        if (finalBody) {
          rust += `        .body(r#"${finalBody}"#)\n`;
        }
        rust += `        .send()?;\n    println!("{}", res.text()?);\n    Ok(())\n}`;
        return rust;
      }
    }
  }, [method, fullUrl, activeHeaders, authType, basicAuth, bearerToken, bodyType, rawBody, graphqlQuery, graphqlVariables, activeForm, options, targetLanguage, envVars]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      let cmd = importText.trim();
      if (!cmd.startsWith('curl')) {
        alert('Invalid cURL command. Must start with "curl".');
        return;
      }

      // Very basic parser for standard curl commands
      const cleanCmd = cmd.replace(/\\\n/g, ' ').replace(/\n/g, ' ');
      
      let newMethod: HttpMethod = 'GET';
      let newUrl = '';
      const newHeaders: KeyValuePair[] = [];
      let newBody = '';
      let newAuthType: AuthType = 'none';
      let newBearer = '';

      // Extract URL
      const urlMatch = cleanCmd.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
      if (urlMatch) newUrl = urlMatch[1];

      // Extract Method
      const methodMatch = cleanCmd.match(/(?:-X|--request)\s+([A-Z]+)/);
      if (methodMatch) newMethod = methodMatch[1] as HttpMethod;

      // Extract Headers
      const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g;
      let hMatch;
      while ((hMatch = headerRegex.exec(cleanCmd)) !== null) {
        const parts = hMatch[2].split(':');
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        
        if (key.toLowerCase() === 'authorization' && val.toLowerCase().startsWith('bearer ')) {
          newAuthType = 'bearer';
          newBearer = val.substring(7);
        } else {
          newHeaders.push(createKvp(key, val));
        }
      }

      // Extract Data
      const dataRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(['"])(.*?)\1/g;
      let dMatch;
      const dataParts = [];
      while ((dMatch = dataRegex.exec(cleanCmd)) !== null) {
        dataParts.push(dMatch[2]);
      }
      if (dataParts.length > 0) {
        newBody = dataParts.join('&');
        if (newMethod === 'GET') newMethod = 'POST';
        setBodyType('raw');
        setRawBody(newBody);
      }

      setUrl(newUrl);
      setMethod(newMethod);
      if (newHeaders.length > 0) {
        setHeaders([...newHeaders, createKvp()]);
      }
      if (newAuthType !== 'none') {
        setAuthType(newAuthType);
        setBearerToken(newBearer);
      }
      
      setShowImport(false);
      setImportText('');
    } catch (e) {
      alert('Failed to parse cURL command. It might be too complex or malformed.');
    }
  };

  const saveToHistory = (reqUrl: string, reqMethod: HttpMethod) => {
    const newItem: RequestHistoryItem = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: reqMethod,
      url: reqUrl
    };
    const newHistory = [newItem, ...history.filter(h => h.url !== reqUrl || h.method !== reqMethod)].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('curl_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('curl_history');
    setShowHistory(false);
  };

  const formatJsonBody = () => {
    try {
      const parsed = JSON.parse(rawBody);
      setRawBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert('Invalid JSON: Cannot format.');
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
    navigator.clipboard.writeText(text);
    setResponseCopied(true);
    setTimeout(() => setResponseCopied(false), 2000);
  };

  const handleDownloadResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveEnvVars = (newVars: EnvironmentVariable[]) => {
    setEnvVars(newVars);
    localStorage.setItem('curl_env', JSON.stringify(newVars));
  };

  const executeRequest = async () => {
    if (!url) return;
    setLoading(true);
    setResponse(null);
    setActiveResponseTab('body');
    const startTime = performance.now();

    try {
      const reqHeaders: Record<string, string> = {};
      activeHeaders.forEach(h => { reqHeaders[interpolate(h.key)] = interpolate(h.value); });

      if (authType === 'basic' && basicAuth.username) {
        reqHeaders['Authorization'] = 'Basic ' + btoa(`${interpolate(basicAuth.username)}:${interpolate(basicAuth.password)}`);
      } else if (authType === 'bearer' && bearerToken) {
        reqHeaders['Authorization'] = `Bearer ${interpolate(bearerToken)}`;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (method !== 'GET' && method !== 'HEAD') {
        if (bodyType === 'raw') {
          fetchOptions.body = interpolate(rawBody);
        } else if (bodyType === 'graphql') {
          fetchOptions.body = JSON.stringify({
            query: interpolate(graphqlQuery),
            variables: graphqlVariables ? JSON.parse(interpolate(graphqlVariables)) : {}
          });
          reqHeaders['Content-Type'] = 'application/json';
        } else if (bodyType === 'form') {
          const fd = new FormData();
          activeForm.forEach(f => { fd.append(interpolate(f.key), interpolate(f.value)); });
          fetchOptions.body = fd;
        }
      }

      const res = await fetch(fullUrl, fetchOptions);
      const time = Math.round(performance.now() - startTime);
      
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = await res.text();
        }
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        headers: resHeaders,
        time,
      });
      
      saveToHistory(fullUrl, method);
    } catch (error: any) {
      const time = Math.round(performance.now() - startTime);
      setResponse({
        status: 0,
        statusText: 'Error',
        data: null,
        headers: {},
        time,
        error: error.message || 'Failed to fetch. This might be due to CORS restrictions if the target server does not allow cross-origin requests from this domain.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderKvpEditor = (
    items: KeyValuePair[],
    setItems: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    placeholderKey: string,
    placeholderValue: string
  ) => {
    const updateItem = (id: string, field: keyof KeyValuePair, value: any) => {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));
    const addItem = () => setItems([...items, createKvp()]);

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => updateItem(item.id, 'enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-500 rounded border-white/20 bg-[#030712] focus:ring-indigo-500/50"
            />
            <input
              type="text"
              value={item.key}
              onChange={(e) => updateItem(item.id, 'key', e.target.value)}
              placeholder={placeholderKey}
              className="flex-1 bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(item.id, 'value', e.target.value)}
              placeholder={placeholderValue}
              className="flex-1 bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
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

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <SEO 
        title="cURL Command Builder" 
        description="Visually build, test, and export HTTP requests to cURL, Fetch, Axios, Python, Go, and more."
        keywords="curl builder, http client, api tester, postman alternative, curl generator"
      />
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sky-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0f1c]/80 backdrop-blur-md z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </Link>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowEnvModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Variables</span>
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showHistory ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button 
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Import cURL</span>
          </button>
        </div>
      </header>

      {/* Environment Variables Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#030712]">
              <h3 className="font-semibold text-zinc-300 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" /> Environment Variables
              </h3>
              <button onClick={() => setShowEnvModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-zinc-400 mb-4">
                Define variables to use across your requests. Use them with the <code className="bg-white/5 px-1 py-0.5 rounded text-indigo-400">{'{{variable_name}}'}</code> syntax in URLs, headers, or body.
              </p>
              
              <div className="space-y-3">
                {envVars.map((env) => (
                  <div key={env.id} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={env.key}
                      onChange={(e) => {
                        const newVars = envVars.map(v => v.id === env.id ? { ...v, key: e.target.value } : v);
                        saveEnvVars(newVars);
                      }}
                      placeholder="Variable Name"
                      className="flex-1 bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={env.value}
                      onChange={(e) => {
                        const newVars = envVars.map(v => v.id === env.id ? { ...v, value: e.target.value } : v);
                        saveEnvVars(newVars);
                      }}
                      placeholder="Value"
                      className="flex-1 bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        const newVars = envVars.filter(v => v.id !== env.id);
                        saveEnvVars(newVars);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newVars = [...envVars, { id: Math.random().toString(36).substring(7), key: '', value: '' }];
                    saveEnvVars(newVars);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-md hover:bg-indigo-500/10 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Variable
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 bg-[#030712] flex justify-end">
              <button onClick={() => setShowEnvModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#030712]">
              <h3 className="font-semibold text-zinc-300 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" /> Import cURL Command
              </h3>
              <button onClick={() => setShowImport(false)} className="text-zinc-500 hover:text-zinc-300">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{"key":"value"}'`}
                className="w-full h-48 bg-[#030712] border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleImport} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm">
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Left Column: Builder */}
        <div className="flex flex-col gap-6">
          
          {/* URL Bar */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 relative">
            {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0f1c] border border-white/10 rounded-xl shadow-xl z-50 max-h-80 flex flex-col overflow-hidden animate-in slide-in-from-top-2">
                <div className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/10 flex items-center justify-between bg-[#030712]">
                  <span>Recent Requests</span>
                  <button onClick={clearHistory} className="text-red-400 hover:text-red-300 flex items-center gap-1">
                    <Trash className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 py-2">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setMethod(h.method);
                        setUrl(h.url);
                        setShowHistory(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      <span className={`text-xs font-bold w-12 ${h.method === 'GET' ? 'text-emerald-400' : h.method === 'POST' ? 'text-blue-400' : h.method === 'DELETE' ? 'text-red-400' : 'text-amber-400'}`}>
                        {h.method}
                      </span>
                      <span className="text-sm text-zinc-300 truncate flex-1 font-mono">{h.url}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="bg-[#030712] border border-white/10 text-white font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none sm:w-32"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/users"
                className="w-full bg-[#030712] border border-white/10 text-white rounded-xl pl-4 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono text-sm"
              />
            </div>
            <button
              onClick={executeRequest}
              disabled={loading || !url}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" /> Send
                </>
              )}
            </button>
          </div>

          {/* Configuration Tabs */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex overflow-x-auto border-b border-white/10 bg-[#030712] hide-scrollbar">
              {(['params', 'headers', 'body', 'auth', 'options'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400 bg-[#0a0f1c]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {tab === 'params' ? 'Query Params' : tab}
                  {tab === 'headers' && activeHeaders.length > 0 && (
                    <span className="ml-2 bg-indigo-500/20 text-indigo-400 py-0.5 px-2 rounded-full text-xs">{activeHeaders.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Query Params Tab */}
              {activeTab === 'params' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">Query Parameters</h3>
                  {renderKvpEditor(queryParams, setQueryParams, 'Key (e.g. page)', 'Value (e.g. 1)')}
                </div>
              )}

              {/* Headers Tab */}
              {activeTab === 'headers' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">HTTP Headers</h3>
                  {renderKvpEditor(headers, setHeaders, 'Header (e.g. Content-Type)', 'Value (e.g. application/json)')}
                </div>
              )}

              {/* Body Tab */}
              {activeTab === 'body' && (
                <div className="animate-in fade-in duration-300 flex flex-col h-full">
                  <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={bodyType === 'none'} onChange={() => setBodyType('none')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">None</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={bodyType === 'raw'} onChange={() => setBodyType('raw')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">Raw</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={bodyType === 'graphql'} onChange={() => setBodyType('graphql')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">GraphQL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={bodyType === 'form'} onChange={() => setBodyType('form')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">Form Data</span>
                    </label>
                  </div>

                  {bodyType === 'none' && (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic border-2 border-dashed border-white/10 rounded-xl">
                      This request does not have a body.
                    </div>
                  )}

                  {bodyType === 'raw' && (
                    <div className="flex-1 flex flex-col relative group">
                      <button 
                        onClick={formatJsonBody}
                        className="absolute top-3 right-3 p-2 bg-[#0a0f1c] border border-white/10 rounded-lg shadow-sm text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                        title="Format JSON"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <textarea
                        value={rawBody}
                        onChange={(e) => setRawBody(e.target.value)}
                        className="flex-1 w-full bg-[#030712] border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none min-h-[300px]"
                        placeholder="Enter raw body content here..."
                      />
                    </div>
                  )}

                  {bodyType === 'graphql' && (
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex-1 flex flex-col">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Braces className="w-3 h-3"/> Query</label>
                        <textarea
                          value={graphqlQuery}
                          onChange={(e) => setGraphqlQuery(e.target.value)}
                          className="flex-1 w-full bg-[#030712] border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none min-h-[150px]"
                          placeholder="query { ... }"
                        />
                      </div>
                      <div className="h-1/3 flex flex-col">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><FileJson className="w-3 h-3"/> Variables (JSON)</label>
                        <textarea
                          value={graphqlVariables}
                          onChange={(e) => setGraphqlVariables(e.target.value)}
                          className="flex-1 w-full bg-[#030712] border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                          placeholder="{}"
                        />
                      </div>
                    </div>
                  )}

                  {bodyType === 'form' && (
                    <div className="flex-1">
                      {renderKvpEditor(formData, setFormData, 'Field Name', 'Value')}
                    </div>
                  )}
                </div>
              )}

              {/* Auth Tab */}
              {activeTab === 'auth' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={authType === 'none'} onChange={() => setAuthType('none')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">No Auth</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={authType === 'basic'} onChange={() => setAuthType('basic')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">Basic Auth</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={authType === 'bearer'} onChange={() => setAuthType('bearer')} className="text-indigo-500 focus:ring-indigo-500/50 bg-[#030712] border-white/20" />
                      <span className="text-sm font-medium text-zinc-300">Bearer Token</span>
                    </label>
                  </div>

                  {authType === 'basic' && (
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Username</label>
                        <input
                          type="text"
                          value={basicAuth.username}
                          onChange={(e) => setBasicAuth({ ...basicAuth, username: e.target.value })}
                          className="w-full bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Password</label>
                        <input
                          type="password"
                          value={basicAuth.password}
                          onChange={(e) => setBasicAuth({ ...basicAuth, password: e.target.value })}
                          className="w-full bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {authType === 'bearer' && (
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Token</label>
                      <input
                        type="text"
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="ey..."
                        className="w-full bg-[#030712] border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Options Tab */}
              {activeTab === 'options' && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">cURL Options</h3>
                  
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors max-w-md">
                    <input
                      type="checkbox"
                      checked={options.insecure}
                      onChange={(e) => setOptions({ ...options, insecure: e.target.checked })}
                      className="w-4 h-4 text-indigo-500 rounded border-white/20 bg-[#030712] focus:ring-indigo-500/50"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-200 block">Insecure (-k)</span>
                      <span className="text-xs text-zinc-500">Allow insecure server connections when using SSL</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors max-w-md">
                    <input
                      type="checkbox"
                      checked={options.followRedirects}
                      onChange={(e) => setOptions({ ...options, followRedirects: e.target.checked })}
                      className="w-4 h-4 text-indigo-500 rounded border-white/20 bg-[#030712] focus:ring-indigo-500/50"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-200 block">Follow Redirects (-L)</span>
                      <span className="text-xs text-zinc-500">Follow HTTP 3xx redirects</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors max-w-md">
                    <input
                      type="checkbox"
                      checked={options.silent}
                      onChange={(e) => setOptions({ ...options, silent: e.target.checked })}
                      className="w-4 h-4 text-indigo-500 rounded border-white/20 bg-[#030712] focus:ring-indigo-500/50"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-200 block">Silent (-s)</span>
                      <span className="text-xs text-zinc-500">Silent mode. Don't show progress meter or error messages</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors max-w-md">
                    <input
                      type="checkbox"
                      checked={options.verbose}
                      onChange={(e) => setOptions({ ...options, verbose: e.target.checked })}
                      className="w-4 h-4 text-indigo-500 rounded border-white/20 bg-[#030712] focus:ring-indigo-500/50"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-200 block">Verbose (-v)</span>
                      <span className="text-xs text-zinc-500">Make the operation more talkative</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output & Response */}
        <div className="flex flex-col gap-6">
          
          {/* Generated Code */}
          <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-800">
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-slate-400" />
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
                  className="bg-transparent text-xs font-semibold uppercase tracking-wider text-slate-300 outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <option value="curl" className="bg-slate-900">cURL</option>
                  <option value="fetch" className="bg-slate-900">JS Fetch</option>
                  <option value="axios" className="bg-slate-900">Axios</option>
                  <option value="python" className="bg-slate-900">Python (Requests)</option>
                  <option value="go" className="bg-slate-900">Go (net/http)</option>
                  <option value="ruby" className="bg-slate-900">Ruby (Net::HTTP)</option>
                  <option value="php" className="bg-slate-900">PHP (cURL)</option>
                  <option value="java" className="bg-slate-900">Java (OkHttp)</option>
                  <option value="rust" className="bg-slate-900">Rust (reqwest)</option>
                </select>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
              <pre className="font-mono text-sm text-emerald-400 leading-relaxed">
                {generatedCode}
              </pre>
            </div>
          </div>

          {/* Response Panel */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] overflow-hidden">
            <div className="bg-[#030712] px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Code2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Response</span>
                </div>
                {response && (
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setActiveResponseTab('body')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeResponseTab === 'body' ? 'bg-[#0a0f1c] text-white shadow-sm border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Body
                    </button>
                    <button
                      onClick={() => setActiveResponseTab('headers')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeResponseTab === 'headers' ? 'bg-[#0a0f1c] text-white shadow-sm border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Headers
                    </button>
                  </div>
                )}
              </div>
              {response && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 mr-2">
                    <button onClick={handleCopyResponse} className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors" title="Copy Response">
                      {responseCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleDownloadResponse} className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors" title="Download Response">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${response.status >= 200 && response.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : response.status === 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {response.status === 0 ? 'ERROR' : `${response.status} ${response.statusText}`}
                  </span>
                  <span className="text-zinc-400 bg-white/5 px-2 py-1 rounded-md text-xs font-medium">{response.time} ms</span>
                </div>
              )}
            </div>
            
            <div className="p-0 flex-1 relative bg-[#030712] overflow-auto">
              {!response && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                  <Globe className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">Click "Send" to execute the request and see the response here.</p>
                  <p className="text-xs mt-2 opacity-70 max-w-xs">Note: Browser CORS policies may block requests to some external APIs.</p>
                </div>
              )}
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#030712]/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-3 text-indigo-400">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Sending request...</span>
                  </div>
                </div>
              )}

              {response && (
                <div className="p-4 h-full">
                  {response.error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Request Failed</h4>
                        <p className="text-sm opacity-90">{response.error}</p>
                      </div>
                    </div>
                  ) : activeResponseTab === 'body' ? (
                    <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap break-words">
                      {typeof response.data === 'object' 
                        ? JSON.stringify(response.data, null, 2) 
                        : response.data}
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-white/10 pb-2 last:border-0">
                          <span className="font-semibold text-zinc-300 text-sm min-w-[200px]">{k}</span>
                          <span className="font-mono text-zinc-400 text-sm break-all">{v}</span>
                        </div>
                      ))}
                      {Object.keys(response.headers).length === 0 && (
                        <div className="text-zinc-500 text-sm italic">No headers returned.</div>
                      )}
                    </div>
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
