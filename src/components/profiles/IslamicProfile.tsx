import React from 'react';
import { UserData, InsightData } from '../../types';

interface ProfileProps {
    userData: UserData;
    insight: InsightData;
    onOpenChat: (p?: string) => void;
}

const IslamicProfile: React.FC<ProfileProps> = ({ userData, insight, onOpenChat }) => (
    <div className="space-y-6">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-surface-dark to-[#451d3b] border border-white/5 shadow-2xl">
            <div className="h-56 bg-cover bg-center opacity-60 overflow-hidden flex items-center justify-center">
                {insight.sigilUrl ? (
                    insight.sigilUrl.trim().startsWith('<svg') ? (
                        <div className="w-full h-full p-8" dangerouslySetInnerHTML={{ __html: insight.sigilUrl }} />
                    ) : (
                        <img src={insight.sigilUrl} className="size-full object-cover" />
                    )
                ) : (
                    <div className="size-full bg-[url('https://picsum.photos/id/180/800/800')] bg-cover" />
                )}
            </div>
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

export default IslamicProfile;
