
import React, { useState } from 'react';
import { AppStep, UserData, AstrologySystem } from '../types';

interface OnboardingProps {
  step: AppStep;
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  loading: boolean;
}

const SYSTEM_INFOS: Record<AstrologySystem, string> = {
  [AstrologySystem.WESTERN]: "The modern standard. Tropical zodiac focused on psychological archetypes and personality evolution.",
  [AstrologySystem.VEDIC]: "Ancient Indian Jyotish. Uses the Sidereal zodiac to map karma, destiny, and precise life timings.",
  [AstrologySystem.CHINESE]: "Based on the lunar calendar, 12-year animal cycles, and the five elements of nature.",
  [AstrologySystem.TIBETAN]: "A unique fusion of Buddhist philosophy, Indian mathematics, and Chinese elemental principles.",
  [AstrologySystem.HELLENISTIC]: "The root of Western astrology. Uses ancient techniques like Sect and Lots from Mediterranean antiquity.",
  [AstrologySystem.ISLAMIC]: "Arabic traditions that preserved Greek wisdom, famous for mathematical 'Lots' and mathematical precision.",
  [AstrologySystem.KABBALISTIC]: "Jewish mystical astrology linked to the Sefirot and the Hebrew alphabet to reveal soul root paths.",
};

// Extracted component for location search to adhere to Rules of Hooks
const LocationStep: React.FC<{
  userData: UserData;
  updateField: (field: keyof UserData, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  displayName: string;
}> = ({ userData, updateField, onNext, onPrev, displayName }) => {
  const [searchTerm, setSearchTerm] = useState(userData.birthPlace || "");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchLocation = async (query: string) => {
    setSearchTerm(query);
    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await response.json();
      if (data.results) {
        setResults(data.results);
        setShowDropdown(true);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (loc: any) => {
    setSearchTerm(`${loc.name}, ${loc.country}`);
    updateField('birthPlace', `${loc.name}, ${loc.country}`);
    updateField('latitude', loc.latitude);
    updateField('longitude', loc.longitude);
    updateField('timezone', loc.timezone);
    setShowDropdown(false);
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-[20]">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full active:bg-white/10">
          <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
        </button>
        <div className="flex gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-8 rounded-full bg-primary" />
        </div>
        <div className="w-12" />
      </header>
      <div className="mb-10">
        <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight mb-4">Where did your journey begin, {displayName}?</h1>
        <p className="text-white/60 text-base">Select precise location for accurate astronomical calculations.</p>
      </div>
      <div className="relative w-full mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <input
          type="text"
          className="w-full bg-white/10 border-2 border-white/10 focus:border-primary text-white placeholder-white/30 text-xl rounded-2xl py-5 pl-12 pr-4 shadow-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder="Search City..."
          value={searchTerm}
          onChange={(e) => searchLocation(e.target.value)}
          autoComplete="off"
        />
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-surface-dark border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            {results.map((loc: any) => (
              <button
                key={loc.id}
                onClick={() => selectLocation(loc)}
                className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 flex items-center justify-between group transition-colors"
              >
                <div>
                  <p className="text-white font-bold">{loc.name}</p>
                  <p className="text-xs text-white/50">{loc.admin1}, {loc.country}</p>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full font-mono">{loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto">
        <button
          disabled={!userData.latitude}
          onClick={onNext}
          className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale"
        >
          Continue
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

const OnboardingSteps: React.FC<OnboardingProps> = ({
  step, userData, setUserData, onNext, onPrev, onFinish, loading
}) => {
  const [activeTooltip, setActiveTooltip] = useState<AstrologySystem | null>(null);

  const updateField = (field: keyof UserData, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (area: string) => {
    const current = userData.focusAreas;
    if (current.includes(area)) {
      updateField('focusAreas', current.filter(a => a !== area));
    } else {
      updateField('focusAreas', [...current, area]);
    }
  };

  const displayName = userData.name || "Seeker";

  if (step === 'HERO') {
    return (
      <div className="flex-1 flex flex-col justify-between items-center px-6 py-12">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[340px] aspect-square relative mb-12 flex items-center justify-center group">
            <div className="absolute inset-[-10px] rounded-full bg-primary/20 blur-[40px] animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-pulse-slow"></div>
            <div className="absolute inset-[-30px] rounded-full border border-primary/10 animate-spin-slow"></div>
            <div className="absolute inset-[-60px] rounded-full border border-white/5 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }}></div>

            <div className="relative w-[95%] h-[95%] rounded-full overflow-hidden shadow-[0_0_100px_rgba(242,13,185,0.5)] border-2 border-white/20 z-10 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1635107510862-538861928272?auto=format&fit=crop&q=80&w=800&h=800')" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark/60 via-transparent to-primary/20"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,13,185,0.3)_0%,transparent_70%)]"></div>
            </div>

            <div className="absolute top-0 right-2 z-20 bg-primary border border-white/30 p-4 rounded-full shadow-[0_0_30px_rgba(242,13,185,0.8)] transform rotate-12 animate-bounce">
              <span className="material-symbols-outlined text-white text-3xl">psychology</span>
            </div>

            <div className="absolute bottom-4 left-0 z-20 bg-background-dark/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl transform -rotate-12">
              <span className="material-symbols-outlined text-primary-alt text-2xl">star</span>
            </div>
          </div>

          <h1 className="text-white tracking-tighter text-[64px] font-bold leading-none mb-4 drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] text-center font-display">
            Astromic
          </h1>
          <p className="text-white/80 text-xl font-normal leading-relaxed px-4 text-center max-w-[360px] font-display">
            Unveil your cosmic blueprint. Personalized <span className="text-primary font-bold">AI Astrology</span> for the modern seeker.
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-2 group cursor-default">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40"></div>
              <p className="text-[#c190cb] text-sm font-bold tracking-[0.2em] uppercase transition-all group-hover:tracking-[0.3em]">Powered by AIworkX</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40"></div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={onNext}
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl h-16 px-8 bg-gradient-to-r from-primary to-primary-alt text-white text-[18px] font-bold tracking-widest uppercase shadow-[0_10px_40px_rgba(242,13,185,0.5)] transition-all active:scale-95 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(242,13,185,0.7)]"
            >
              <span>Begin Your Journey</span>
              <span className="material-symbols-outlined ml-3 text-[24px]">auto_awesome</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'NAME_INPUT') {
    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-[20]">
        <header className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full active:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-2">
            <div className="h-1.5 w-8 rounded-full bg-primary" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </div>
          <div className="w-12" /> {/* Spacer instead of link */}
        </header>
        <div className="mb-10">
          <h1 className="text-white text-[36px] font-bold leading-tight tracking-tight mb-4">
            First, what is<br />your name?
          </h1>
          <p className="text-white/60 text-base">The stars know you, but we'd love to greet you properly.</p>
        </div>
        <div className="relative w-full">
          <input
            type="text"
            className="w-full bg-white/5 border-b-2 border-primary/40 focus:border-primary text-white text-3xl font-bold py-4 px-2 shadow-none focus:ring-0 outline-none transition-all placeholder:text-white/5"
            placeholder="Enter your name"
            value={userData.name}
            onChange={(e) => updateField('name', e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="mt-auto">
          <button
            disabled={!userData.name.trim()}
            onClick={onNext}
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'LANGUAGE_SELECT') {
    const languages = [
      "English", "Spanish", "French", "German", "Chinese", "Japanese",
      "Hindi", "Arabic", "Portuguese", "Russian", "Tamil", "Telugu",
      "Bengali", "Indonesian", "Italian", "Turkish", "Korean", "Vietnamese"
    ];
    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-[20]">
        <header className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full active:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            <div className="h-1.5 w-8 rounded-full bg-primary" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </div>
          <div className="w-12" />
        </header>
        <div className="mb-8">
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-4">
            Choose your<br />language
          </h1>
          <p className="text-white/60 text-base">For your daily predictions and insights.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto no-scrollbar max-h-[400px]">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => updateField('language', lang)}
              className={`py-4 rounded-2xl font-bold transition-all border ${userData.language === lang ? 'bg-primary border-primary shadow-lg scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              {lang}
            </button>
          ))}
          <div className="col-span-2 mt-2">
            <input
              type="text"
              placeholder="Other language..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:border-primary outline-none transition-all"
              value={!languages.includes(userData.language) ? userData.language : ''}
              onChange={(e) => updateField('language', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-auto">
          <button onClick={onNext} className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group">
            Continue
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'BIRTH_DATE') {
    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-[20]">
        <header className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full active:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            <div className="h-1.5 w-8 rounded-full bg-primary" />
          </div>
          <div className="w-12" />
        </header>
        <div className="mb-10">
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-4">
            Greetings, {displayName}.<br />When were you born?
          </h1>
          <p className="text-white/60 text-base">Your birth date is the root of your cosmic tree.</p>
        </div>
        <div className="w-full glass-panel rounded-2xl p-6 mb-6 flex flex-col items-center justify-center border border-white/10 shadow-lg relative overflow-hidden">
          <label className="text-white/50 text-xs font-bold mb-2 uppercase tracking-widest">Select Date</label>
          <input
            type="date"
            className="bg-transparent border-none text-white text-3xl font-bold tracking-widest focus:ring-0 w-full text-center cursor-pointer appearance-none"
            style={{ colorScheme: 'dark' }}
            value={userData.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
          />
        </div>
        <div className="mt-auto">
          <button onClick={onNext} className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
            Continue
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'BIRTH_PLACE') {
    return (
      <LocationStep
        userData={userData}
        updateField={updateField}
        onNext={onNext}
        onPrev={onPrev}
        displayName={displayName}
      />
    );
  }

  if (step === 'BIRTH_TIME') {
    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 relative z-[20]">
        <header className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full active:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-2">
            <div className="h-1.5 w-2 rounded-full bg-primary/30" />
            <div className="h-1.5 w-2 rounded-full bg-primary/30" />
            <div className="h-1.5 w-8 rounded-full bg-primary" />
          </div>
          <div className="w-12" />
        </header>
        <div className="mb-10">
          <h1 className="text-white tracking-tight text-[36px] font-bold leading-tight mb-4">What was the time <br />of birth?</h1>
          <p className="text-white/60 text-base">Crucial for your Rising Sign, {displayName}.</p>
        </div>
        <div className="relative w-full mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <input
            type="text"
            className="w-full bg-white/10 border-2 border-white/10 focus:border-primary text-white text-2xl font-bold py-5 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="e.g. 10:30 PM"
            value={userData.birthTime}
            onChange={(e) => updateField('birthTime', e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="mt-auto">
          <button
            disabled={!userData.birthTime.trim()}
            onClick={onNext}
            className="w-full bg-primary text-white font-bold text-lg h-14 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'FOCUS_AREAS') {
    const areas = [
      { id: 'Love', icon: 'favorite' },
      { id: 'Career', icon: 'work' },
      { id: 'Money', icon: 'paid' },
      { id: 'Health', icon: 'spa' },
      { id: 'Family', icon: 'home' },
      { id: 'Studies', icon: 'school' },
      { id: 'Travel', icon: 'flight' },
      { id: 'Spirituality', icon: 'auto_awesome' },
    ];
    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-24 relative z-[20]">
        <nav className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white/80"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="flex gap-4 items-center">
            <button onClick={onNext} className="text-[#ad90cb] font-bold uppercase text-sm">Skip</button>
          </div>
        </nav>
        <header className="mb-8">
          <h1 className="text-white tracking-tight text-[40px] font-bold leading-tight mb-4">
            Focus Your <br /><span className="text-primary/80">Energy</span>
          </h1>
          <p className="text-white/70 text-lg">Select the areas where you seek the most clarity, {displayName}.</p>
        </header>
        <div className="flex flex-wrap gap-3">
          {areas.map(area => {
            const isSelected = userData.focusAreas.includes(area.id);
            return (
              <button
                key={area.id}
                onClick={() => toggleFocusArea(area.id)}
                className={`flex items-center gap-x-2 rounded-full border py-3 pl-4 pr-6 transition-all ${isSelected ? 'border-primary bg-primary text-white' : 'border-transparent bg-surface-dark text-white/80 hover:bg-surface-dark/80'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{area.icon}</span>
                <p className="text-base font-medium">{area.id}</p>
              </button>
            );
          })}
        </div>
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent">
          <button onClick={onNext} className="w-full flex items-center justify-center rounded-full h-14 bg-primary text-white text-lg font-bold shadow-lg">
            Reveal My Path
            <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'SYSTEM_SELECT') {
    const systems = [
      { id: AstrologySystem.WESTERN, icon: 'wb_sunny' },
      { id: AstrologySystem.VEDIC, icon: 'auto_awesome' },
      { id: AstrologySystem.CHINESE, icon: 'cruelty_free' },
      { id: AstrologySystem.TIBETAN, icon: 'self_improvement' },
      { id: AstrologySystem.HELLENISTIC, icon: 'account_balance' },
      { id: AstrologySystem.ISLAMIC, icon: 'nightlight' },
      { id: AstrologySystem.KABBALISTIC, icon: 'flare' },
    ];

    return (
      <div className="flex-1 flex flex-col px-6 pt-10 pb-24 relative z-[20]">
        <header className="flex items-center justify-between mb-8">
          <button onClick={onPrev} className="text-white"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="w-8" />
        </header>
        <h1 className="text-3xl font-bold text-center mb-3">Astrology System</h1>
        <p className="text-white/60 text-center mb-8">Which ancient wisdom calls to you, {displayName}?</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {systems.map(sys => {
            const isSelected = userData.system === sys.id;
            return (
              <div key={sys.id} className="relative">
                <button
                  onClick={() => updateField('system', sys.id)}
                  className={`relative flex w-full h-14 items-center justify-center gap-2 rounded-full transition-all active:scale-95 ${isSelected ? 'bg-primary border border-primary shadow-lg' : 'bg-surface-dark/50 border border-white/10 hover:border-primary/50'}`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isSelected ? 'text-white' : 'text-white/50'}`}>{sys.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>{sys.id}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(activeTooltip === sys.id ? null : sys.id);
                  }}
                  className={`absolute -top-1 -right-1 size-6 rounded-full border flex items-center justify-center transition-all ${activeTooltip === sys.id ? 'bg-primary border-white/50 shadow-lg' : 'bg-white/10 border-white/20 text-white/40'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">info</span>
                </button>
                {activeTooltip === sys.id && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 p-3 bg-card-surface border border-primary/30 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                      {SYSTEM_INFOS[sys.id]}
                    </p>
                    <button
                      onClick={() => setActiveTooltip(null)}
                      className="mt-2 text-[9px] uppercase font-bold text-primary"
                    >
                      Got it
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 w-full p-4 pb-8 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent">
          <button onClick={onNext} className="w-full flex items-center justify-center rounded-full h-14 bg-primary text-white font-bold text-lg shadow-lg">
            Start Journey
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'REVIEW') {
    return (
      <div className="flex-1 flex flex-col px-4 pt-4 pb-32 relative z-[20]">
        <header className="sticky top-0 z-50 flex items-center bg-background-dark/90 backdrop-blur-md p-4 mb-4 justify-between">
          <button onClick={onPrev} className="text-white flex size-12 items-center justify-center rounded-full"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h2 className="text-white text-lg font-bold flex-1 text-center pr-12">Confirm Details</h2>
        </header>
        <div className="mb-6 px-4"><h3 className="text-white text-[28px] font-bold">Ready, {displayName}?</h3></div>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group border border-white/5 bg-surface-dark mx-auto max-w-[90%]">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-primary text-xs font-bold uppercase mb-1">Birth Profile</p>
                <p className="text-white text-3xl font-bold break-words">{displayName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">language</span><span className="text-lg">{userData.language}</span></div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">calendar_month</span><span className="text-lg">{userData.birthDate}</span></div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">schedule</span><span className="text-lg">{userData.birthTime}</span></div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">location_on</span><span className="text-lg">{userData.birthPlace}</span></div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pt-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent">
          <button disabled={loading} onClick={onFinish} className="w-full max-w-md mx-auto bg-primary text-white font-bold text-lg h-14 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            {loading ? 'Consulting the stars...' : 'Generate My Chart'}
            {!loading && <span className="material-symbols-outlined">auto_awesome</span>}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingSteps;
