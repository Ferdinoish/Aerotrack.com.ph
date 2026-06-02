/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from './store/useStore';
import { OnboardingForm } from './components/OnboardingForm';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { LiveTracker } from './components/LiveTracker';
import { ActivityDetail } from './components/ActivityDetail';
import { LayoutDashboard, Calendar, Navigation } from 'lucide-react';
import { cn } from './lib/utils';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = useStore(s => s.profile);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  if (!profile) return null;
  return <>{children}</>;
}


function NavigationBar() {
  const location = useLocation();
  
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Plan' },
    { to: '/live', icon: Navigation, label: 'Track' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 pb-safe pt-2 px-6 flex justify-around items-center z-50 md:bottom-auto md:top-0 md:border-t-0 md:border-b md:h-16 md:px-12 md:justify-start md:gap-8">
      {links.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:py-0 transition-colors duration-200",
              isActive ? "text-lime-400" : "text-zinc-500 hover:text-white"
            )}
          >
            <Icon className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isSetup = location.pathname === '/onboarding' || location.pathname === '/live'; // hide global nav on live screen purely for immersion

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400/30">
      {!isSetup && <NavigationBar />}
      <main className={cn(
        "max-w-7xl mx-auto w-full",
        !isSetup && "pb-24 pt-4 md:pt-24 px-4 md:px-8"
      )}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/onboarding" element={<OnboardingForm />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/activity/:id" element={<ProtectedRoute><ActivityDetail /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><LiveTracker /></ProtectedRoute>} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
