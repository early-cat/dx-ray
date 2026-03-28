import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { KubeManifestStudio } from './pages/KubeManifestStudio';
import { CronGenerator } from './pages/CronGenerator';
import { CurlBuilder } from './pages/CurlBuilder';
import { RbacGenerator } from './pages/RbacGenerator';
import { SystemdGenerator } from './pages/SystemdGenerator';
import { ChmodCalculator } from './pages/ChmodCalculator';
import { GraphVizGenerator } from './pages/GraphVizGenerator';
import { SubnetCalculator } from './pages/SubnetCalculator';
import { NginxGenerator } from './pages/NginxGenerator';
import { RegexTester } from './pages/RegexTester';
import { TopNavbar } from './components/TopNavbar';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <TopNavbar />
        <main className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kube" element={<KubeManifestStudio />} />
            <Route path="/cron" element={<CronGenerator />} />
            <Route path="/curl" element={<CurlBuilder />} />
            <Route path="/rbac" element={<RbacGenerator />} />
            <Route path="/systemd" element={<SystemdGenerator />} />
            <Route path="/chmod" element={<ChmodCalculator />} />
            <Route path="/graphviz" element={<GraphVizGenerator />} />
            <Route path="/subnet" element={<SubnetCalculator />} />
            <Route path="/nginx" element={<NginxGenerator />} />
            <Route path="/regex" element={<RegexTester />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
