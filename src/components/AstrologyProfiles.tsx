import React, { useState } from 'react';
import { UserData, AstrologySystem, TransitData, InsightData } from '../types';
import VedicChartSquare from './charts/VedicChartSquare';
import NatalChartWheel from './charts/NatalChartWheel';
import VedicProfile from './profiles/VedicProfile';
import KabbalisticProfile from './profiles/KabbalisticProfile';
import HellenisticProfile from './profiles/HellenisticProfile';
import IslamicProfile from './profiles/IslamicProfile';
import StandardProfile from './profiles/StandardProfile';
import NumerologyGrid from './NumerologyGrid';

interface ProfileProps {
  userData: UserData;
  insight: InsightData | null | { error: string };
  transitData: TransitData | null;
  onBack: () => void;
  onOpenChat: (prompt?: string) => void;
  onReset: () => void;
}

// FIX: Helper to prevent broken icons
const getSafeIcon = (iconName: string) => {
  const validIcons = ['star', 'bedtime', 'sunny', 'public', 'favorite', 'bolt', 'auto_awesome', 'timeline', 'psychology', 'flare', 'diversity_1', 'nightlight', 'join_inner', 'verified', 'hdr_strong', 'hdr_weak', 'science', 'swords', 'contrast', 'wc', 'school', 'hourglass_empty'];

  if (validIcons.includes(iconName)) return iconName;
  if (iconName.includes('sun') || iconName.includes('moon')) return 'contrast';
  if (iconName.includes('mars') || iconName.includes('venus')) return 'wc';
  if (iconName.includes('mercury') || iconName.includes('jupiter')) return 'school';
  return 'auto_awesome';
};

