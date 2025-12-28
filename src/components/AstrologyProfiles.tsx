import React, { useState } from 'react';
import { UserData, AstrologySystem, TransitData, InsightData } from '../types';
import VedicChartSquare from './charts/VedicChartSquare';
import NatalChartWheel from './charts/NatalChartWheel';
import VedicProfile from './profiles/VedicProfile';
import KabbalisticProfile from './profiles/KabbalisticProfile';
import HellenisticProfile from './profiles/HellenisticProfile';
import IslamicProfile from './profiles/IslamicProfile';
import StandardProfile from './profiles/StandardProfile';

interface ProfileProps {
  userData: UserData;
  insight: InsightData | null;
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
            {transitData.dailyAdvice.map((advice, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="material-symbols-outlined text-primary text-xl">star_rate</span>
                <p className="text-sm text-white/70">{advice}</p>
              </div>
            ))}
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
    </div >
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
          {transitData.transits.map((t, i) => (
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
          ))}
        </div>
      </section>

      <section className="space-y-4 w-full">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 px-1">Personal Progressions</h3>
        <div className="flex flex-col gap-4">
          {transitData.progressions.map((p, i) => (
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
          ))}
        </div>
      </section>
    </div>
  );
};

const AstrologyProfiles: React.FC<ProfileProps> = ({ userData, insight, transitData, onBack, onOpenChat, onReset }) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'pulse' | 'horoscope'>('horoscope');

  if (!insight) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xl font-bold">Unfolding the mysteries of the {userData.system} system...</p>
    </div>
  );

  const renderProfile = () => {
    switch (userData.system) {
      case AstrologySystem.KABBALISTIC: return <KabbalisticProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.VEDIC: return <VedicProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.HELLENISTIC: return <HellenisticProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      case AstrologySystem.ISLAMIC: return <IslamicProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
      default: return <StandardProfile userData={userData} insight={insight} onOpenChat={onOpenChat} />;
    }
  };

  const renderChart = () => {
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

<div className="space-y-6">
  <div className="flex flex-col items-center text-center">
    <h1 className="text-3xl font-bold text-white mb-2">{userData.name}'s Janma Kundali</h1>
    {insight.sigilUrl && (
      <div className="relative size-48 my-8 group">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-[30px] animate-pulse" />
        <img src={insight.sigilUrl} alt="Celestial Sigil" className="relative size-full rounded-full object-cover border-2 border-primary/30 shadow-2xl transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-dark border border-white/10 px-3 py-1 rounded-full shadow-lg">
          <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Your Celestial Sigil</span>
        </div>
      </div>
    )}
    <p className="text-white/60 text-sm mb-6 leading-relaxed px-4">{insight.summary}</p>
    <div className="w-full grid grid-cols-1 gap-3 mb-6">
      {nakshatra && (
        <div className="bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Explain the Nakshatra of ${nakshatra.value} in my chart.`)}>
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white"><span className="material-symbols-outlined">star</span></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Nakshatra</p><p className="text-lg font-bold text-white">{nakshatra.value}</p></div>
          </div>
          <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
        </div>
      )}
      {rashi && (
        <div className="bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-purple-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`What is the meaning of ${rashi.value} Rashi?`)}>
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">nightlight</span></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Chandra Rashi</p><p className="text-lg font-bold text-white">{rashi.value}</p></div>
          </div>
          <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
        </div>
      )}
      {yoga && (
        <div className="bg-gradient-to-r from-indigo-500/20 to-transparent border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-indigo-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Tell me more about the ${yoga.value} Yogam in my profile.`)}>
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-full bg-indigo-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">join_inner</span></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Yogam</p><p className="text-lg font-bold text-white">{yoga.value}</p></div>
          </div>
          <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
        </div>
      )}
    </div>
    <div className="grid grid-cols-2 gap-4 w-full mb-8">
      {remainingDetails.map((detail, i: number) => (
        <button key={i} onClick={() => onOpenChat(`What is the significance of ${detail.label}: ${detail.value}?`)} className="flex flex-col p-4 rounded-3xl bg-surface-dark/60 border border-white/10 backdrop-blur-md text-left hover:border-primary transition-all shadow-md active:scale-95">
          <span className="text-white/40 text-[9px] font-bold uppercase mb-1 tracking-widest">{detail.label}</span>
          <h3 className="text-sm text-white font-bold leading-tight">{detail.value}</h3>
        </button>
      ))}
    </div>
    {insight.navamsaInsight && (
      <div className="w-full bg-gradient-to-br from-card-surface to-background-dark border border-white/10 rounded-[2.5rem] p-6 shadow-xl text-left">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">diversity_1</span>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Navamsa (D9) Soul Insight</h4>
        </div>
        <p className="text-sm text-white/80 leading-relaxed font-medium mb-4 italic">"{insight.navamsaInsight}"</p>
        <button onClick={() => onOpenChat(`I want a deep dive into my Navamsa chart. You mentioned: ${insight.navamsaInsight}`)} className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
          Explore soul purpose <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    )}
  </div>
</div>
  );
};

