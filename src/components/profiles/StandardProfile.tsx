import React from 'react';
import { UserData, InsightData } from '../../types';

interface ProfileProps {
    userData: UserData;
    insight: InsightData;
    onOpenChat: (p?: string) => void;
}

const StandardProfile: React.FC<ProfileProps> = ({ userData, insight, onOpenChat }) => (
    <div className="space-y-8">
        <div className="text-center px-4">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">{userData.name}'s {userData.system} Chart</h1>

            <p className="text-xl text-primary font-bold mb-8 uppercase tracking-[0.1em]">{insight.archetype}</p>
            <div className="bg-surface-dark/80 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-md"><p className="text-lg leading-relaxed text-white/80 mb-6 font-medium">{insight.summary}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {insight.technicalDetails && insight.technicalDetails.length > 0 ? (
                insight.technicalDetails.map((detail, i: number) => (
                    <button key={i} onClick={() => onOpenChat(`What does it mean for ${detail.label} to be at ${detail.value}?`)} className="flex items-center gap-5 bg-surface-dark p-6 rounded-3xl border border-white/5 shadow-xl hover:border-primary/50 transition-all text-left active:scale-95 group">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-2xl">{detail.icon}</span></div>
                        <div><p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{detail.label}</p><p className="text-lg font-bold text-white leading-none">{detail.value}</p></div>
                    </button>
                ))
            ) : (
                <div className="col-span-2 text-center text-white/40 py-8">Planetary details are aligning...</div>
            )}
        </div>
    </div>
);

export default StandardProfile;

