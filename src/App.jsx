import { useState, useEffect, useRef } from 'react';
import CubeTimer from './components/CubeTimer';
import CubeVisualizer from './components/CubeVisualizer';
import Settings from './pages/Settings';
import { STD_SOLVED } from './utils/constants';
import { generateRandomMoves, applyMove, cloneCube } from './utils/cubeLogic';

const THEME_GLASS_CLASSES = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

export default function App() {
  const [view, setView] = useState('timer');
  
  // Settings State
  const [themeColor, setThemeColor] = useState('indigo');
  const [useInspection, setUseInspection] = useState(false);
  const [inspectionHotkey, setInspectionHotkey] = useState('Enter'); 

  // Timer State
  const [time, setTime] = useState(0); 
  const [inspectionTime, setInspectionTime] = useState(15000); 
  const [penalty, setPenalty] = useState(null); 
  const [timerStatus, setTimerStatus] = useState('idle'); 
  
  // Cube State
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
      if (useInspection && e.code === inspectionHotkey) {
        if (timerStatus === 'idle') {
          startInspection();
        } else if (timerStatus === 'inspecting') {
          cancelInspection();
        }
        return;
      }

      if (e.code === 'Space') {
        if (timerStatus === 'running') {
          stopSolve();
        } 
        else if (timerStatus === 'idle' && !useInspection) {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), 300);
        }
        else if (timerStatus === 'inspecting') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), 300);
        }
        else if (timerStatus === 'finished') {
           setTimerStatus('holding');
           holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), 300);
        }
      }

      if (e.key.toLowerCase() === 's' && !isFocusMode && timerStatus !== 'holding' && timerStatus !== 'ready') {
        setView('settings');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        if (timerStatus === 'ready') {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            startSolve();
        } else if (timerStatus === 'holding') {
          clearTimeout(holdTimeoutRef.current);
          if (useInspection && inspectionTime > -2000) {
             setTimerStatus('inspecting'); 
          } else {
             setTimerStatus('idle');
          }
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
  }, [timerStatus, view, useInspection, inspectionHotkey, inspectionTime, isFocusMode]);

  if (view === 'settings') {
    return (
        <Settings 
            onBack={() => setView('timer')} 
            themeColor={themeColor} 
            setThemeColor={setThemeColor} 
            useInspection={useInspection} 
            setUseInspection={setUseInspection}
            inspectionHotkey={inspectionHotkey}
            setInspectionHotkey={setInspectionHotkey}
        />
    );
  }

  return (
    <div className="h-screen bg-[#0a0e13] text-gray-100 font-sans flex flex-col overflow-hidden relative">
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
              // Added new props here
              useInspection={useInspection}
              inspectionHotkey={inspectionHotkey}
          />
          
          <button 
            onClick={() => setView('settings')} 
            className={`absolute bottom-8 right-8 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                isFocusMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
            } ${THEME_GLASS_CLASSES[themeColor] || 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            Settings (S)
          </button>
      </div>
      
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
    </div>
  );
}