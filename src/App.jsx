import { useState, useEffect, useRef, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import CubeTimer from './components/CubeTimer';
import CubeVisualizer from './components/CubeVisualizer';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import Cublet from './pages/Cublet/Cublet'; // <--- MAKE SURE THIS IMPORT EXISTS
import { STD_SOLVED } from './utils/constants';
import { generateRandomMoves, applyMove, cloneCube } from './utils/cubeLogic';
import { calculateStats } from './utils/statsLogic';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SETTINGS = {
    themeColor: 'indigo',
    isDarkMode: true,
    showVisualizer: true,
    useInspection: false,
    inspectionHotkey: 'KeyI',
    timerHotkey: 'Space',
    holdDuration: 550,
    dailyGoal: 50,
    profileName: 'Speedcuber',
    profileImage: '',
    navHotkeys: {
        timer: 'Digit1',
        stats: 'Digit2',
        cublet: 'Digit3',
        settings: 'Digit4'
    }
};

const pageVariants = {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' }
};

export default function App() {
  const [view, setView] = useState('timer');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 

  // --- PERSISTENT STATE ---
  const [settings, setSettings] = useLocalStorage('cube_settings', DEFAULT_SETTINGS);
  const [solves, setSolves] = useLocalStorage('cube_solves', []); 
  const [wallet, setWallet] = useLocalStorage('cube_wallet', { cubes: 0 }); 

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  // --- TEMP STATE ---
  const [time, setTime] = useState(0); 
  const [inspectionTime, setInspectionTime] = useState(15000); 
  const [penalty, setPenalty] = useState(null); 
  const [timerStatus, setTimerStatus] = useState('idle'); 
  const [scramble, setScramble] = useState('Generating...');
  const [cubeState, setCubeState] = useState(STD_SOLVED);
  const [stats, setStats] = useState({ bestSingle: Infinity, todayCount: 0 });

  const requestRef = useRef();
  const startTimeRef = useRef(0);
  const inspectionStartRef = useRef(0);
  const holdTimeoutRef = useRef(null);

  const isFocusMode = timerStatus === 'running' || timerStatus === 'inspecting';

  useEffect(() => {
    setStats(calculateStats(solves));
  }, [solves]);

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
    
    const newSolve = {
        id: Date.now(),
        time: finalTime,
        scramble: scramble,
        date: new Date().toISOString(),
        penalty: null 
    };
    
    let cubesEarned = 5; 
    if (finalTime < stats.bestSingle && solves.length > 0) cubesEarned += 20;
    const newDailyCount = stats.todayCount + 1;
    if (newDailyCount === parseInt(settings.dailyGoal)) cubesEarned += 50;

    setSolves(prev => [newSolve, ...prev]);
    setWallet(prev => ({ ...prev, cubes: (prev.cubes || 0) + cubesEarned }));
  };

  const startInspection = () => {
    setTimerStatus('inspecting');
    setInspectionTime(15000);
    setPenalty(null);
    inspectionStartRef.current = Date.now();
    const animateInspection = () => {
      const now = Date.now();
      const remaining = 15000 - (now - inspectionStartRef.current);
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

  // --- INPUT HANDLING ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.target.tagName !== 'INPUT' && !isFocusMode) {
          if (e.code === (settings.navHotkeys?.timer || 'Digit1')) setView('timer');
          if (e.code === (settings.navHotkeys?.stats || 'Digit2')) setView('stats');
          if (e.code === (settings.navHotkeys?.cublet || 'Digit3')) setView('cublet');
          if (e.code === (settings.navHotkeys?.settings || 'Digit4')) setView('settings');

          if (e.code === 'ArrowLeft') setIsSidebarCollapsed(true);
          if (e.code === 'ArrowRight') setIsSidebarCollapsed(false);
      }

      if (view === 'timer') {
          if (settings.useInspection && e.code === settings.inspectionHotkey) {
            if (timerStatus === 'idle') startInspection();
            else if (timerStatus === 'inspecting') cancelInspection();
            return;
          }

          if (e.code === settings.timerHotkey) {
            if (timerStatus === 'running') stopSolve();
            else if (timerStatus === 'idle' && !settings.useInspection) {
               setTimerStatus('holding');
               holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), settings.holdDuration);
            }
            else if (timerStatus === 'inspecting' || timerStatus === 'finished') {
               setTimerStatus('holding');
               holdTimeoutRef.current = setTimeout(() => setTimerStatus('ready'), settings.holdDuration);
            }
          }
      }
    };

    const handleKeyUp = (e) => {
      if (view === 'timer' && e.code === settings.timerHotkey) {
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


  const bgClass = settings.isDarkMode ? 'bg-[#0a0e13] text-gray-100' : 'bg-gray-50 text-gray-900';

  return (
    <div className={`h-screen w-screen ${bgClass} font-sans flex overflow-hidden transition-colors duration-300`}>
      
      {/* 1. SIDEBAR */}
      <Sidebar 
          activeView={view} 
          setView={setView} 
          themeColor={settings.themeColor} 
          isDarkMode={settings.isDarkMode}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          navHotkeys={settings.navHotkeys || { timer: 'Digit1', stats: 'Digit2', cublet: 'Digit3', settings: 'Digit4' }}
          profileName={settings.profileName}
          profileImage={settings.profileImage}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          
          {view === 'timer' && (
              <motion.div 
                key="timer" 
                variants={pageVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col"
              >
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
                        cubes={wallet.cubes || 0}
                        dailyProgress={stats.todayCount}
                        dailyGoal={settings.dailyGoal}
                    />
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
              </motion.div>
          )}

          {view === 'stats' && (
            <motion.div 
                key="stats"
                variants={pageVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full h-full"
            >
                <Stats isDarkMode={settings.isDarkMode} />
            </motion.div>
          )}

          {view === 'cublet' && (
             <motion.div 
                key="cublet"
                variants={pageVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full h-full"
            >
                {/* THIS IS THE CRITICAL FIX: Passing wallet props */}
                <Cublet 
                    isDarkMode={settings.isDarkMode} 
                    themeColor={settings.themeColor} 
                    wallet={wallet}
                    setWallet={setWallet}
                />
            </motion.div>
          )}

          {view === 'settings' && (
             <motion.div 
                key="settings"
                variants={pageVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full h-full flex justify-center items-center p-8"
             >
                <Settings 
                    onBack={() => setView('timer')}
                    themeColor={settings.themeColor} setThemeColor={(v) => updateSetting('themeColor', v)}
                    isDarkMode={settings.isDarkMode} setIsDarkMode={(v) => updateSetting('isDarkMode', v)}
                    showVisualizer={settings.showVisualizer} setShowVisualizer={(v) => updateSetting('showVisualizer', v)}
                    useInspection={settings.useInspection} setUseInspection={(v) => updateSetting('useInspection', v)}
                    inspectionHotkey={settings.inspectionHotkey} setInspectionHotkey={(v) => updateSetting('inspectionHotkey', v)}
                    timerHotkey={settings.timerHotkey} setTimerHotkey={(v) => updateSetting('timerHotkey', v)}
                    holdDuration={settings.holdDuration} setHoldDuration={(v) => updateSetting('holdDuration', v)}
                    navHotkeys={settings.navHotkeys || {}} setNavHotkeys={(v) => updateSetting('navHotkeys', v)}
                    profileName={settings.profileName} setProfileName={(v) => updateSetting('profileName', v)}
                    profileImage={settings.profileImage} setProfileImage={(v) => updateSetting('profileImage', v)}
                />
             </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}