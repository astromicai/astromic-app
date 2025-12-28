import React from 'react';
import { UserData, InsightData } from '../../types';

interface ProfileProps {
    userData: UserData;
    insight: InsightData;
    onOpenChat: (p?: string) => void;
}

const KabbalisticProfile: React.FC<ProfileProps> = ({ userData, insight, onOpenChat }) => (
    <div className="space-y-6">
        <div className="flex flex-col items-center text-center pt-4">
            <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-40"></div>
                <div className="relative h-32 w-32 rounded-full border-2 border-background-dark shadow-2xl bg-cover overflow-hidden bg-background-dark flex items-center justify-center">
                    {insight.sigilUrl ? (
                        insight.sigilUrl.trim().startsWith('<svg') ? (
                            <div className="p-2 w-full h-full" dangerouslySetInnerHTML={{ __html: insight.sigilUrl }} />
                        ) : (
                            <img src={insight.sigilUrl} className="size-full object-cover" />
                        )
                    ) : (
                        <div className="size-full bg-[url('https://picsum.photos/id/64/300/300')] bg-cover" />
                    )}
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

export default KabbalisticProfile;
