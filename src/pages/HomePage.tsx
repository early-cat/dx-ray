import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { 
  Terminal, Shield, Server, Network, Search, 
  GitGraph, ArrowRight, Settings, 
  Clock, Lock, Globe, FileCode2, Command,
  Activity, Scan, AlertTriangle, Zap, Eye,
  BarChart3, Crosshair, ChevronRight, ChevronLeft,
  CheckCircle2, TrendingUp
} from 'lucide-react';
import { CATEGORIES, THEME_MAP, ALL_TOOLS } from '../data/categories';

const ROLES = [
  { label: 'DevOps', icon: Network, desc: 'Tools for infrastructure configuration, automation scripts, and pipeline management.', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { label: 'Developers', icon: FileCode2, desc: 'Utilities for code debugging, data formatting, and expression testing.', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { label: 'SRE', icon: Shield, desc: 'Resources for system reliability, log analysis, and access control configuration.', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

const ROTATING_WORDS = ["DevOps.", "Developers.", "SREs.", "Platform Teams."];

const RotatingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex min-w-[280px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const AnimatedText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "center" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

const ToolCarousel = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Duplicate tools to create a seamless infinite loop
  const carouselItems = [...ALL_TOOLS, ...ALL_TOOLS];

  return (
    <div className="w-full overflow-hidden py-12 relative border-y border-white/5 bg-zinc-950/50 backdrop-blur-sm my-16">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-2 px-8 mb-6 max-w-7xl mx-auto">
        <Zap className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest">One-Stop Solution Tools</h3>
      </div>

      <motion.div 
        className="flex gap-6 px-4 w-max"
        animate={{ x: isHovered ? 0 : "-50%" }}
        transition={{ 
          duration: 40, 
          ease: "linear", 
          repeat: Infinity,
          repeatType: "loop"
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {carouselItems.map((tool, idx) => {
          const theme = THEME_MAP[tool.theme as keyof typeof THEME_MAP];
          return (
            <Link 
              key={`${tool.name}-${idx}`}
              to={tool.path}
              className={`flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 ${theme.hoverBorder} hover:bg-zinc-800 transition-all duration-300 min-w-[300px] group`}
            >
              <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} border ${theme.border} group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold text-sm group-hover:text-white transition-colors">{tool.name}</h4>
                <p className="text-zinc-500 text-xs mt-0.5 font-mono truncate max-w-[180px]">{tool.tags.join(' • ')}</p>
              </div>
              <ArrowRight className={`w-4 h-4 ml-auto ${theme.text} opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0`} />
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
};

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-zinc-50 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      <SEO 
        title="Home" 
        description="DX-Ray is a comprehensive suite of utilities designed to simplify complex configurations, debug systems, and accelerate daily workflows across the engineering lifecycle."
        keywords="developer tools, devops, sre, kubernetes, cron, regex, systemd, rbac, subnet, nginx"
      />
      {/* X-Ray Scanner Animation */}
      <motion.div 
        animate={{ y: ['-100%', '1000%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_5px_rgba(34,211,238,0.3)] z-0 pointer-events-none"
      />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee0a_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[150px] pointer-events-none"></div>

      {/* Header / Hero Section */}
      <div className="relative z-10 pt-24 pb-12 px-6 text-center max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
        >
          <Scan className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">The One-Stop Solution Toolkit</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-6 flex flex-wrap justify-center gap-x-4"
        >
          <span>Essential Tools for</span>
          <RotatingText />
        </motion.h1>
        
        <div className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed mb-12">
          <AnimatedText text="A comprehensive suite of utilities designed to simplify complex configurations, debug systems, and accelerate daily workflows across the engineering lifecycle." />
        </div>

        {/* Roles / Use Cases */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left"
        >
          {ROLES.map((role, idx) => (
            <div key={idx} className={`p-5 rounded-2xl bg-zinc-900/50 border border-white/5 ${role.border} backdrop-blur-sm relative overflow-hidden group hover:bg-zinc-800/50 transition-colors`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${role.bg.replace('/10', '')}`}></div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${role.bg} ${role.color}`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-zinc-200">{role.label}</span>
              </div>
              <div className="text-sm text-zinc-400 leading-relaxed">{role.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Auto-scrolling Carousel */}
      <ToolCarousel />

      {/* Categorized Tools Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="space-y-24">
          {CATEGORIES.map((category, catIdx) => {
            const theme = THEME_MAP[category.theme as keyof typeof THEME_MAP];
            return (
              <motion.section 
                key={category.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: catIdx * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} border ${theme.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                        {category.name}
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1 font-mono">{category.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {category.tools.map((tool) => (
                    <Link 
                      key={tool.name}
                      to={tool.path} 
                      className={`group relative flex flex-col rounded-3xl bg-zinc-900/40 border border-white/5 ${theme.hoverBorder} hover:bg-zinc-900/80 transition-all duration-500 overflow-hidden backdrop-blur-sm shadow-lg`}
                    >
                      <div className="p-6 flex flex-col flex-1">
                        <div className={`w-12 h-12 mb-6 rounded-xl ${theme.bg} ${theme.text} border ${theme.border} flex items-center justify-center shadow-lg`}>
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors mb-2">
                          {tool.name}
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-light">
                          {tool.desc}
                        </p>
                        
                        {/* Benefits & Effectiveness */}
                        <div className="mb-6 space-y-4 flex-1">
                          <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Key Benefits</div>
                            <ul className="space-y-2">
                              {tool.benefits.map((b, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${theme.text}`} />
                                  <span className="leading-snug">{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className={`mt-4 p-3.5 rounded-xl bg-zinc-950/50 border border-white/5 group-hover:${theme.border} transition-colors`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <TrendingUp className={`w-4 h-4 ${theme.text}`} />
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Effectiveness</span>
                            </div>
                            <p className={`text-sm font-medium ${theme.text}`}>{tool.effectiveness}</p>
                          </div>
                        </div>

                        {/* Footer: Tags & Arrow */}
                        <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
                          <div className="flex flex-wrap gap-2">
                            {tool.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-950 text-[11px] font-mono text-zinc-400 border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-zinc-950 border border-white/10 group-hover:${theme.bg} group-hover:${theme.border} group-hover:${theme.text} transition-all duration-300 shrink-0`}>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
