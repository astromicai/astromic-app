
export enum AstrologySystem {
  WESTERN = 'Western',
  VEDIC = 'Indian Vedic',
  CHINESE = 'Chinese',
  TIBETAN = 'Tibetan',
  HELLENISTIC = 'Hellenistic',
  ISLAMIC = 'Islamic',
  KABBALISTIC = 'Kabbalistic',
}

export interface UserData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  language: string;
  focusAreas: string[];
  system: AstrologySystem;
}

export interface TransitItem {
  planet: string;
  aspect: string;
  intensity: 'Low' | 'Medium' | 'High';
  description: string;
  icon: string;
}

export interface TransitData {
  dailyHeadline: string;
  weeklySummary: string;
  dailyHoroscope: string;
  dailyAdvice: string[];
  mood: string;
  luckyNumber: string;
  luckyColor: string;
  transits: TransitItem[];
  progressions: {
    title: string;
    insight: string;
  }[];
  destinyVideoUrl?: string;
}

export interface InsightData {
  headline: string;
  archetype: string;
  summary: string;
  technicalDetails: any[];
  chartData: {
    planets: any[];
  };
  navamsaInsight?: string;
  activeSefirotOrNodes?: any[];
  sigilUrl?: string;
}

export type AppStep = 
  | 'HERO'
  | 'NAME_INPUT'
  | 'LANGUAGE_SELECT'
  | 'BIRTH_DATE'
  | 'BIRTH_PLACE'
  | 'BIRTH_TIME'
  | 'FOCUS_AREAS'
  | 'SYSTEM_SELECT'
  | 'REVIEW'
  | 'PROFILE_DISPLAY';
