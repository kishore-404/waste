import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Map, Activity, AlertTriangle, 
  BatteryCharging, Server, Trash2, ShieldCheck, Zap,
  Wifi, BarChart
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// CSS SHADERS & EFFECTS
// ============================================================================
const GameStyles = () => (
  <style>{`
    @keyframes radarSweep {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .hex-grid {
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104L0 86.602V51.961L30 34.641l30 17.32v34.641L30 104zM30 69.282L15 60.622v-17.32L30 34.641l15 8.66v17.32L30 69.282zM30 34.641L0 17.32V-17.32L30-34.641l30 17.321V17.32L30 34.641z' fill='%2310b981' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

// ============================================================================
// ANIMATIONS: PARTICLES & FLOATING TEXT
// ============================================================================
const Particle = ({ x, y, color, onComplete }) => {
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 80 + 40;
  return (
    <motion.div
      initial={{ x, y, scale: 1, opacity: 1 }}
      animate={{ x: x + Math.cos(angle) * velocity, y: y + Math.sin(angle) * velocity, scale: 0, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn("absolute w-2 h-2 rounded-full z-40 pointer-events-none shadow-[0_0_10px_currentColor]", color)}
    />
  );
};

const FloatingText = ({ x, y, text, type, onComplete }) => {
  const isGood = type === 'good';
  const isBad = type === 'bad';
  return (
    <motion.div
      initial={{ opacity: 1, y, x, scale: 0.5 }}
      animate={{ opacity: 0, y: y - 50, scale: 1.5 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn(
        "absolute z-50 font-black font-mono pointer-events-none drop-shadow-md",
        isGood ? "text-emerald-400 text-2xl" : (isBad ? "text-red-500 text-xl" : "text-yellow-400 text-lg")
      )}
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {text}
    </motion.div>
  );
};

// ============================================================================
// MAIN GAME ENGINE
// ============================================================================
export default function InteractiveGame() {
  const navigate = useNavigate();

  // --- GAME STATE ---
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER, WON
  const [score, setScore] = useState(0);
  const [overflows, setOverflows] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [wave, setWave] = useState(1);
  const [time, setTime] = useState(0);

  // --- ENTITIES ---
  const [bins, setBins] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [particles, setParticles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [logs, setLogs] = useState([]);

  const arenaRef = useRef(null);
  const screenShake = useAnimation();

  // --- LOGGING ---
  const addLog = useCallback((msg, type = "info") => {
    setLogs(prev => {
      const newLogs = [...prev, { id: Date.now() + Math.random(), msg, type }];
      return newLogs.length > 6 ? newLogs.slice(1) : newLogs;
    });
  }, []);

  // --- INITIALIZE BINS ---
  const initBins = () => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `LY-0${i + 1}`,
      x: 15 + Math.random() * 70, // 15% to 85% width
      y: 20 + Math.random() * 60, // 20% to 80% height
      fill: Math.random() * 30,
      rate: 0.5 + Math.random() * 1.5, // How fast it fills
      status: 'NOMINAL', // NOMINAL, PENDING_COLLECTION, OVERFLOW
    }));
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setOverflows(0);
    setFuel(100);
    setWave(1);
    setTime(0);
    setBins(initBins());
    setTrucks([]);
    setLogs([]);
    addLog("ML ROUTING ENGINE: ONLINE", "success");
    addLog("OBJECTIVE: DISPATCH TRUCKS AT 80% CAPACITY", "info");
  };

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const gameLoop = setInterval(() => {
      setTime(t => t + 1);

      // 1. Update Bin Fill Levels
      setBins(prevBins => {
        let newOverflows = 0;
        const updated = prevBins.map(bin => {
          if (bin.status === 'PENDING_COLLECTION') return bin; // Paused while truck is en route
          
          let newFill = bin.fill + (bin.rate * (1 + wave * 0.2)); // Fills faster each wave
          
          if (newFill >= 100) {
            newFill = 0; // Reset after overflow penalty
            newOverflows += 1;
            addLog(`[ALERT] ${bin.id} CRITICAL OVERFLOW!`, "error");
            screenShake.start({ x: [-10, 10, -10, 10, 0], transition: { duration: 0.3 } });
          }
          return { ...bin, fill: newFill, status: newFill > 80 ? 'WARNING' : 'NOMINAL' };
        });

        if (newOverflows > 0) {
          setOverflows(o => {
            const total = o + newOverflows;
            if (total >= 5) setGameState('GAMEOVER');
            return total;
          });
        }
        return updated;
      });

      // 2. Fuel Regen & Wave Progression
      setFuel(f => Math.min(100, f + 0.5));
      
      setScore(s => {
        if (s > wave * 1500) {
          setWave(w => {
            if (w === 3) { setGameState('WON'); return w; }
            addLog(`WAVE ${w + 1} MULTIPLIER ACTIVE`, "system");
            return w + 1;
          });
        }
        return s;
      });

    }, 200); // 5 ticks per second

    return () => clearInterval(gameLoop);
  }, [gameState, wave, screenShake, addLog]);

  // --- DISPATCH TRUCK (USER INTERACTION) ---
  const handleBinClick = (e, bin) => {
    e.stopPropagation();
    if (gameState !== 'PLAYING' || bin.status === 'PENDING_COLLECTION' || fuel < 15) {
      if (fuel < 15) addLog("INSUFFICIENT FUEL FOR DISPATCH", "error");
      return;
    }

    setFuel(f => f - 15);
    addLog(`DISPATCHING ROUTE TO ${bin.id}`, "system");

    // Lock bin
    setBins(prev => prev.map(b => b.id === bin.id ? { ...b, status: 'PENDING_COLLECTION' } : b));

    // Get coordinates for truck animation
    const rect = arenaRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    // Spawn Truck Line
    const truckId = Date.now();
    setTrucks(prev => [...prev, { id: truckId, endX: targetX, endY: targetY }]);

    // Resolve Collection after 1 second
    setTimeout(() => {
      setTrucks(prev => prev.filter(t => t.id !== truckId)); // Remove line
      
      // Calculate Score
      setBins(prev => prev.map(b => {
        if (b.id === bin.id) {
          let points = 0;
          let text = "";
          let type = "normal";

          if (b.fill >= 75 && b.fill <= 95) {
            points = 200; text = "OPTIMAL! +200"; type = "good"; // Perfect ML timing
            addLog(`${bin.id} COLLECTED OPTIMALLY`, "success");
          } else if (b.fill > 95) {
            points = 50; text = "CUT IT CLOSE! +50"; type = "warning";
          } else {
            points = -50; text = "INEFFICIENT! -50"; type = "bad"; // Collected too early
            addLog(`${bin.id} PREMATURE COLLECTION`, "warning");
          }

          setScore(s => Math.max(0, s + points));
          setFloatingTexts(ft => [...ft, { id: Date.now(), x: targetX, y: targetY, text, type }]);
          
          // Spawn Particles
          const newParticles = Array.from({ length: 10 }).map((_, i) => ({
            id: Date.now() + i, x: targetX, y: targetY, color: type === 'good' ? "bg-emerald-400" : "bg-teal-500"
          }));
          setParticles(p => [...p, ...newParticles]);

          return { ...b, fill: 0, status: 'NOMINAL' }; // Reset Bin
        }
        return b;
      }));
    }, 1000);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#020605] text-white overflow-hidden flex flex-col font-sans selection:bg-emerald-500 relative">
      <GameStyles />

      {/* --- TOP NAV --- */}
      <nav className="relative z-50 bg-[#050a08] border-b border-emerald-900/50 px-6 py-4 flex justify-between items-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/about')} className="text-neutral-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-emerald-400">Eco-Route Engine</h1>
            <p className="font-mono text-[10px] text-teal-500 uppercase tracking-[0.2em]">SWMS Predictive Simulator</p>
          </div>
        </div>

        {/* Global HUD */}
        <div className="flex gap-6 md:gap-12">
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-neutral-500 uppercase">System Score</span>
            <span className="font-mono text-2xl text-white font-bold">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-neutral-500 uppercase">Overflows</span>
            <span className={cn("font-mono text-2xl font-bold", overflows > 3 ? "text-red-500 animate-pulse" : "text-emerald-500")}>
              {overflows}/5
            </span>
          </div>
        </div>
      </nav>

      {/* --- MAIN GAMEPLAY AREA --- */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 p-6 gap-6 max-w-[1600px] mx-auto w-full h-full">
        
        {/* LEFT: THE MAP ARENA */}
        <motion.main 
          ref={arenaRef}
          animate={screenShake}
          className="flex-1 relative bg-[#060d0a] border border-emerald-900/50 rounded-2xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] hex-grid"
          style={{ minHeight: '65vh' }}
        >
          {/* Radar Sweep Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-emerald-500/10 opacity-20 pointer-events-none">
            <div className="absolute inset-0 rounded-full animate-[radarSweep_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 80%, rgba(16, 185, 129, 0.4) 100%)' }} />
          </div>

          {/* Menus (Start / Win / Lose) */}
          <AnimatePresence>
            {gameState !== 'PLAYING' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
              >
                <div className="text-center max-w-2xl px-6">
                  {gameState === 'MENU' && <Map className="w-16 h-16 text-emerald-500 mx-auto mb-6" />}
                  {gameState === 'GAMEOVER' && <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />}
                  {gameState === 'WON' && <ShieldCheck className="w-16 h-16 text-teal-400 mx-auto mb-6" />}
                  
                  <h2 className={cn("text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4", 
                    gameState === 'WON' ? "text-teal-400" : (gameState === 'GAMEOVER' ? "text-red-500" : "text-white")
                  )}>
                    {gameState === 'MENU' ? 'SWMS Routing' : (gameState === 'WON' ? 'Optimization Complete' : 'System Overwhelmed')}
                  </h2>
                  
                  <p className="text-neutral-400 font-mono text-sm leading-relaxed mb-8">
                    {gameState === 'MENU' 
                      ? "Play the role of the Random Forest algorithm. Click bins to dispatch trucks when they reach 80% capacity. Collecting too early wastes fuel. Missing a full bin causes overflow."
                      : `Final Score: ${score} | Overflows: ${overflows}/5 | Waves Cleared: ${wave}`
                    }
                  </p>

                  <button onClick={startGame} className="group relative px-8 py-4 bg-emerald-600 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    {gameState === 'MENU' ? 'Initialize AI Routing' : 'Restart Simulation'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Truck Dispatch Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {trucks.map(truck => (
              <motion.line
                key={truck.id}
                x1="50%" y1="100%" // Trucks always spawn from bottom center (depot)
                x2={truck.endX} y2={truck.endY}
                stroke="#10b981" strokeWidth="3" strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: 0 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            ))}
          </svg>

          {/* Render Bins */}
          {bins.map(bin => (
            <div
              key={bin.id}
              onClick={(e) => handleBinClick(e, bin)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
              style={{ left: `${bin.x}%`, top: `${bin.y}%` }}
            >
              {/* Pulse effect if nearing full */}
              {bin.fill > 75 && bin.status !== 'PENDING_COLLECTION' && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping scale-[2]" />
              )}
              
              <div className={cn(
                "relative w-12 h-14 border-2 rounded-t-sm rounded-b-lg flex flex-col justify-end overflow-hidden transition-all duration-300",
                bin.status === 'PENDING_COLLECTION' ? "border-teal-500 bg-teal-900/50" : "border-white/20 bg-black",
                bin.fill > 80 && "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              )}>
                {/* The "Waste" Fill Level */}
                <div 
                  className={cn("w-full transition-all duration-200", 
                    bin.fill > 90 ? "bg-red-500" : (bin.fill > 70 ? "bg-emerald-500" : "bg-neutral-600")
                  )}
                  style={{ height: `${bin.fill}%` }} 
                />
              </div>
              
              {/* Bin Metadata Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 border border-white/10 rounded font-mono text-[10px] whitespace-nowrap text-center">
                <span className="text-white block">{bin.id}</span>
                <span className={bin.fill > 80 ? "text-emerald-400" : "text-neutral-400"}>{Math.floor(bin.fill)}%</span>
              </div>

              {/* Status Lock Icon */}
              {bin.status === 'PENDING_COLLECTION' && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-teal-400 animate-pulse">
                  <Activity className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Render Effects */}
          {particles.map(p => <Particle key={p.id} {...p} onComplete={() => setParticles(arr => arr.filter(item => item.id !== p.id))} />)}
          {floatingTexts.map(t => <FloatingText key={t.id} {...t} onComplete={() => setFloatingTexts(arr => arr.filter(item => item.id !== t.id))} />)}
        </motion.main>

        {/* RIGHT: SYSTEM TELEMETRY PANEL */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          
          {/* Dispatch Fuel / Fleet Status */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-400" /> Fleet Dispatch Energy
            </h3>
            <div className="h-4 bg-black rounded-full overflow-hidden border border-white/10 p-[2px]">
              <motion.div 
                className={cn("h-full rounded-full transition-colors duration-300", fuel < 20 ? "bg-red-500" : "bg-emerald-500")}
                animate={{ width: `${fuel}%` }} transition={{ duration: 0.2 }}
              />
            </div>
            <p className="font-mono text-[10px] text-neutral-500 mt-2 text-right">COST: 15% PER ROUTE</p>
          </div>

          {/* ML Performance Metrics */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-4">
              <BarChart className="w-4 h-4 text-teal-400" /> Live Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="font-mono text-[10px] text-neutral-500">Current Wave</span>
                <span className="text-xl font-bold text-white">{wave}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="font-mono text-[10px] text-neutral-500">Time Active</span>
                <span className="text-xl font-bold text-white">{Math.floor(time / 5)}s</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] text-neutral-500">Prediction RMSE</span>
                <span className="text-xl font-bold text-teal-400">4.82%</span>
              </div>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="flex-1 bg-[#050a08] border border-emerald-900/50 rounded-xl p-4 flex flex-col min-h-[250px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Server className="w-16 h-16" /></div>
            <h3 className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest border-b border-emerald-900 pb-2 mb-2">Network Feed</h3>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar font-mono text-[10px] space-y-1.5 flex flex-col justify-end z-10">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={cn("leading-relaxed",
                      log.type === 'error' && "text-red-400 font-bold",
                      log.type === 'warning' && "text-yellow-400",
                      log.type === 'success' && "text-emerald-400",
                      log.type === 'system' && "text-teal-500",
                      log.type === 'info' && "text-neutral-400"
                    )}
                  >
                    &gt; {log.msg}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}