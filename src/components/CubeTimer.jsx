import React from 'react';
import { RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { formatTime } from '../utils/helpers';

export default function CubeTimer({ 
    time, 
    timerStatus, 
    scramble,
    onNewScramble
}) {
    // Logic to display time (shows 0.00 if idle, formatted time otherwise)
    const getDisplayTime = () => {
        return formatTime(time);
    };

    // Logic to split scramble into readable rows
    const renderScrambleText = () => {
        if (!scramble) return <span className="text-gray-700 animate-pulse">Generating...</span>;
        
        // Split long scrambles into chunks of 10 moves for better readability
        const moves = scramble.split(' ');
        const rows = [];
        for (let i = 0; i < moves.length; i += 10) rows.push(moves.slice(i, i + 10).join(' '));
        
        return (
            <div className="flex flex-col items-center justify-center w-full text-center">
                {rows.map((row, i) => (
                    <span key={i} className="block leading-tight text-gray-300">{row}</span>
                ))}
            </div>
        );
    };

    // Dynamic Colors based on status
    let timerColor = 'text-gray-100';
    if (timerStatus === 'ready') timerColor = 'text-[#22c55e]';   // Green
    if (timerStatus === 'holding') timerColor = 'text-[#E65F5F]'; // Red

    const isRunning = timerStatus === 'running';

    // UI Fade Style (Dim the controls when timer is running)
    const fadeStyle = {
        opacity: isRunning ? 0 : 1,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: isRunning ? 'none' : 'auto'
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            {/* HEADER CONTROLS (Pill Shape) */}
            <div 
                className="flex justify-center pt-8 mb-2 transition-all duration-300"
                style={fadeStyle}
            >
                <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-0.5 shadow-sm z-20">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-700 mr-1 select-none">
                        3x3 WCA
                    </div>
                    <button 
                        onClick={(e) => { e.currentTarget.blur(); onNewScramble(); }} 
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                    >
                        <SettingsIcon size={14} />
                    </button>
                </div>
            </div>

            {/* SCRAMBLE TEXT */}
            <div 
                className="flex justify-center w-full px-4 mt-12 mb-2 select-none transition-all duration-300 min-h-[60px]"
                style={fadeStyle}
            >
                <h2 className="font-mono text-lg md:text-2xl text-gray-300 tracking-wide leading-relaxed text-center">
                    {renderScrambleText()}
                </h2>
            </div>

            {/* MAIN TIMER NUMBERS */}
            <div className="flex justify-center mt-8 mb-12 w-full">
                <div className={`font-mono text-7xl md:text-9xl font-bold tabular-nums tracking-tighter select-none transition-colors duration-200 ${timerColor} text-center`}>
                    {getDisplayTime()}
                </div>
            </div>

            {/* HINT TEXT */}
            <div 
                style={fadeStyle}
                className="pb-2 text-center text-indigo-400 text-[10px] font-medium uppercase tracking-widest select-none transition-opacity duration-200"
            >
                <span>
                    {timerStatus === 'holding' ? 'Hold...' : timerStatus === 'ready' ? 'Release to Solve' : 'Hold Space to Start'}
                </span>
            </div>
        </div>
    );
}