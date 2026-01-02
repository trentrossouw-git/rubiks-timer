import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatTime } from '../utils/helpers';

const THEME_STYLES = {
    indigo: { text: 'text-indigo-400', glass: 'bg-indigo-500/10 border-indigo-500/20' },
    emerald: { text: 'text-emerald-400', glass: 'bg-emerald-500/10 border-emerald-500/20' },
    rose: { text: 'text-rose-400', glass: 'bg-rose-500/10 border-rose-500/20' },
    amber: { text: 'text-amber-400', glass: 'bg-amber-500/10 border-amber-500/20' },
};

export default function CubeTimer({ time, isInspecting, timerStatus, scramble, onNewScramble, themeColor }) {
    const activeStyle = THEME_STYLES[themeColor] || THEME_STYLES.indigo;
    const isRunning = timerStatus === 'running';

    let timerColor = 'text-gray-100';
    if (isInspecting) timerColor = activeStyle.text;
    else if (timerStatus === 'ready') timerColor = 'text-[#22c55e]';
    else if (timerStatus === 'holding') timerColor = 'text-[#E65F5F]';

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            <div className="flex justify-center pt-8 mb-2" style={{ opacity: isRunning ? 0 : 1, transition: '0.2s' }}>
                <div className={`flex items-center ${activeStyle.glass} backdrop-blur-md border rounded-xl p-1 shadow-2xl`}>
                    <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-r border-white/10 mr-1">3x3 WCA</div>
                    <button onClick={onNewScramble} className="p-2 text-gray-400 hover:text-white rounded-lg cursor-pointer"><RefreshCw size={16} /></button>
                </div>
            </div>

            <div className="flex justify-center w-full px-4 mt-12 mb-2 select-none min-h-[60px]" style={{ opacity: isRunning ? 0 : 1, transition: '0.2s' }}>
                <h2 className="font-mono text-lg md:text-2xl text-gray-300 text-center tracking-wide leading-relaxed">
                    {scramble}
                </h2>
            </div>

            <div className="flex justify-center mt-8 mb-12 w-full">
                <div className={`font-mono text-7xl md:text-9xl font-bold tabular-nums tracking-tighter select-none transition-colors duration-200 ${timerColor} text-center`}>
                    {isInspecting ? time : formatTime(time)}
                </div>
            </div>

            <div className={`pb-2 text-center ${activeStyle.text} text-[10px] font-bold uppercase tracking-[0.3em] transition-opacity duration-200 ${isRunning ? 'opacity-0' : 'opacity-100'}`}>
                {isInspecting ? 'Inspect Now' : (timerStatus === 'holding' ? 'Hold...' : timerStatus === 'ready' ? 'Release to Solve' : 'Hold Space to Start')}
            </div>
        </div>
    );
}