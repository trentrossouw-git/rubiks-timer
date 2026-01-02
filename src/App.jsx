import { useState, useEffect, useRef } from 'react';
import CubeTimer from './components/CubeTimer';
import CubeVisualizer from './components/CubeVisualizer';
import { STD_SOLVED } from './utils/constants';
import { generateRandomMoves, applyMove, cloneCube } from './utils/cubeLogic';

export default function App() {
  // --- STATE ---
  const [time, setTime] = useState(0);
  const [timerStatus, setTimerStatus] = useState('idle'); // idle, holding, ready, running, finished
  const [scramble, setScramble] = useState('Generating...');
  const [cubeState, setCubeState] = useState(STD_SOLVED);

  // --- REFS ---
  const requestRef = useRef();
  const startTimeRef = useRef(0);
  const holdTimeoutRef = useRef(null);

  // --- SCRAMBLE LOGIC ---
  const handleNewScramble = () => {
    const movesString = generateRandomMoves(20);
    setScramble(movesString);
    
    let state = cloneCube(STD_SOLVED);
    const moves = movesString.split(' ');
    moves.forEach(move => state = applyMove(state, move));
    setCubeState(state);
  };

  // Initial Scramble
  useEffect(() => { handleNewScramble(); }, []);

  // --- TIMER LOGIC ---
  const animate = () => {
    setTime(Date.now() - startTimeRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (timerStatus === 'running') {
          // STOP
          cancelAnimationFrame(requestRef.current);
          setTimerStatus('finished');
        } else if (timerStatus === 'idle' || timerStatus === 'finished') {
          // START HOLDING
          setTimerStatus('holding');
          holdTimeoutRef.current = setTimeout(() => {
            setTimerStatus('ready');
            setTime(0);
          }, 300); // 300ms hold time
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        if (timerStatus === 'ready') {
          // START
          setTimerStatus('running');
          startTimeRef.current = Date.now();
          requestRef.current = requestAnimationFrame(animate);
        } else if (timerStatus === 'holding') {
          // CANCEL (Released too early)
          clearTimeout(holdTimeoutRef.current);
          setTimerStatus('idle');
        } 
      }
      // Pressing Space when 'finished' resets the cycle
      if (timerStatus === 'finished' && e.code === 'Space') {
         handleNewScramble();
         setTimerStatus('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [timerStatus]);

  // --- BLUR STYLE FOR VISUALIZER ---
  const visualizerStyle = {
    opacity: timerStatus === 'running' ? 0.3 : 1,
    filter: timerStatus === 'running' ? 'blur(4px)' : 'none',
    transition: 'all 300ms ease-in-out'
  };

  return (
    <div className="h-screen bg-[#0a0e13] text-gray-100 font-sans flex flex-col overflow-hidden relative">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative z-0">
        
        {/* TIMER SECTION */}
        <div className="flex-1 flex flex-col justify-center min-h-[400px] z-20">
            <CubeTimer 
                time={time} 
                timerStatus={timerStatus} 
                scramble={scramble}
                onNewScramble={handleNewScramble}
            />
        </div>

        {/* VISUALISER SECTION */}
        <div className="flex justify-center pb-12" style={visualizerStyle}>
            <CubeVisualizer state={cubeState} />
        </div>

      </div>
    </div>
  );
}