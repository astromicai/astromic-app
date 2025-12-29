
import React, { useState, useEffect } from 'react';
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
  setUserData: React.Dispatch<React.SetStateAction<UserData>>; // Passed directly for atomic updates
  onNext: () => void;
  onPrev: () => void;
  displayName: string;
}> = ({ userData, setUserData, onNext, onPrev, displayName }) => {
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
    const updates = {
      birthPlace: `${loc.name}, ${loc.country}`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      timezone: loc.timezone || "UTC"
    };
    // Atomic update
    setUserData((prev: UserData) => ({ ...prev, ...updates }));
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
          placeholder="Type your birth city..."
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
  const [isManual, setIsManual] = useState(false);

  const [email, setEmail] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [ipData, setIpData] = useState<any>({
    ip: '',
    city: '',
    country: '',
    platform: navigator.platform || 'Unknown Device'
  });

  // Fetch IP Data for Waitlist (Replicating tachyon-space logic)
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const resp = await fetch('https://ipapi.co/json/');
        if (!resp.ok) throw new Error('IPAPI failed');
        const data = await resp.json();
        setIpData({
          ip: data.ip || 'Unknown',
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          platform: navigator.platform || 'Unknown Device'
        });
      } catch (e) {
        // Fallback or retry logic could go here, for now simpler is better for React
        try {
          const resp2 = await fetch('https://ipwho.is/');
          const data2 = await resp2.json();
          setIpData({
            ip: data2.ip || 'Unknown',
            city: data2.city || 'Unknown',
            country: data2.country || 'Unknown',
            platform: navigator.platform || 'Unknown Device'
          });
        } catch (err) {
          console.error("IP Fetch failed", err);
        }
      }
    };
    fetchIP();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('sending');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('ip', ipData.ip);
    formData.append('city', ipData.city);
    formData.append('country', ipData.country);
    formData.append('platform', ipData.platform);
    formData.append('date', new Date().toLocaleDateString('en-CA'));
    formData.append('time', new Date().toLocaleTimeString('en-US', { hour12: true }));

    try {
      await fetch("https://script.google.com/macros/s/AKfycbzcO29ERwEyDRUZf95TBzIfSA4X5XdPSFvrjloE5q34sNKIFSgjRL1tmR6UC0hDrlr5/exec", {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
      setSubmissionStatus('success');
      setEmail("");
    } catch (error) {
      console.error("Waitlist error", error);
      setSubmissionStatus('error');
    }
  };

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
      <div className="flex-1 flex flex-col justify-between items-center px-6 py-8">

        {/* Back to Home Button - Fixed to prevent merge */}
        <div className="fixed top-6 left-6 z-50">
          <a
            href="https://astromic.ai"
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/30 border border-white/10 hover:bg-white/20 transition-all group backdrop-blur-md shadow-lg hover:shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-xs font-bold tracking-widest uppercase">Back to Home</span>
          </a>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full mt-10 md:mt-0"> {/* Added top margin for mobile spacing */}
          <div className="w-full max-w-[540px] aspect-square relative mb-4 flex items-center justify-center">
            {/* New Hero Image with Float Animation */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated SVG Background (Internal Rotation) */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src="/hero_ai_globe_logo.svg"
                  alt="Zodiac Aether Wheel"
                  className="w-full h-full object-contain opacity-100" // Increased opacity
                />
              </div>

              {/* Floating Robot - Centered & Larger to cover Center */}
              <div className="relative w-[32%] h-[55%] z-10 animate-float translate-y-2"> {/* Tweaked size/pos */}
                <img
                  src="/hero_robot_center.png"
                  alt="AI Android Astrologer"
                  className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]"
                />
              </div>
            </div>
          </div>

          <h1 className="text-white tracking-tighter text-[64px] font-bold leading-none mb-4 drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] text-center font-display">
            Astromic
          </h1>
          <p className="text-white/80 text-xl font-normal leading-relaxed px-4 text-center max-w-[360px] font-display">
            Unveil your cosmic blueprint. Personalized <span className="text-primary font-bold">AI Astrology</span> for the modern seeker.
          </p>

        </div>

        <div className="w-full flex flex-col items-center gap-6 mt-4 mb-24"> {/* Added margin bottom for footer space */}
          <div className="w-full space-y-3">
            <button
              onClick={onNext}
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl h-16 px-8 bg-gradient-to-r from-primary to-primary-alt text-white text-[18px] font-bold tracking-widest uppercase shadow-[0_10px_40px_rgba(242,13,185,0.5)] transition-all active:scale-95 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(242,13,185,0.7)]"
            >
              <span>Begin Your Journey</span>
              <span className="material-symbols-outlined ml-3 text-[24px]">auto_awesome</span>
            </button>
          </div>

          {/* Waitlist Widget (Moved Below CTA) */}
          <div className="w-full max-w-[340px] bg-card-surface/50 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl z-40">

            <p className="text-sm text-white/90 leading-relaxed mb-3 font-medium text-center">
              ✨ We are enabling subscriptions soon.<br />
              Join the waitlist for your <strong className="text-primary font-bold">First Year Free</strong>:
            </p>

            {submissionStatus === 'success' ? (
              <div className="text-center py-4 animate-in fade-in zoom-in">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-primary font-bold">You are on the list!</p>
                <p className="text-xs text-white/60">Watch your inbox for early access.</p>
              </div>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={handleWaitlistSubmit}
              >
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..."
                    required
                    disabled={submissionStatus === 'sending'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={submissionStatus === 'sending'}
                    className="bg-primary hover:bg-primary-alt text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors whitespace-nowrap shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submissionStatus === 'sending' ? '...' : 'Join'}
                  </button>
                </div>
                {submissionStatus === 'error' && <p className="text-red-400 text-[10px] text-center">Something went wrong. Please try again.</p>}
              </form>
            )}

            {submissionStatus !== 'success' && (
              <p className="text-[10px] text-white/40 mt-2 text-center">Secure your free early-bird account now.</p>
            )}
          </div>
        </div>

        {/* Footer - Powered By AIworkX */}
        <div className="fixed bottom-4 left-0 w-full flex items-center justify-center gap-2 z-50 pointer-events-none">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <span className="text-white/60 text-[10px] font-medium tracking-wider uppercase">Powered by</span>
            <a href="https://aiworkx.com" target="_blank" rel="noopener noreferrer" className="text-white text-[11px] font-bold tracking-widest uppercase hover:text-primary transition-colors">
              AIworkX.com
            </a>
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


    // Helper to parse date manually to avoid Timezone off-by-one errors
    const parseDate = (dateStr: string) => {
      if (!dateStr) return { day: '1', month: '0', year: '2000' };

      // Try parsing YYYY-MM-DD directly
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = (parseInt(parts[1], 10) - 1).toString(); // 0-indexed for state
        const d = parseInt(parts[2], 10).toString();
        return { year: y, month: m, day: d };
      }

      // Fallback to Date object if format is weird, but try to use UTC
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '1', month: '0', year: '2000' };
      return {
        day: d.getUTCDate().toString(),
        month: d.getUTCMonth().toString(),
        year: d.getUTCFullYear().toString()
      };
    };

    const { day, month, year } = parseDate(userData.birthDate);

    const updateDate = (d: string, m: string, y: string) => {
      // Construct YYYY-MM-DD
      const monthNum = parseInt(m) + 1;
      const monthStr = monthNum.toString().padStart(2, '0');
      const dayStr = d.padStart(2, '0');
      updateField('birthDate', `${y}-${monthStr}-${dayStr}`);
    };

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

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

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsManual(!isManual)}
            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            {isManual ? "Switch to Selection" : "Type Date Manually"}
          </button>
        </div>

        {isManual ? (
          <div className="w-full glass-panel rounded-2xl p-6 mb-6 flex flex-col items-center justify-center border border-white/10 shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95">
            <label className="text-white/50 text-xs font-bold mb-2 uppercase tracking-widest">Type Date</label>
            <input
              type="date"
              className="bg-transparent border-none text-white text-3xl font-bold tracking-widest focus:ring-0 w-full text-center cursor-pointer appearance-none"
              style={{ colorScheme: 'dark' }}
              value={userData.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
            />
          </div>
        ) : (
          <div className="w-full flex gap-2 mb-6 animate-in fade-in zoom-in-95">
            {/* Month */}
            <div className="flex-[2] relative">
              <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">Month</label>
              <select
                value={month}
                onChange={(e) => updateDate(day, e.target.value, year)}
                className="w-full h-14 bg-white/10 border border-white/10 rounded-xl px-3 text-lg font-bold text-white appearance-none focus:border-primary outline-none"
              >
                {months.map((mName, i) => (
                  <option key={i} value={i} className="text-black">{mName}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div className="flex-1 relative">
              <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">Day</label>
              <select
                value={day}
                onChange={(e) => updateDate(e.target.value, month, year)}
                className="w-full h-14 bg-white/10 border border-white/10 rounded-xl px-3 text-lg font-bold text-white appearance-none focus:border-primary outline-none text-center"
              >
                {days.map(dVal => (
                  <option key={dVal} value={dVal} className="text-black">{dVal}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex-[1.5] relative">
              <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">Year</label>
              <select
                value={year}
                onChange={(e) => updateDate(day, month, e.target.value)}
                className="w-full h-14 bg-white/10 border border-white/10 rounded-xl px-3 text-lg font-bold text-white appearance-none focus:border-primary outline-none text-center"
              >
                {years.map(yVal => (
                  <option key={yVal} value={yVal} className="text-black">{yVal}</option>
                ))}
              </select>
            </div>
          </div>
        )}

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
        setUserData={setUserData}
        onNext={onNext}
        onPrev={onPrev}
        displayName={displayName}
      />
    );
  }

  if (step === 'BIRTH_TIME') {
    // Parse existing time or default
    const parseTime = (str: string) => {
      if (!str) return { h: '12', m: '00', p: 'PM' };
      const parts = str.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (parts) return { h: parts[1], m: parts[2], p: parts[3].toUpperCase() };
      return { h: '12', m: '00', p: 'PM' };
    };

    const { h, m, p } = parseTime(userData.birthTime);

    const updateTime = (newH: string, newM: string, newP: string) => {
      updateField('birthTime', `${newH}:${newM} ${newP}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 5 min steps
    // Or full 60? 5 min is usually better for mobile UX unless precise birth time is critical (it is for astrology)
    // Let's do full 60 or simplified? User said "select the drop down".
    // 00-59 is a lot for a dropdown. Let's do 00-59.
    const allMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

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

        <div className="relative w-full mb-10 flex gap-2">
          <div className="flex-1 relative">
            <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">Hour</label>
            <select
              value={h}
              onChange={(e) => updateTime(e.target.value, m, p)}
              className="w-full h-16 bg-white/10 border border-white/10 rounded-2xl px-4 text-2xl font-bold text-white appearance-none focus:border-primary outline-none text-center"
            >
              {hours.map(hour => <option key={hour} value={hour} className="text-black">{hour}</option>)}
            </select>
          </div>

          <div className="flex items-end pb-5 text-2xl font-bold">:</div>

          <div className="flex-1 relative">
            <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">Minute</label>
            <select
              value={m}
              onChange={(e) => updateTime(h, e.target.value, p)}
              className="w-full h-16 bg-white/10 border border-white/10 rounded-2xl px-4 text-2xl font-bold text-white appearance-none focus:border-primary outline-none text-center"
            >
              {allMinutes.map(min => <option key={min} value={min} className="text-black">{min}</option>)}
            </select>
          </div>

          <div className="flex-1 relative">
            <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block pl-2">AM/PM</label>
            <select
              value={p}
              onChange={(e) => updateTime(h, m, e.target.value)}
              className="w-full h-16 bg-white/10 border border-white/10 rounded-2xl px-4 text-2xl font-bold text-white appearance-none focus:border-primary outline-none text-center"
            >
              <option value="AM" className="text-black">AM</option>
              <option value="PM" className="text-black">PM</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/5 text-center">
            <span className="block text-xs text-white/40 uppercase tracking-widest mb-1">Preview</span>
            <span className="text-xl font-bold text-primary">{userData.birthTime}</span>
          </div>
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
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">public</span><span className="text-xs text-white/50">{userData.latitude?.toFixed(4)}, {userData.longitude?.toFixed(4)} ({userData.timezone})</span></div>
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
