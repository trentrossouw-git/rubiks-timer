import { useState, useEffect, useRef, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage'; // IMPORT THE NEW HOOK
import CubeTimer from './components/CubeTimer';
import CubeVisualizer from './components/CubeVisualizer';
import Settings from './pages/Settings';
import { STD_SOLVED } from './utils/constants';
import { generateRandomMoves, applyMove, cloneCube } from './utils/cubeLogic';

// Default Settings Object
const DEFAULT_SETTINGS = {
    themeColor: 'indigo',
    isDarkMode: true,
    showVisualizer: true,
    useInspection: false,
    inspectionHotkey: 'KeyI',
    timerHotkey: 'Space',
    holdDuration: 550,
    dailyGoal: 50 // New: For the pet feature later!
};

const getGlassClasses = (color, isDark) => {
    if (isDark) {
        switch (color) {
            case 'indigo': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
            case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'rose': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
            case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            default: return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
        }
    }
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
  
  // --- PERSISTENT STATE (Saved to Browser) ---
  const [settings, setSettings] = useLocalStorage('cube_settings', DEFAULT_SETTINGS);
  const [solves, setSolves] = useLocalStorage('cube_solves', []); // Array to store history
  const [wallet, setWallet] = useLocalStorage('cube_wallet', { cubes: 0 }); // New: For the Pet!

  // Helper adapters to keep your Settings.jsx compatible
  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  // --- TEMP STATE (Reset on Refresh) ---
  const [time, setTime] = useState(0); 
  const [inspectionTime, setInspectionTime] = useState(15000); 
  const [penalty, setPenalty] = useState(null); 
  const [timerStatus, setTimerStatus] = useState('idle'); 
  const [scramble, setScramble] = useState('Generating...');
  const [cubeState, setCubeState] = useState(STD_SOLVED);

  const requestRef = useRef();
  const startTimeRef = useRef(0);
  const inspectionStartRef = useRef(0);
  const holdTimeoutRef = useRef(null);

  const isFocusMode = timerStatus === 'running' || timerStatus === 'inspecting';

  const handleNewScramble = useCallback(() => {
    const movesString = generateRandomMoves(20);
    setScramble(movesString);
    let state = cloneCube(STD_SOLVED);
    const moves = movesString.split(' ');
    moves.forEach(move => state = applyMove(state, move));
    setCubeState(state);
    setTimerStatus('idle');
    setPenalty(null);
  }, []);

  useEffect(() => { handleNewScramble(); }, [handleNewScramble]);

  // --- MAIN SOLVE LOGIC ---
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
    const finalTime = Date.now() - startTimeRef.current;
    setTimerStatus('finished');
    
    // SAVE THE SOLVE
    const newSolve = {
        id: Date.now(), // Unique ID
        time: finalTime,
        scramble: scramble,
        date: new Date().toISOString(),
        penalty: null // No penalty for normal finish
    };
    
    setSolves(prev => [newSolve, ...prev]);
    // Note: This is where we will eventually add: setWallet(prev => ({ cubes: prev.cubes + 5 }));
  };

  // --- INSPECTION LOGIC ---
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
        
        // Save DNS (Did Not Start) to history? Optional. 
        // Usually DNS is not saved in stats, but let's leave it out for now.
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

  // --- INPUT HANDLING ---
  useEffect(() => {
    if (view !== 'timer') return;

    const handleKeyDown = (e) => {
      if (settings.useInspection && e.code === settings.inspectionHotkey) {
        if (timerStatus === 'idle') startInspection();
        else if (timerStatus === 'inspecting') cancelInspection();
        return;
      }

      if (e.code === settings.timerHotkey) {
        if (timerStatus === 'running') {
          stopSolve();
        } 
        else if (timerStatus === 'idle' && !settings.useInspection) {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), settings.holdDuration);
        }
        else if (timerStatus === 'inspecting') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), settings.holdDuration);
        }
        else if (timerStatus === 'finished') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), settings.holdDuration);
        }
      }

      if (e.key.toLowerCase() === 's' && !isFocusMode && timerStatus !== 'holding' && timerStatus !== 'ready') {
        setView('settings');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === settings.timerHotkey) {
        if (timerStatus === 'ready') {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            startSolve();
        } else if (timerStatus === 'holding') {
          clearTimeout(holdTimeoutRef.current);
          if (settings.useInspection && inspectionTime > -2000) setTimerStatus('inspecting'); 
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
  }, [timerStatus, view, settings, inspectionTime, isFocusMode]);

  if (view === 'settings') {
    return (
        <Settings 
            onBack={() => setView('timer')} 
            // Pass adapters to maintain compatibility with Settings.jsx
            themeColor={settings.themeColor} setThemeColor={(v) => updateSetting('themeColor', v)}
            isDarkMode={settings.isDarkMode} setIsDarkMode={(v) => updateSetting('isDarkMode', v)}
            showVisualizer={settings.showVisualizer} setShowVisualizer={(v) => updateSetting('showVisualizer', v)}
            useInspection={settings.useInspection} setUseInspection={(v) => updateSetting('useInspection', v)}
            inspectionHotkey={settings.inspectionHotkey} setInspectionHotkey={(v) => updateSetting('inspectionHotkey', v)}
            timerHotkey={settings.timerHotkey} setTimerHotkey={(v) => updateSetting('timerHotkey', v)}
            holdDuration={settings.holdDuration} setHoldDuration={(v) => updateSetting('holdDuration', v)}
        />
    );
  }

  const bgClass = settings.isDarkMode ? 'bg-[#0a0e13] text-gray-100' : 'bg-gray-50 text-gray-900';
  const glassButtonClass = getGlassClasses(settings.themeColor, settings.isDarkMode);

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
              themeColor={settings.themeColor}
              setView={setView}
              useInspection={settings.useInspection}
              inspectionHotkey={settings.inspectionHotkey}
              timerHotkey={settings.timerHotkey}
              isDarkMode={settings.isDarkMode}
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
      
      {settings.showVisualizer && (
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