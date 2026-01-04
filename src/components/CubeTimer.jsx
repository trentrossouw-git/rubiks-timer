import React from 'react';
import { RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { formatTime } from '../utils/helpers';

const THEME_STYLES = {
    indigo: { text: 'text-indigo-500', glass: 'bg-indigo-500/10 border-indigo-500/20' },
    emerald: { text: 'text-emerald-500', glass: 'bg-emerald-500/10 border-emerald-500/20' },
    rose: { text: 'text-rose-500', glass: 'bg-rose-500/10 border-rose-500/20' },
    amber: { text: 'text-amber-500', glass: 'bg-amber-500/10 border-amber-500/20' },
};

export default function CubeTimer({ 
    time, 
    inspectionTime,
    timerStatus, 
    penalty,
    scramble, 
    onNewScramble, 
    themeColor,
    setView,
    useInspection,
    inspectionHotkey,
    timerHotkey,  // New Prop
    isDarkMode    // New Prop
}) {
    const activeStyle = THEME_STYLES[themeColor] || THEME_STYLES.indigo;
    
    // Adjust colors for Light Mode visibility
    const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
    const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const scrambleColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const glassClass = isDarkMode ? activeStyle.glass : `bg-${themeColor}-500/5 border-${themeColor}-500/20`;

    const isFocusMode = timerStatus === 'running' || timerStatus === 'inspecting';
    
    const focusBlurStyle = {
        opacity: isFocusMode ? 0.1 : 1,
        filter: isFocusMode ? 'blur(4px)' : 'none',
        transition: 'all 0.5s ease-in-out',
        pointerEvents: isFocusMode ? 'none' : 'auto'
    };

    const isInspecting = timerStatus === 'inspecting' || (timerStatus === 'holding' && inspectionTime < 15000 && inspectionTime > -2000);

    const formatScramble = (scrambleStr) => {
        if (!scrambleStr || scrambleStr === 'Generating...') return scrambleStr;
        const moves = scrambleStr.split(' ');
        if (moves.length <= 10) return scrambleStr;
        const row1 = moves.slice(0, 10).join(' ');
        const row2 = moves.slice(10).join(' ');
        return (
            <div className="flex flex-col items-center gap-1">
                <span>{row1}</span>
                <span>{row2}</span>
            </div>
        );
    };

    // --- Inspection Display Logic ---
    let inspectionDisplay = null;
    let inspectionColor = activeStyle.text;

    if (isInspecting) {
        if (inspectionTime > 0) {
            inspectionDisplay = Math.ceil(inspectionTime / 1000);
            if (inspectionDisplay <= 8) inspectionColor = 'text-orange-500';
            if (inspectionDisplay <= 3) inspectionColor = 'text-red-500';
        } else {
            const overtime = Math.abs(inspectionTime) / 1000;
            inspectionDisplay = `+ ${overtime.toFixed(2)}`;
            inspectionColor = 'text-red-600';
        }
    }

    // --- Main Timer Logic ---
    let mainDisplay = formatTime(time);
    let mainTimerColor = textColor;

    if (penalty === 'DNS') {
        mainDisplay = 'DNS';
        mainTimerColor = 'text-red-500';
    } else if (timerStatus === 'ready') {
        mainTimerColor = 'text-[#22c55e]';
    } else if (timerStatus === 'holding') {
        mainTimerColor = 'text-[#E65F5F]';
    }

    // --- Footer Text Logic ---
    const timerKeyName = timerHotkey === 'Space' ? 'Space' : timerHotkey.replace('Key', '');
    let footerText = `Hold ${timerKeyName} to Start`;
    
    if (timerStatus === 'holding') footerText = 'Hold...';
    else if (timerStatus === 'ready') footerText = 'Release to Solve';
    else if (isInspecting) footerText = `Hold ${timerKeyName} to Start`;
    else if ((timerStatus === 'idle' || timerStatus === 'finished') && useInspection) {
        const inspectKeyName = inspectionHotkey.replace('Key', '');
        footerText = `Press ${inspectKeyName} to begin inspection`;
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto relative">
            
            {/* Header */}
            <div className="flex justify-center pt-6 mb-2" style={focusBlurStyle}>
                <div className={`flex items-center ${glassClass} backdrop-blur-md border rounded-xl p-1 shadow-2xl`}>
                    <div className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] border-r ${isDarkMode ? 'border-white/10' : 'border-black/10'} mr-1 ${activeStyle.text}`}>
                        3x3 WCA
                    </div>
                    <button onClick={onNewScramble} className={`p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${activeStyle.text}`}>
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => setView('settings')} className={`p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${activeStyle.text}`}>
                        <SettingsIcon size={16} />
                    </button>
                </div>
            </div>

            {/* Scramble */}
            <div className="flex justify-center w-full px-4 mt-6 mb-2 select-none min-h-[60px]" style={focusBlurStyle}>
                <h2 className={`font-mono text-lg md:text-2xl ${scrambleColor} text-center tracking-wide leading-relaxed`}>
                    {formatScramble(scramble)}
                </h2>
            </div>

            {/* Timer Area */}
            <div className="relative flex justify-center mt-10 mb-12 w-full">
                
                {/* INSPECTION OVERLAY */}
                <div className={`absolute -top-10 left-0 right-0 flex justify-center transition-opacity duration-100 ${isInspecting ? 'opacity-100' : 'opacity-0'}`}>
                    <span className={`font-mono text-4xl font-bold ${inspectionColor} ${inspectionTime > 0 ? 'animate-pulse' : ''}`}>
                        {inspectionDisplay}
                    </span>
                </div>

                {/* Main Numbers */}
                <div className={`font-mono text-7xl md:text-9xl font-bold tabular-nums tracking-tighter select-none transition-colors duration-200 ${mainTimerColor} text-center`}>
                    {mainDisplay}
                </div>
            </div>

            {/* Footer Text */}
            <div className={`pb-2 text-center ${activeStyle.text} text-[10px] font-bold uppercase tracking-[0.3em] transition-opacity duration-200 ${timerStatus === 'running' ? 'opacity-0' : 'opacity-100'}`}>
                {footerText}
            </div>
        </div>
    );
}