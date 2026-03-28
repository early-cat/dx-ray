import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { Scan, Menu, X, ChevronDown } from 'lucide-react';

export const TopNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (categoryName: string) => {
    if (activeDropdown === categoryName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(categoryName);
    }
  };

  return (
    <nav className="bg-[#030712]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors group">
              <Scan className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-white">DX-Ray</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1" ref={dropdownRef}>
            {CATEGORIES.map((category) => (
              <div key={category.name} className="relative">
                <button
                  onClick={() => toggleDropdown(category.name)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeDropdown === category.name ? 'text-white bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === category.name ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Dropdown */}
                {activeDropdown === category.name && (
                  <div className="absolute left-0 mt-2 w-80 rounded-xl bg-[#0a0f1c] border border-white/10 shadow-2xl py-2 z-50">
                    {category.tools.map((tool) => {
                      const isActive = location.pathname === tool.path;
                      return (
                        <Link
                          key={tool.name}
                          to={tool.path}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${isActive ? 'bg-white/5' : ''}`}
                        >
                          <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                            <tool.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-sm font-medium mb-0.5 ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                              {tool.name}
                            </div>
                            <div className="text-xs text-zinc-500 leading-snug line-clamp-2">
                              {tool.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#030712] max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <div className="px-2 pt-2 pb-6 space-y-1">
            {CATEGORIES.map((category) => (
              <div key={category.name} className="space-y-1">
                <button
                  onClick={() => toggleDropdown(category.name)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <category.icon className="w-5 h-5 text-zinc-500" />
                    {category.name}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === category.name ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mobile Submenu */}
                {activeDropdown === category.name && (
                  <div className="pl-11 pr-3 pb-2 space-y-1">
                    {category.tools.map((tool) => {
                      const isActive = location.pathname === tool.path;
                      return (
                        <Link
                          key={tool.name}
                          to={tool.path}
                          className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${
                            isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 p-1 rounded-md ${isActive ? 'bg-white/10 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                            <tool.icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{tool.name}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
