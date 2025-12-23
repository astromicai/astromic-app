import React, { useState } from 'react';
import { UserData, AstrologySystem, TransitData, InsightData } from '../types';
import { generateDestinyVideo } from '../services/geminiService';

interface ProfileProps {
  userData: UserData;
  insight: InsightData | null;
  transitData: TransitData | null;
  onBack: () => void;
  onOpenChat: (prompt?: string) => void;
  onReset: () => void;
  onPlayAudio: () => void; // <--- NEW PROP
  isPlaying: boolean;      // <--- NEW PROP
}

const VedicChartSquare: React.FC<{ planets: any[] }> = ({ planets = [] }) => {
  const size = 320;
  const strokeColor = "rgba(242, 13, 185, 0.4)";
  
  const houses = [
    { id: 1, path: `M 160 160 L 80 80 L 160 0 L 240 80 Z`, labelPos: { x: 160, y: 50 } }, 
    { id: 2, path: `M 80 80 L 0 0 L 160 0 Z`, labelPos: { x: 80, y: 25 } },              
    { id: 3, path: `M 80 80 L 0 0 L 0 160 Z`, labelPos: { x: 30, y: 80 } },             
    { id: 4, path: `M 160 160 L 80 80 L 0 160 L 80 240 Z`, labelPos: { x: 80, y: 160 } }, 
    { id: 5, path: `M 80 240 L 0 160 L 0 320 Z`, labelPos: { x: 30, y: 240 } },            
    { id: 6, path: `M 80 240 L 0 320 L 160 320 Z`, labelPos: { x: 80, y: 295 } },          
    { id: 7, path: `M 160 160 L 80 240 L 160 320 L 240 240 Z`, labelPos: { x: 160, y: 260 } }, 
    { id: 8, path: `M 240 240 L 160 320 L 320 320 Z`, labelPos: { x: 240, y: 295 } },      
    { id: 9, path: `M 240 240 L 320 320 L 320 160 Z`, labelPos: { x: 290, y: 240 } },      
    { id: 10, path: `M 160 160 L 240 240 L 320 160 L 240 80 Z`, labelPos: { x: 240, y: 160 } }, 
    { id: 11, path: `M 240 80 L 320 160 L 320 0 Z`, labelPos: { x: 290, y: 80 } },          
    { id: 12, path: `M 240 80 L 320 0 L 160 0 Z`, labelPos: { x: 240, y: 25 } },            
  ];

  const getHouseFromDegree = (degree: number) => {
    return Math.floor(degree / 30) + 1;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative w-full max-w-[320px] aspect-square">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-[0_0_20px_rgba(242,13,185,0.15)]">
          <rect x="0" y="0" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2" />
          <line x1="0" y1="0" x2={size} y2={size} stroke={strokeColor} strokeWidth="1" />
          <line x1={size} y1="0" x2="0" y2={size} stroke={strokeColor} strokeWidth="1" />
          <path d={`M ${size/2} 0 L 0 ${size/2} L ${size/2} ${size} L ${size} ${size/2} Z`} fill="none" stroke={strokeColor} strokeWidth="1" />
          {houses.map((house) => {
            const planetsInHouse = planets.filter(p => getHouseFromDegree(p.degree) === house.id);
            return (
              <g key={house.id}>
                <text x={house.labelPos.x} y={house.labelPos.y} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10" className="font-bold pointer-events-none">{house.id}</text>
                {planetsInHouse.map((p, idx) => {
                  const xOffset = (idx % 2 === 0 ? -12 : 12) * (idx > 1 ? 1.5 : 1);
                  const yOffset = (idx < 2 ? 15 : 30);
                  return (
                    <g key={p.name + idx} className="cursor-help">
                      <title>{p.name}: {p.degree}° in {p.sign}</title>
                      <text x={house.labelPos.x + (planetsInHouse.length > 1 ? xOffset : 0)} y={house.labelPos.y + yOffset} textAnchor="middle" fill="#f20db9" fontSize="12" className="font-bold drop-shadow-md">{p.name.substring(0, 2)}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="mt-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Janma Kundali</p>
          <p className="text-xs text-white/40">Vedic Diamond Layout</p>
        </div>
      </div>
    </div>
  );
};

const NatalChartWheel: React.FC<{ planets: any[] }> = ({ planets = [] }) => {
  const size = 320;
  const center = size / 2;
  const radius = center - 20;
  const innerRadius = radius - 40;
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const getCoordinates = (deg: number, r: number) => {
    const angle = (deg - 90) * (Math.PI / 180);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative group w-full max-w-[320px] aspect-square">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-[0_0_15px_rgba(242,13,185,0.2)]">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {signs.map((sign, i) => {
            const startAngle = i * 30;
            const endAngle = (i + 1) * 30;
            const start = getCoordinates(startAngle, radius);
            const innerStart = getCoordinates(startAngle, innerRadius);
            const innerEnd = getCoordinates(endAngle, innerRadius);
            return (
              <g key={sign}>
                <line x1={innerStart.x} y1={innerStart.y} x2={start.x} y2={start.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d={`M ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 0 1 ${innerEnd.x} ${innerEnd.y}`} fill="none" stroke="rgba(242,13,185,0.2)" strokeWidth="1" />
              </g>
            );
          })}
          {planets.map((planet, i) => {
            const pos = getCoordinates(planet.degree, innerRadius - 20);
            const labelPos = getCoordinates(planet.degree, innerRadius - 45);
            return (
              <g key={i} className="cursor-help transition-all duration-300 hover:scale-110">
                <title>{planet.name}: {planet.degree}° {planet.sign}</title>
                <line x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="rgba(204,13,242,0.1)" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx={pos.x} cy={pos.y} r="8" fill="#f20db9" className="animate-pulse-slow" />
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="10" className="font-bold pointer-events-none">{planet.name.substring(0, 2)}</text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r="4" fill="white" opacity="0.5" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background-dark/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Natal Map</p>
          <p className="text-xs text-white/60">Western Wheel Layout</p>
        </div>
      </div>
    </div>
  );
};

// UPDATED: Now receives audio controls from parent
const HoroscopeSection: React.FC<{ 
  transitData: TransitData | null, 
  userData: UserData, 
  onOpenChat: (p?: string) => void,
  onPlayAudio: () => void, 
  isPlaying: boolean 
}> = ({ transitData, userData, onOpenChat, onPlayAudio, isPlaying }) => {
  
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
            <div className="space-y-1">
              <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold">Your Daily Guidance</span>
              <h2 className="text-3xl font-bold leading-tight text-white">{transitData.dailyHeadline}</h2>
            </div>
            
            {/* UPDATED: Audio Button connected to App.tsx */}
            <button 
              onClick={onPlayAudio}
              className={`size-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-white scale-110 shadow-[0_0_20px_rgba(242,13,185,0.5)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              title={isPlaying ? "Stop listening" : "Listen to horoscope"}
            >
              <span className="material-symbols-outlined">
                {isPlaying ? 'stop' : 'volume_up'}
              </span>
            </button>
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
    </div>
  );
};

const PulseSection: React.FC<{ transitData: TransitData | null, userData: UserData, onOpenChat: (p?: string) => void }> = ({ transitData, userData, onOpenChat }) => {
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(transitData?.destinyVideoUrl || null);

  const handleGenerateVideo = async () => {
    if (videoUrl || videoLoading) return;
    
    // Check for API key access for Veo model
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume key selection was successful and proceed
    }

    setVideoLoading(true);
    try {
      const url = await generateDestinyVideo(`A celestial manifestation of ${transitData?.dailyHeadline}. Swirling galaxies, ethereal light, and mystical symbols.`);
      if (url) setVideoUrl(url);
    } catch (error) {
      console.error("Video generation failed", error);
    }
    setVideoLoading(false);
  };

  if (!transitData) return (
    <div className="py-20 text-center">
      <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
      <p className="text-white/60">Syncing with current cosmic rhythms...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="text-xs font-bold uppercase tracking-widest">Active Transits</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">Cosmic Alignments</h1>
      </header>
      
      {/* Destiny Video Feature */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark border border-white/10 p-1 group">
        <div className="relative aspect-[9/16] w-full rounded-[2.2rem] overflow-hidden bg-background-dark flex flex-col items-center justify-center text-center p-8">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464802686167-b939a67e06a1?auto=format&fit=crop&q=80&w=800')] opacity-20 grayscale" />
              <div className="relative z-10 space-y-4">
                <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-3xl text-primary">{videoLoading ? 'hourglass_empty' : 'movie'}</span>
                </div>
                <h4 className="text-xl font-bold">Your Destiny Visualization</h4>
                <p className="text-sm text-white/60 px-4">Generate a cinematic visualization of your daily cosmic alignment using Veo.</p>
                <button 
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {videoLoading ? 'Manifesting Video...' : 'Generate Vision'}
                </button>
              </div>
            </>
          )}
          {videoUrl && (
            <div className="absolute bottom-4 left-4 right-4 bg-background-dark/60 backdrop-blur-md p-3 rounded-xl border border-white/10 z-20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Veo AI Vision</p>
              <p className="text-xs text-white/80 line-clamp-1">{transitData.dailyHeadline}</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4">
          {transitData.transits.map((t, i) => (
            <div key={i} className="bg-surface-dark border border-white/5 rounded-2xl p-5 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">{t.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{t.planet}</h4>
                    <p className="text-xs text-primary/80 uppercase font-bold tracking-wider">{t.aspect}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${t.intensity === 'High' ? 'bg-red-500/20 text-red-400' : t.intensity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{t.intensity} Influence</div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">{t.description}</p>
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

// UPDATED: Destructuring new props and passing them down
const AstrologyProfiles: React.FC<ProfileProps> = ({ userData, insight, transitData, onBack, onOpenChat, onReset, onPlayAudio, isPlaying }) => {
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
        {activeTab === 'horoscope' && <HoroscopeSection transitData={transitData} userData={userData} onOpenChat={onOpenChat} onPlayAudio={onPlayAudio} isPlaying={isPlaying} />}
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

const VedicProfile: React.FC<{userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void}> = ({ userData, insight, onOpenChat }) => {
  const nakshatra = insight.technicalDetails?.find((d: any) => d.label.toLowerCase().includes('nakshatra'));
  const yoga = insight.technicalDetails?.find((d: any) => d.label.toLowerCase().includes('yoga') || d.label.toLowerCase().includes('yogam'));
  const rashi = insight.technicalDetails?.find((d: any) => d.label.toLowerCase().includes('rashi') || d.label.toLowerCase().includes('moon sign'));
  const remainingDetails = insight.technicalDetails?.filter((d: any) => d !== nakshatra && d !== yoga && d !== rashi) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{userData.name}'s Janma Kundali</h1>
        
        {/* Celestial Sigil Display */}
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
        
        {/* Core Vedic Markers */}
        <div className="w-full grid grid-cols-1 gap-3 mb-6">
          {nakshatra && (
            <div className="bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Explain the Nakshatra of ${nakshatra.value} in my chart.`)}>
              <div className="flex items-center gap-3 text-left">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white"><span className="material-symbols-outlined">star</span></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Nakshatra</p>
                  <p className="text-lg font-bold text-white">{nakshatra.value}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
            </div>
          )}
          {rashi && (
            <div className="bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-purple-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`What is the meaning of ${rashi.value} Rashi?`)}>
              <div className="flex items-center gap-3 text-left">
                <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">nightlight</span></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Chandra Rashi</p>
                  <p className="text-lg font-bold text-white">{rashi.value}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
            </div>
          )}
          {yoga && (
            <div className="bg-gradient-to-r from-indigo-500/20 to-transparent border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-indigo-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Tell me more about the ${yoga.value} Yogam in my profile.`)}>
              <div className="flex items-center gap-3 text-left">
                <div className="size-10 rounded-full bg-indigo-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">join_inner</span></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Yogam</p>
                  <p className="text-lg font-bold text-white">{yoga.value}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
            </div>
          )}
        </div>

        {/* Other Details */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          {remainingDetails.map((detail: any, i: number) => (
            <button 
              key={i} 
              onClick={() => onOpenChat(`What is the significance of ${detail.label}: ${detail.value}?`)}
              className="flex flex-col p-4 rounded-3xl bg-surface-dark/60 border border-white/10 backdrop-blur-md text-left hover:border-primary transition-all shadow-md active:scale-95"
            >
              <span className="text-white/40 text-[9px] font-bold uppercase mb-1 tracking-widest">{detail.label}</span>
              <h3 className="text-sm text-white font-bold leading-tight">{detail.value}</h3>
            </button>
          ))}
        </div>

        {/* Navamsa Insight */}
        {insight.navamsaInsight && (
          <div className="w-full bg-gradient-to-br from-card-surface to-background-dark border border-white/10 rounded-[2.5rem] p-6 shadow-xl text-left">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">diversity_1</span>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Navamsa (D9) Soul Insight</h4>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-medium mb-4 italic">"{insight.navamsaInsight}"</p>
            <button 
              onClick={() => onOpenChat(`I want a deep dive into my Navamsa chart. You mentioned: ${insight.navamsaInsight}`)}
              className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
            >
              Explore soul purpose <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const KabbalisticProfile: React.FC<{userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void}> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="flex flex-col items-center text-center pt-4">
      <div className="relative mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-40"></div>
        <div className="relative h-32 w-32 rounded-full border-2 border-background-dark shadow-2xl bg-cover overflow-hidden bg-background-dark">
          {insight.sigilUrl ? (
            <img src={insight.sigilUrl} className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[url('https://picsum.photos/id/64/300/300')] bg-cover" />
          )}
        </div>
        <div className="absolute bottom-1 right-1 bg-surface-dark border border-white/10 p-2 rounded-full shadow-lg">
          <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
        </div>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{userData.name}'s Soul Blueprint</h1>
      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => onOpenChat(`Tell me more about my Kabbalistic Root.`)}
          className="px-4 py-1.5 rounded-full bg-surface-dark border border-white/10 text-xs font-bold text-primary hover:bg-primary/10 transition-colors shadow-sm"
        >
          Root: {insight.technicalDetails?.[0]?.value || 'Chesed'}
        </button>
      </div>
      <p className="text-slate-400 text-sm max-w-[85%] mt-4 leading-relaxed font-medium">{insight.summary}</p>
    </div>
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-1">Active Sefirot</h2>
      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-6 -mx-4 px-4">
        {insight.activeSefirotOrNodes?.map((node: any, i: number) => (
          <div key={i} className="shrink-0 w-[280px] bg-card-surface/60 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">{node.name}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{node.meaning}</p>
            </div>
            <button 
              onClick={() => onOpenChat(`Explain the Sefirot of ${node.name}.`)}
              className="text-primary text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors text-left"
            >
              Deep Interpret →
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HellenisticProfile: React.FC<{userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void}> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark shadow-2xl border border-white/5">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay">
        {insight.sigilUrl ? <img src={insight.sigilUrl} className="size-full object-cover" /> : <div className="size-full bg-[url('https://picsum.photos/id/160/800/800')] bg-cover" />}
      </div>
      <div className="relative z-10 flex flex-col p-8 gap-4">
        <div className="flex items-center justify-between">
          <div className="rounded-2xl bg-indigo-900/50 p-4 ring-1 ring-white/20 backdrop-blur-md shadow-inner"><span className="material-symbols-outlined text-3xl text-indigo-300">bedtime</span></div>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md border border-white/10">Night Sect</span>
        </div>
        <h3 className="text-2xl font-bold text-white mt-2">{userData.name}'s Nocturnal Chart</h3>
        <p className="text-[#cb90bc] text-sm leading-relaxed font-medium">{insight.summary}</p>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase text-[#cb90bc] tracking-[0.2em] px-1">Chart Ruler</h3>
      <button 
        onClick={() => onOpenChat(`My Hellenistic chart ruler is ${insight.archetype}.`)}
        className="flex w-full items-center gap-5 rounded-3xl bg-surface-dark p-6 shadow-xl ring-1 ring-white/5 hover:ring-primary/50 transition-all text-left active:scale-95"
      >
        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-lg"><span className="material-symbols-outlined text-3xl">flare</span></div>
        <div className="flex-1">
          <p className="text-xl font-bold text-white">{insight.archetype}</p>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Dominant Placement</p>
        </div>
      </button>
    </div>
  </div>
);

const IslamicProfile: React.FC<{userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void}> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-6">
    <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-surface-dark to-[#451d3b] border border-white/5 shadow-2xl">
      <div className="h-56 bg-cover bg-center opacity-60 overflow-hidden">
        {insight.sigilUrl ? <img src={insight.sigilUrl} className="size-full object-cover" /> : <div className="size-full bg-[url('https://picsum.photos/id/180/800/800')] bg-cover" />}
      </div>
      <div className="absolute bottom-6 left-6 pr-6">
        <h3 className="text-white text-3xl font-bold mb-2">{userData.name}'s Horoscope</h3>
        <div className="flex gap-2">
          <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">{insight.archetype}</span>
        </div>
      </div>
      <div className="p-8">
        <p className="text-white/80 text-base leading-relaxed mb-6 font-medium italic">"{insight.summary}"</p>
        <button 
          onClick={() => onOpenChat(`In my Islamic horoscope, my archetype is ${insight.archetype}.`)}
          className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-all"
        >
          Spiritual Deep Dive →
        </button>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-white text-lg font-bold px-1">The Lots (Arabic Parts)</h3>
      <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-4 px-4 pb-4">
        {insight.technicalDetails?.map((lot: any, i: number) => (
          <button 
            key={i} 
            onClick={() => onOpenChat(`Tell me more about the Part of ${lot.label}.`)}
            className="shrink-0 w-44 p-4 bg-surface-dark/60 backdrop-blur-sm border border-white/5 rounded-3xl hover:border-primary transition-all text-left shadow-lg active:scale-95"
          >
             <div className="w-full aspect-square bg-primary/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><span className="material-symbols-outlined text-4xl text-primary">{lot.icon}</span></div>
             <p className="text-white text-sm font-bold mb-1">{lot.label}</p>
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{lot.value}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const StandardProfile: React.FC<{userData: UserData, insight: InsightData, onOpenChat: (p?: string) => void}> = ({ userData, insight, onOpenChat }) => (
  <div className="space-y-8">
    <div className="text-center px-4">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">{userData.name}'s {userData.system} Chart</h1>
      
      {insight.sigilUrl && (
        <div className="relative size-56 mx-auto my-8 group">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-[40px] group-hover:blur-[60px] transition-all" />
          <img src={insight.sigilUrl} className="relative size-full rounded-[2.5rem] object-cover border-2 border-primary/30 shadow-2xl" />
        </div>
      )}

      <p className="text-xl text-primary font-bold mb-8 uppercase tracking-[0.1em]">{insight.archetype}</p>
      <div className="bg-surface-dark/80 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-md">
        <p className="text-lg leading-relaxed text-white/80 mb-6 font-medium">{insight.summary}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {insight.technicalDetails?.map((detail: any, i: number) => (
        <button 
          key={i} 
          onClick={() => onOpenChat(`What does it mean for ${detail.label} to be at ${detail.value}?`)}
          className="flex items-center gap-5 bg-surface-dark p-6 rounded-3xl border border-white/5 shadow-xl hover:border-primary/50 transition-all text-left active:scale-95 group"
        >
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-2xl">{detail.icon}</span></div>
          <div><p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{detail.label}</p><p className="text-lg font-bold text-white leading-none">{detail.value}</p></div>
        </button>
      ))}
    </div>
  </div>
);

export default AstrologyProfiles;