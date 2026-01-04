import { useState, useEffect, useRef } from 'react';
import CubeTimer from './components/CubeTimer';
import CubeVisualizer from './components/CubeVisualizer';
import Settings from './pages/Settings';
import { STD_SOLVED } from './utils/constants';
import { generateRandomMoves, applyMove, cloneCube } from './utils/cubeLogic';

// Helper to switch theme styles based on Light/Dark mode
const getGlassClasses = (color, isDark) => {
    // Dark Mode Styles (Original)
    if (isDark) {
        switch (color) {
            case 'indigo': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
            case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'rose': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
            case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            default: return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
        }
    }
    // Light Mode Styles (Darker text, lighter backgrounds)
    switch (color) {
        case 'indigo': return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600';
        case 'emerald': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600';
        case 'rose': return 'bg-rose-500/10 border-rose-500/30 text-rose-600';
        case 'amber': return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
        default: return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600';
    }
};

export default function App() {
  const [view, setView] = useState('timer');
  
  // --- SETTINGS STATE ---
  const [themeColor, setThemeColor] = useState('indigo');
  const [isDarkMode, setIsDarkMode] = useState(true); // New
  const [showVisualizer, setShowVisualizer] = useState(true); // New
  
  const [useInspection, setUseInspection] = useState(false);
  const [inspectionHotkey, setInspectionHotkey] = useState('KeyI'); // Default: 'i'
  const [timerHotkey, setTimerHotkey] = useState('Space'); // Default: Space
  const [holdDuration, setHoldDuration] = useState(550); // Default: 550ms

  // --- TIMER STATE ---
  const [time, setTime] = useState(0); 
  const [inspectionTime, setInspectionTime] = useState(15000); 
  const [penalty, setPenalty] = useState(null); 
  const [timerStatus, setTimerStatus] = useState('idle'); 
  
  // --- CUBE STATE ---
  const [scramble, setScramble] = useState('Generating...');
  const [cubeState, setCubeState] = useState(STD_SOLVED);

  const requestRef = useRef();
  const startTimeRef = useRef(0);
  const inspectionStartRef = useRef(0);
  const holdTimeoutRef = useRef(null);

  const isFocusMode = timerStatus === 'running' || timerStatus === 'inspecting';

  // --- Scramble Logic ---
  const handleNewScramble = () => {
    const movesString = generateRandomMoves(20);
    setScramble(movesString);
    let state = cloneCube(STD_SOLVED);
    const moves = movesString.split(' ');
    moves.forEach(move => state = applyMove(state, move));
    setCubeState(state);
    setTimerStatus('idle');
    setPenalty(null);
  };

  useEffect(() => { handleNewScramble(); }, []);

  // --- Main Solve Timer ---
  const startSolve = () => {
    setTimerStatus('running');
    setPenalty(null); 
    setTime(0); 
    startTimeRef.current = Date.now();
    const animate = () => {
      setTime(Date.now() - startTimeRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const stopSolve = () => {
    cancelAnimationFrame(requestRef.current);
    setTimerStatus('finished');
  };

  // --- Inspection Timer ---
  const startInspection = () => {
    setTimerStatus('inspecting');
    setInspectionTime(15000);
    setPenalty(null);
    inspectionStartRef.current = Date.now();

    const animateInspection = () => {
      const now = Date.now();
      const elapsed = now - inspectionStartRef.current;
      const remaining = 15000 - elapsed;
      setInspectionTime(remaining);

      if (remaining < -2000) {
        cancelAnimationFrame(requestRef.current);
        setTimerStatus('finished');
        setPenalty('DNS'); 
      } else {
        requestRef.current = requestAnimationFrame(animateInspection);
      }
    };
    requestRef.current = requestAnimationFrame(animateInspection);
  };

  const cancelInspection = () => {
    cancelAnimationFrame(requestRef.current);
    setTimerStatus('idle');
    setInspectionTime(15000);
  };

  // --- Input Handling ---
  useEffect(() => {
    if (view !== 'timer') return;

    const handleKeyDown = (e) => {
      // 1. Inspection Hotkey
      if (useInspection && e.code === inspectionHotkey) {
        if (timerStatus === 'idle') startInspection();
        else if (timerStatus === 'inspecting') cancelInspection();
        return;
      }

      // 2. Start Timer Hotkey (User Defined)
      if (e.code === timerHotkey) {
        if (timerStatus === 'running') {
          stopSolve();
        } 
        else if (timerStatus === 'idle' && !useInspection) {
           setTimerStatus('holding');
           // Use dynamic hold duration
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), holdDuration);
        }
        else if (timerStatus === 'inspecting') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), holdDuration);
        }
        else if (timerStatus === 'finished') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), holdDuration);
        }
      }

      // Settings Shortcut
      if (e.key.toLowerCase() === 's' && !isFocusMode && timerStatus !== 'holding' && timerStatus !== 'ready') {
        setView('settings');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === timerHotkey) {
        if (timerStatus === 'ready') {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            startSolve();
        } else if (timerStatus === 'holding') {
          clearTimeout(holdTimeoutRef.current);
          if (useInspection && inspectionTime > -2000) setTimerStatus('inspecting'); 
          else setTimerStatus('idle');
        } else if (timerStatus === 'finished') {
           handleNewScramble();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [timerStatus, view, useInspection, inspectionHotkey, timerHotkey, holdDuration, inspectionTime, isFocusMode]);

  if (view === 'settings') {
    return (
        <Settings 
            onBack={() => setView('timer')} 
            themeColor={themeColor} setThemeColor={setThemeColor} 
            isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
            showVisualizer={showVisualizer} setShowVisualizer={setShowVisualizer}
            useInspection={useInspection} setUseInspection={setUseInspection}
            inspectionHotkey={inspectionHotkey} setInspectionHotkey={setInspectionHotkey}
            timerHotkey={timerHotkey} setTimerHotkey={setTimerHotkey}
            holdDuration={holdDuration} setHoldDuration={setHoldDuration}
        />
    );
  }

  // Determine Background Colors based on Dark Mode
  const bgClass = isDarkMode ? 'bg-[#0a0e13] text-gray-100' : 'bg-gray-50 text-gray-900';
  const glassButtonClass = getGlassClasses(themeColor, isDarkMode);

  return (
    <div className={`h-screen ${bgClass} font-sans flex flex-col overflow-hidden relative transition-colors duration-300`}>
      <div className="flex-1 flex flex-col justify-center min-h-[400px] z-20">
          <CubeTimer 
              time={time} 
              inspectionTime={inspectionTime}
              timerStatus={timerStatus} 
              penalty={penalty}
              scramble={scramble}
              onNewScramble={handleNewScramble}
              themeColor={themeColor}
              setView={setView}
              useInspection={useInspection}
              inspectionHotkey={inspectionHotkey}
              timerHotkey={timerHotkey}
              isDarkMode={isDarkMode}
          />
          
          <button 
            onClick={() => setView('settings')} 
            className={`absolute bottom-8 right-8 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                isFocusMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
            } ${glassButtonClass}`}
          >
            Settings (S)
          </button>
      </div>
      
      {/* Visualizer Container - Conditionally Rendered */}
      {showVisualizer && (
        <div 
            className="flex justify-center pb-12" 
            style={{ 
                opacity: isFocusMode ? 0.1 : 1, 
                filter: isFocusMode ? 'blur(10px)' : 'none', 
                transition: '0.5s' 
            }}
        >
            <CubeVisualizer state={cubeState} />
        </div>
      )}
    </div>
  );
}