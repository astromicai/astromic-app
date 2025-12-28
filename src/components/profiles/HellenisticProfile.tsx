import React from 'react';
import { UserData, InsightData } from '../../types';

interface ProfileProps {
    userData: UserData;
    insight: InsightData;
    onOpenChat: (p?: string) => void;
}

const HellenisticProfile: React.FC<ProfileProps> = ({ userData, insight, onOpenChat }) => (
    <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-dark shadow-2xl border border-white/5">
            <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay flex items-center justify-center">
                {insight.sigilUrl ? (
                    insight.sigilUrl.trim().startsWith('<svg') ? (
                        <div className="w-full h-full p-12 opacity-50" dangerouslySetInnerHTML={{ __html: insight.sigilUrl }} />
                    ) : (
                        <img src={insight.sigilUrl} className="size-full object-cover" />
                    )
                ) : (
                    <div className="size-full bg-[url('https://picsum.photos/id/160/800/800')] bg-cover" />
                )}
            </div>
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

export default HellenisticProfile;