const KabbalisticProfile: React.FC<{ userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void }> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="flex flex-col items-center text-center pt-4">
      <div className="relative mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-40"></div>
        <div className="relative h-32 w-32 rounded-full border-2 border-background-dark shadow-2xl bg-cover overflow-hidden bg-background-dark">
          {insight.sigilUrl ? <img src={insight.sigilUrl} className="size-full object-cover" /> : <div className="size-full bg-[url('https://picsum.photos/id/64/300/300')] bg-cover" />}
        </div>
        <div className="absolute bottom-1 right-1 bg-surface-dark border border-white/10 p-2 rounded-full shadow-lg"><span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span></div>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{userData.name}'s Soul Blueprint</h1>
      <div className="flex gap-2 mt-2"><button onClick={() => onOpenChat(`Tell me more about my Kabbalistic Root.`)} className="px-4 py-1.5 rounded-full bg-surface-dark border border-white/10 text-xs font-bold text-primary hover:bg-primary/10 transition-colors shadow-sm">Root: {insight.technicalDetails?.[0]?.value || 'Chesed'}</button></div>
      <p className="text-slate-400 text-sm max-w-[85%] mt-4 leading-relaxed font-medium">{insight.summary}</p>
    </div>
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-1">Active Sefirot</h2>
      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-6 -mx-4 px-4">
        {insight.activeSefirotOrNodes?.map((node, i: number) => (
          <div key={i} className="shrink-0 w-[280px] bg-card-surface/60 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between">
            <div><h3 className="text-white font-bold text-lg mb-2">{node.name}</h3><p className="text-slate-300 text-sm leading-relaxed mb-4">{node.meaning}</p></div>
            <button onClick={() => onOpenChat(`Explain the Sefirot of ${node.name}.`)} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors text-left">Deep Interpret →</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HellenisticProfile: React.FC<{ userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void }> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark shadow-2xl border border-white/5">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay">{insight.sigilUrl ? <img src={insight.sigilUrl} className="size-full object-cover" /> : <div className="size-full bg-[url('https://picsum.photos/id/160/800/800')] bg-cover" />}</div>
      <div className="relative z-10 flex flex-col p-8 gap-4">
        <div className="flex items-center justify-between"><div className="rounded-2xl bg-indigo-900/50 p-4 ring-1 ring-white/20 backdrop-blur-md shadow-inner"><span className="material-symbols-outlined text-3xl text-indigo-300">bedtime</span></div><span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md border border-white/10">Night Sect</span></div>
        <h3 className="text-2xl font-bold text-white mt-2">{userData.name}'s Nocturnal Chart</h3>
        <p className="text-[#cb90bc] text-sm leading-relaxed font-medium">{insight.summary}</p>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase text-[#cb90bc] tracking-[0.2em] px-1">Chart Ruler</h3>
      <button onClick={() => onOpenChat(`My Hellenistic chart ruler is ${insight.archetype}.`)} className="flex w-full items-center gap-5 rounded-3xl bg-surface-dark p-6 shadow-xl ring-1 ring-white/5 hover:ring-primary/50 transition-all text-left active:scale-95">
        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-lg"><span className="material-symbols-outlined text-3xl">flare</span></div>
        <div className="flex-1"><p className="text-xl font-bold text-white">{insight.archetype}</p><p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Dominant Placement</p></div>
      </button>
    </div>
  </div>
);

const IslamicProfile: React.FC<{ userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void }> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-surface-dark to-[#451d3b] border border-white/5 shadow-2xl">
      <div className="h-56 bg-cover bg-center opacity-60 overflow-hidden">{insight.sigilUrl ? <img src={insight.sigilUrl} className="size-full object-cover" /> : <div className="size-full bg-[url('https://picsum.photos/id/180/800/800')] bg-cover" />}</div>
      <div className="absolute bottom-6 left-6 pr-6"><h3 className="text-white text-3xl font-bold mb-2">{userData.name}'s Horoscope</h3><div className="flex gap-2"><span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">{insight.archetype}</span></div></div>
      <div className="p-8"><p className="text-white/80 text-base leading-relaxed mb-6 font-medium italic">"{insight.summary}"</p><button onClick={() => onOpenChat(`In my Islamic horoscope, my archetype is ${insight.archetype}.`)} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-all">Spiritual Deep Dive →</button></div>
    </div>
    <div className="space-y-4">
      <h3 className="text-white text-lg font-bold px-1">The Lots (Arabic Parts)</h3>
      <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-4 px-4 pb-4">
        {insight.technicalDetails?.map((lot, i: number) => (
          <button key={i} onClick={() => onOpenChat(`Tell me more about the Part of ${lot.label}.`)} className="shrink-0 w-44 p-4 bg-surface-dark/60 backdrop-blur-sm border border-white/5 rounded-3xl hover:border-primary transition-all text-left shadow-lg active:scale-95">
            <div className="w-full aspect-square bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><span className="material-symbols-outlined text-4xl text-primary">{lot.icon}</span></div>
            <p className="text-white text-sm font-bold mb-1">{lot.label}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{lot.value}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const StandardProfile: React.FC<{ userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void }> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-8">
    <div className="text-center px-4">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">{userData.name}'s {userData.system} Chart</h1>
      {insight.sigilUrl && (<div className="relative size-56 mx-auto my-8 group"><div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-[40px] group-hover:blur-[60px] transition-all" /><img src={insight.sigilUrl} className="relative size-full rounded-[2.5rem] object-cover border-2 border-primary/30 shadow-2xl" /></div>)}
      <p className="text-xl text-primary font-bold mb-8 uppercase tracking-[0.1em]">{insight.archetype}</p>
      <div className="bg-surface-dark/80 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-md"><p className="text-lg leading-relaxed text-white/80 mb-6 font-medium">{insight.summary}</p></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {insight.technicalDetails?.map((detail, i: number) => (
        <button key={i} onClick={() => onOpenChat(`What does it mean for ${detail.label} to be at ${detail.value}?`)} className="flex items-center gap-5 bg-surface-dark p-6 rounded-3xl border border-white/5 shadow-xl hover:border-primary/50 transition-all text-left active:scale-95 group">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-2xl">{detail.icon}</span></div>
          <div><p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{detail.label}</p><p className="text-lg font-bold text-white leading-none">{detail.value}</p></div>
        </button>
      ))}
    </div>
  </div>
);

export default AstrologyProfiles;