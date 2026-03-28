import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Copy, Check, Terminal, Zap, Calendar, Play } from 'lucide-react';
import cronstrue from 'cronstrue';
import { SEO } from '../components/SEO';

type CronType = 'every' | 'specific' | 'range' | 'step';

interface CronPartState {
  type: CronType;
  specificValues: string[];
  rangeStart: string;
  rangeEnd: string;
  stepInterval: string;
  stepStart: string;
}

const defaultPartState = (type: CronType = 'every'): CronPartState => ({
  type,
  specificValues: ['0'],
  rangeStart: '0',
  rangeEnd: '1',
  stepInterval: '1',
  stepStart: '0',
});

const generateOptions = (start: number, end: number, pad = false) => {
  const options = [];
  for (let i = start; i <= end; i++) {
    options.push({
      value: i.toString(),
      label: pad ? i.toString().padStart(2, '0') : i.toString(),
    });
  }
  return options;
};

const WEEKDAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const CronGenerator = () => {
  const [activeTab, setActiveTab] = useState<'minute' | 'hour' | 'day' | 'month' | 'week'>('minute');
  const [copied, setCopied] = useState(false);

  const [cronState, setCronState] = useState({
    minute: defaultPartState('every'),
    hour: defaultPartState('every'),
    day: defaultPartState('every'),
    month: defaultPartState('every'),
    week: defaultPartState('every'),
  });

  const updateState = (part: keyof typeof cronState, updates: Partial<CronPartState>) => {
    setCronState((prev) => ({
      ...prev,
      [part]: { ...prev[part], ...updates },
    }));
  };

  const getCronString = (part: keyof typeof cronState, isDayOrMonth = false) => {
    const state = cronState[part];
    if (state.type === 'every') return '*';
    if (state.type === 'specific') {
      if (state.specificValues.length === 0) return '*';
      return state.specificValues.sort((a, b) => parseInt(a) - parseInt(b)).join(',');
    }
    if (state.type === 'range') return `${state.rangeStart}-${state.rangeEnd}`;
    if (state.type === 'step') {
      if (state.stepStart === '*' || (state.stepStart === '0' && !isDayOrMonth)) {
         return `*/${state.stepInterval}`;
      }
      return `${state.stepStart}/${state.stepInterval}`;
    }
    return '*';
  };

  const cronExpression = useMemo(() => {
    return `${getCronString('minute')} ${getCronString('hour')} ${getCronString('day', true)} ${getCronString('month', true)} ${getCronString('week')}`;
  }, [cronState]);

  const humanReadable = useMemo(() => {
    try {
      return cronstrue.toString(cronExpression, { throwExceptionOnParseError: true });
    } catch (e) {
      return 'Invalid cron expression';
    }
  }, [cronExpression]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: string) => {
    if (preset === 'every-15-mins') {
      setCronState({
        minute: { ...defaultPartState('step'), stepInterval: '15', stepStart: '0' },
        hour: defaultPartState('every'),
        day: defaultPartState('every'),
        month: defaultPartState('every'),
        week: defaultPartState('every'),
      });
    } else if (preset === 'every-day-midnight') {
      setCronState({
        minute: { ...defaultPartState('specific'), specificValues: ['0'] },
        hour: { ...defaultPartState('specific'), specificValues: ['0'] },
        day: defaultPartState('every'),
        month: defaultPartState('every'),
        week: defaultPartState('every'),
      });
    } else if (preset === 'every-weekday-9am') {
      setCronState({
        minute: { ...defaultPartState('specific'), specificValues: ['0'] },
        hour: { ...defaultPartState('specific'), specificValues: ['9'] },
        day: defaultPartState('every'),
        month: defaultPartState('every'),
        week: { ...defaultPartState('range'), rangeStart: '1', rangeEnd: '5' },
      });
    }
  };

  const renderTabContent = (
    part: keyof typeof cronState,
    title: string,
    min: number,
    max: number,
    options: { value: string; label: string }[]
  ) => {
    const state = cronState[part];

    const handleSpecificToggle = (val: string) => {
      const newValues = state.specificValues.includes(val)
        ? state.specificValues.filter((v) => v !== val)
        : [...state.specificValues, val];
      updateState(part, { specificValues: newValues });
    };

    const inputClasses = "bg-[#0a0f1c] border border-white/20 text-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm";

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Every */}
        <div
          onClick={() => updateState(part, { type: 'every' })}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
            state.type === 'every'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'bg-[#0a0f1c] border-white/10 hover:bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${state.type === 'every' ? 'border-emerald-500' : 'border-white/20'}`}>
              {state.type === 'every' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </div>
            <div>
              <span className={`font-medium block ${state.type === 'every' ? 'text-emerald-400' : 'text-zinc-300'}`}>Every {title.toLowerCase()}</span>
              <span className="text-xs text-zinc-500 font-mono mt-1 block">Wildcard (*)</span>
            </div>
          </div>
        </div>

        {/* Step */}
        <div
          onClick={() => updateState(part, { type: 'step' })}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 ${
            state.type === 'step'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'bg-[#0a0f1c] border-white/10 hover:bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${state.type === 'step' ? 'border-emerald-500' : 'border-white/20'}`}>
              {state.type === 'step' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </div>
            <span className={`font-medium ${state.type === 'step' ? 'text-emerald-400' : 'text-zinc-300'}`}>Step / Interval</span>
          </div>
          
          <div className="pl-9 flex flex-wrap items-center gap-3 text-sm text-zinc-400" onClick={e => e.stopPropagation()}>
            <span>Every</span>
            <input
              type="number"
              min="1"
              max={max}
              value={state.stepInterval}
              onChange={(e) => updateState(part, { stepInterval: e.target.value })}
              disabled={state.type !== 'step'}
              className={`w-20 text-center ${inputClasses}`}
            />
            <span>{title.toLowerCase()}(s) starting at</span>
            <select
              value={state.stepStart}
              onChange={(e) => updateState(part, { stepStart: e.target.value })}
              disabled={state.type !== 'step'}
              className={inputClasses}
            >
              <option value="*">First</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Range */}
        <div
          onClick={() => updateState(part, { type: 'range' })}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 ${
            state.type === 'range'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'bg-[#0a0f1c] border-white/10 hover:bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${state.type === 'range' ? 'border-emerald-500' : 'border-white/20'}`}>
              {state.type === 'range' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </div>
            <span className={`font-medium ${state.type === 'range' ? 'text-emerald-400' : 'text-zinc-300'}`}>Range</span>
          </div>
          
          <div className="pl-9 flex flex-wrap items-center gap-3 text-sm text-zinc-400" onClick={e => e.stopPropagation()}>
            <span>Between</span>
            <select
              value={state.rangeStart}
              onChange={(e) => updateState(part, { rangeStart: e.target.value })}
              disabled={state.type !== 'range'}
              className={inputClasses}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span>and</span>
            <select
              value={state.rangeEnd}
              onChange={(e) => updateState(part, { rangeEnd: e.target.value })}
              disabled={state.type !== 'range'}
              className={inputClasses}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Specific */}
        <div
          onClick={() => updateState(part, { type: 'specific' })}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 ${
            state.type === 'specific'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'bg-[#0a0f1c] border-white/10 hover:bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${state.type === 'specific' ? 'border-emerald-500' : 'border-white/20'}`}>
              {state.type === 'specific' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </div>
            <span className={`font-medium ${state.type === 'specific' ? 'text-emerald-400' : 'text-zinc-300'}`}>Specific {title.toLowerCase()}s</span>
          </div>
          
          <div className="pl-9" onClick={e => e.stopPropagation()}>
            <div className={`grid gap-2 ${options.length > 12 ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10' : 'grid-cols-4 sm:grid-cols-7'}`}>
              {options.map((opt) => {
                const isSelected = state.specificValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={state.type !== 'specific'}
                    onClick={() => handleSpecificToggle(opt.value)}
                    className={`py-2 px-1 text-xs font-mono rounded-lg border transition-all ${
                      state.type !== 'specific' 
                        ? 'opacity-50 cursor-not-allowed border-white/10 bg-[#030712] text-zinc-500' 
                        : isSelected
                          ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-sm'
                          : 'bg-[#0a0f1c] border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'minute', label: 'Minute' },
    { id: 'hour', label: 'Hour' },
    { id: 'day', label: 'Day' },
    { id: 'month', label: 'Month' },
    { id: 'week', label: 'Week' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-300 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      <SEO 
        title="Cron Expression Generator" 
        description="Easily generate, parse, and understand cron expressions with our interactive builder."
        keywords="cron generator, cron expression, crontab, cron schedule, cron parser"
      />
      {/* Atmospheric Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-400/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none"></div>
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
        <div className="flex items-center gap-2 text-emerald-500 font-medium">
          <Clock className="w-5 h-5" />
          <span className="hidden sm:inline">Cron Generator</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Builder */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
          
          {/* Custom Tab Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-start px-5 py-3 rounded-2xl border transition-all min-w-[100px] ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'bg-[#0a0f1c] border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-sm font-semibold capitalize">{tab.label}</span>
                <span className={`text-xs font-mono mt-1 ${activeTab === tab.id ? 'text-emerald-500/70' : 'text-zinc-500'}`}>
                  {getCronString(tab.id, tab.id === 'day' || tab.id === 'month')}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'minute' && renderTabContent('minute', 'Minute', 0, 59, generateOptions(0, 59, true))}
            {activeTab === 'hour' && renderTabContent('hour', 'Hour', 0, 23, generateOptions(0, 23, true))}
            {activeTab === 'day' && renderTabContent('day', 'Day of Month', 1, 31, generateOptions(1, 31))}
            {activeTab === 'month' && renderTabContent('month', 'Month', 1, 12, MONTHS)}
            {activeTab === 'week' && renderTabContent('week', 'Day of Week', 0, 6, WEEKDAYS)}
          </div>
        </div>

        {/* Right Column: Output & Presets */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          {/* Live Output Card */}
          <div className="sticky top-24 bg-[#0a0f1c] border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden relative shadow-xl">
            {/* Inner Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Live Output
              </h2>
              
              <div className="bg-[#030712] border border-white/10 rounded-2xl p-6 mb-6 shadow-inner relative group">
                <div className="font-mono text-3xl sm:text-4xl text-emerald-500 tracking-widest text-center break-words">
                  {cronExpression}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-[#0a0f1c] border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex items-start gap-3 text-zinc-300 bg-[#030712] p-4 rounded-2xl border border-white/10">
                <Play className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-medium text-sm leading-relaxed">
                  {humanReadable}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="w-full mt-6 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Expression'}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Quick Presets
            </h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => applyPreset('every-15-mins')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-left group"
              >
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Every 15 minutes</span>
                <span className="text-xs font-mono text-zinc-500">*/15 * * * *</span>
              </button>
              <button 
                onClick={() => applyPreset('every-day-midnight')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-left group"
              >
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Every day at midnight</span>
                <span className="text-xs font-mono text-zinc-500">0 0 * * *</span>
              </button>
              <button 
                onClick={() => applyPreset('every-weekday-9am')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-left group"
              >
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Weekdays at 9:00 AM</span>
                <span className="text-xs font-mono text-zinc-500">0 9 * * 1-5</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