const HoroscopeSection: React.FC<{
  transitData: TransitData | null,
  userData: UserData,
  onOpenChat: (p?: string) => void
}> = ({ transitData, userData, onOpenChat }) => {

  if (!transitData) return (
    <div className="py-20 text-center">
      <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
      <p className="text-white/60">Gazing into your daily destiny...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card-surface/80 to-background-dark border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin-slow">auto_awesome</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold">Your Daily Guidance</span>
            <h2 className="text-3xl font-bold leading-tight text-white">{transitData.dailyHeadline}</h2>
          </div>
        </div>

        <p className="text-lg leading-relaxed text-white/80 font-medium italic">
          "{transitData.dailyHoroscope}"
        </p>

        <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
          <div className="text-center">
            <span className="block text-[10px] uppercase text-white/40 tracking-widest mb-1">Vibe</span>
            <span className="text-primary font-bold">{transitData.mood}</span>
          </div>
          <div className="text-center border-x border-white/5">
            <span className="block text-[10px] uppercase text-white/40 tracking-widest mb-1">Number</span>
            <span className="text-white font-bold">{transitData.luckyNumber}</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] uppercase text-white/40 tracking-widest mb-1">Color</span>
            <span className="text-white font-bold">{transitData.luckyColor}</span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Advice for {userData.name}</h4>
          <div className="space-y-3">
            {transitData.dailyAdvice && transitData.dailyAdvice.length > 0 ? (
              transitData.dailyAdvice.map((advice, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="material-symbols-outlined text-primary text-xl">star_rate</span>
                  <p className="text-sm text-white/70">{advice}</p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="material-symbols-outlined text-primary text-xl">star_rate</span>
                <p className="text-sm text-white/70">Reflect on your inner peace today.</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onOpenChat(`Can you elaborate on my daily horoscope? Specifically about "${transitData.dailyHeadline}" and how it affects my ${userData.focusAreas[0]} energy today?`)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
        >
          <span className="material-symbols-outlined text-primary text-lg">psychology</span>
          Discuss Today's Advice
        </button>
      </div>
    </div>
  );
};

const PulseSection: React.FC<{ transitData: TransitData | null, userData: UserData, onOpenChat: (p?: string) => void }> = ({ transitData, userData, onOpenChat }) => {
  if (!transitData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">Active Transits</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">Cosmic Alignments</h1>
      </header>

      <section className="space-y-4">
        <div className="grid gap-4">
          {transitData.transits && transitData.transits.length > 0 ? transitData.transits.map((t, i) => (
            <div key={i} className="bg-surface-dark border border-white/5 rounded-2xl p-5 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">{getSafeIcon(t.icon)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-snug">{t.planet}</h4>
                    <p className="text-xs text-primary/80 uppercase font-bold tracking-wider">{t.aspect}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${t.intensity === 'High' ? 'bg-red-500/20 text-red-400' : t.intensity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{t.intensity}</div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4 font-normal">{t.description}</p>
              <button
                onClick={() => onOpenChat(`Can you tell me more about the current transit of ${t.planet} making a ${t.aspect} aspect?`)}
                className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Interpret alignment
              </button>
            </div>
          )) : <div className="text-white/40 text-center py-4">No active transits detected.</div>}
        </div>
      </section>

      <section className="space-y-4 w-full">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 px-1">Personal Progressions</h3>
        <div className="flex flex-col gap-4">
          {transitData.progressions && transitData.progressions.length > 0 ? (
            transitData.progressions.map((p, i) => (
              <div key={i} className="w-full bg-indigo-900/10 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-lg animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mb-4">
                  <h4 className="font-bold text-indigo-300 mb-3 text-lg leading-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400">timeline</span>
                    {p.title}
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">{p.insight}</p>
                </div>
                <button
                  onClick={() => onOpenChat(`I'm interested in my progression: "${p.title}".`)}
                  className="w-max text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors border-b border-indigo-400/20 pb-0.5"
                >
                  Explore Path <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-white/40 text-center py-4">No major progressions active.</div>
          )}
        </div>
      </section>
    </div>
  );
};

const AstrologyProfiles: React.FC<ProfileProps> = ({ userData, insight, transitData, onBack, onOpenChat, onReset }) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'pulse' | 'horoscope'>('horoscope');

  if (!insight || 'error' in insight) {
    const errorMessage = insight && 'error' in insight ? insight.error : "The celestial link could not be established.";

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
          <span className="material-symbols-outlined text-6xl text-red-400 relative z-10">cloud_off</span>
        </div>
        <div className="space-y-2 max-w-xs">
          <h3 className="text-xl font-bold text-white">Connection Interrupted</h3>
          <p className="text-white/60 text-sm">{errorMessage}</p>
          <p className="text-white/30 text-xs mt-2">Please try again or Reset App.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-surface-dark border border-white/10 hover:bg-white/5 font-bold transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Go Back and Edit
          </button>
          <button onClick={onReset} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">refresh</span> Reset App
          </button>
        </div>
      </div>
    );
  }

  const renderProfile = () => {
    switch (userData.system) {
      case AstrologySystem.KABBALISTIC: return <KabbalisticProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.VEDIC: return <VedicProfile userData={userData} data={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.HELLENISTIC: return <HellenisticProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.ISLAMIC: return <IslamicProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.NUMEROLOGY: return <StandardProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      default: return <StandardProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
    }
  };

  const renderChart = () => {
    // Numerology Special Case: Render Grid regardless of 'planets' data
    if (userData.system === AstrologySystem.NUMEROLOGY) {
      return (
        <div className="mb-8 relative group w-full flex justify-center">
          {/* @ts-ignore - Temporary ignore until file is fully typed/imported */}
          <NumerologyGrid />
        </div>
      );
    }

    if (!insight.chartData?.planets) return null;
    return (
      <div className="mb-8 relative group w-full flex justify-center">
        {userData.system === AstrologySystem.VEDIC ? (
          <VedicChartSquare planets={insight.chartData.planets} />
        ) : (
          <NatalChartWheel planets={insight.chartData.planets} />
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 flex flex-col bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center p-4 justify-between">
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="flex flex-col items-center">
            <h2 className="font-bold text-lg tracking-tight">{userData.system} Profile</h2>
          </div>
          <button onClick={onReset} className="flex size-10 items-center justify-center rounded-full hover:bg-red-500/20 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">restart_alt</span></button>
        </div>
        <div className="flex px-4 pb-2 gap-8 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('horoscope')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-2 transition-all border-b-2 ${activeTab === 'horoscope' ? 'text-primary border-primary' : 'text-white/40 border-transparent'}`}>Horoscope</button>
          <button onClick={() => setActiveTab('blueprint')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-2 transition-all border-b-2 ${activeTab === 'blueprint' ? 'text-primary border-primary' : 'text-white/40 border-transparent'}`}>Blueprint</button>
          <button onClick={() => setActiveTab('pulse')} className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap pb-2 transition-all border-b-2 ${activeTab === 'pulse' ? 'text-primary border-primary' : 'text-white/40 border-transparent'}`}>Pulse</button>
        </div>
      </header>
      <main className="flex-1 p-4 w-full max-w-md mx-auto overflow-x-hidden">
        {activeTab === 'blueprint' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {renderChart()}
            {renderProfile()}
          </div>
        )}
        {activeTab === 'pulse' && <PulseSection transitData={transitData} userData={userData} onOpenChat={onOpenChat} />}
        {activeTab === 'horoscope' && <HoroscopeSection transitData={transitData} userData={userData} onOpenChat={onOpenChat} />}
      </main>
      <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center">
        <button onClick={() => onOpenChat()} className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_10px_30px_rgba(242,13,185,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>Ask Astromic Oracle</span>
        </button>
      </div>
    </div>
  );
};





export default AstrologyProfiles;