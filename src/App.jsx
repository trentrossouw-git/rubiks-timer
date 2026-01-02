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
  const [themeColor, setThemeColor] = useState('indigo');
  const [useInspection, setUseInspection] = useState(false);
  
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [timerStatus, setTimerStatus] = useState('idle'); 
  const [scramble, setScramble] = useState('Generating...');
  const [cubeState, setCubeState] = useState(STD_SOLVED);

  const requestRef = useRef();
  const startTimeRef = useRef(0);
  const inspectionIntervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  const handleNewScramble = () => {
    const movesString = generateRandomMoves(20);
    setScramble(movesString);
    let state = cloneCube(STD_SOLVED);
    const moves = movesString.split(' ');
    moves.forEach(move => state = applyMove(state, move));
    setCubeState(state);
    setTime(0);
    setInspectionTime(15);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
  };

  useEffect(() => { handleNewScramble(); }, []);

  const startTimer = () => {
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    setTimerStatus('running');
    startTimeRef.current = Date.now();
    const animate = () => {
      setTime(Date.now() - startTimeRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const startInspection = () => {
    setTimerStatus('inspecting');
    setInspectionTime(15);
    inspectionIntervalRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        if (prev <= 1) {
           clearInterval(inspectionIntervalRef.current);
           return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (view !== 'timer') return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (timerStatus === 'running') {
          cancelAnimationFrame(requestRef.current);
          setTimerStatus('finished');
        } else if (timerStatus === 'idle' || timerStatus === 'finished') {
          if (useInspection) startInspection();
          else {
            setTimerStatus('holding');
            holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), 300);
          }
        } else if (timerStatus === 'inspecting') {
          setTimerStatus('holding');
          holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), 300);
        }
      }
      if (e.key.toLowerCase() === 's' && timerStatus !== 'running') setView('settings');
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        if (timerStatus === 'ready') {
          startTimer();
        } else if (timerStatus === 'holding') {
          clearTimeout(holdTimeoutRef.current);
          setTimerStatus(useInspection ? 'inspecting' : 'idle');
        }
      }
      if (timerStatus === 'finished' && e.code === 'Space') handleNewScramble();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [timerStatus, view, useInspection]);

  if (view === 'settings') {
    return (
        <Settings 
            onBack={() => setView('timer')} 
            themeColor={themeColor} 
            setThemeColor={setThemeColor} 
            useInspection={useInspection} 
            setUseInspection={setUseInspection} 
        />
    );
  }

  return (
    <div className="h-screen bg-[#0a0e13] text-gray-100 font-sans flex flex-col overflow-hidden relative">
      <div className="flex-1 flex flex-col justify-center min-h-[400px] z-20">
          <CubeTimer 
              time={timerStatus === 'inspecting' ? inspectionTime : time} 
              isInspecting={timerStatus === 'inspecting'}
              timerStatus={timerStatus} 
              scramble={scramble}
              onNewScramble={handleNewScramble}
              themeColor={themeColor}
          />
          
          <button 
            onClick={() => setView('settings')} 
            className={`absolute bottom-8 right-8 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                timerStatus === 'running' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            } ${THEME_GLASS_CLASSES[themeColor] || 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            Settings (S)
          </button>
      </div>
      <div className="flex justify-center pb-12" style={{ opacity: timerStatus === 'running' ? 0.1 : 1, filter: timerStatus === 'running' ? 'blur(10px)' : 'none', transition: '0.5s' }}>
          <CubeVisualizer state={cubeState} />
      </div>
    </div>
  );
}