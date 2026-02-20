import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, Cpu, Activity, Database, CloudRain, Wifi, BarChart3, 
  ChevronRight, MapPin, Server, Zap, ShieldCheck, Network,
  Binary, Trash2, LineChart, TrendingDown, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// UTILITIES
// ============================================================================
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// ANIMATION LAYER 1: SENSOR NETWORK CONSTELLATION
// ============================================================================
const NetworkBackground = () => {
  const nodes = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.1,
    vy: (Math.random() - 0.5) * 0.1,
    size: Math.random() * 3 + 1
  })), []);

  const [activeNodes, setActiveNodes] = useState(nodes);

  useEffect(() => {
    let animationFrame;
    const updateNodes = () => {
      setActiveNodes(prev => prev.map(node => {
        let newX = node.x + node.vx;
        let newY = node.y + node.vy;
        if (newX < 0 || newX > 100) node.vx *= -1;
        if (newY < 0 || newY > 100) node.vy *= -1;
        return { ...node, x: newX, y: newY };
      }));
      animationFrame = requestAnimationFrame(updateNodes);
    };
    animationFrame = requestAnimationFrame(updateNodes);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
      <svg className="absolute inset-0 w-full h-full">
        {activeNodes.map((node, i) => {
          // Draw lines to nearby nodes
          const connections = activeNodes.slice(i + 1).filter(other => {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            return Math.sqrt(dx*dx + dy*dy) < 15; // Connection radius
          });
          return connections.map(other => (
            <line 
              key={`${node.id}-${other.id}`}
              x1={`${node.x}%`} y1={`${node.y}%`} 
              x2={`${other.x}%`} y2={`${other.y}%`}
              stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1"
            />
          ));
        })}
      </svg>
      {activeNodes.map(node => (
        <div 
          key={node.id}
          className="absolute rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"
          style={{ width: node.size, height: node.size, left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENT: LIVE TELEMETRY TERMINAL
// ============================================================================
const TelemetryTerminal = () => {
  const [logs, setLogs] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const rawData = [
      '[SYS] INITIALIZING SIM800L MODEM...',
      '[NET] GPRS CONNECTION ESTABLISHED.',
      '{"bin_id":"LY-01", "fill":42, "wt_g":1250, "bat_v":3.8}',
      '{"bin_id":"LY-04", "fill":15, "wt_g":400, "bat_v":4.1}',
      '[WARN] LY-07 LIQUID SENSOR > 600 (WET WASTE DETECTED)',
      '{"bin_id":"LY-09", "fill":81, "wt_g":4100, "bat_v":3.7} [ALERT]',
      '[ML_NODE] RANDOM FOREST INFERENCE STARTED...',
      '[ML_NODE] LY-02 PREDICTION: 85% CAP WITHIN 4H',
      '[ROUTING] ADDING LY-02 TO COLLECTION QUEUE.',
      '[SYS] SLEEP CYCLE INITIATED (30s)'
    ];

    let i = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, rawData[i]];
        if (newLogs.length > 8) newLogs.shift(); // Keep last 8 lines
        return newLogs;
      });
      i = (i + 1) % rawData.length;
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#050a08] border border-emerald-500/20 rounded-xl overflow-hidden shadow-2xl relative group">
      {/* Terminal Header */}
      <div className="bg-emerald-950/50 px-4 py-2 flex items-center justify-between border-b border-emerald-500/20">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="font-mono text-[10px] text-emerald-500/70 tracking-widest uppercase">Live Payload Stream</span>
      </div>
      {/* Terminal Body */}
      <div className="p-4 font-mono text-xs text-emerald-400 h-40 flex flex-col justify-end relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div 
              key={index + log}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={cn("mb-1 truncate", log.includes('[WARN]') || log.includes('[ALERT]') ? "text-red-400" : (log.includes('[ML_NODE]') ? "text-teal-300" : ""))}
            >
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: CIRCULAR SVG GAUGE
// ============================================================================
const CircularGauge = ({ value, label, color, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.8, type: "spring" }}
      className="flex flex-col items-center justify-center p-4 bg-neutral-900/40 border border-white/5 rounded-2xl backdrop-blur-md relative overflow-hidden"
    >
      <div className="relative w-20 h-20 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle 
            cx="50%" cy="50%" r="40%" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: value / 100 }} transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-white">
          {value}%
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 text-center">{label}</span>
    </motion.div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function Welcome() {
  const navigate = useNavigate();

  // --- Parallax & 3D Mouse Effects ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-5deg", "5deg"]);

  // --- Scroll Effects ---
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const xPct = (e.clientX / window.innerWidth) - 0.5;
      const yPct = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(xPct);
      mouseY.set(yPct);
    };
    if (window.innerWidth > 768) window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="bg-[#020605] text-white min-h-[200vh] selection:bg-emerald-500/30 font-sans relative overflow-x-hidden">
      
      {/* GLOBAL AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NetworkBackground />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px]" />
      </div>

      {/* ========================================================================= */}
      {/* HERO VIEWPORT (100vh) */}
      {/* ========================================================================= */}
      <motion.section 
        style={{ opacity: opacityFade, y: yParallax }}
        className="relative z-10 min-h-screen max-w-[1400px] mx-auto px-6 pt-20 pb-12 flex flex-col justify-center"
      >
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* --- LEFT: TYPOGRAPHY & CTA --- */}
          <div className="lg:col-span-6 space-y-8 relative z-50">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-mono text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> System Active
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded text-teal-400 font-mono text-[10px] uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> Loyola College Pilot
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.05]"
              >
                Intelligent <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Waste</span> Routing.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-neutral-400 text-base md:text-lg max-w-xl leading-relaxed"
              >
                Replacing rigid collection schedules with an IoT-driven, Machine Learning architecture. Built with ultrasonic sensing and Random Forest predictive analytics to eliminate overflow.
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 pt-4">
             
              <button 
                type="button" onClick={() => navigate('/about')}
                className="group px-8 py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest rounded-lg transition-all hover:bg-white/5 cursor-pointer"
              >
                View Research
              </button>
            </motion.div>

          </div>

          {/* --- RIGHT: 3D HOLOGRAPHIC UI PRESENTATION --- */}
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="lg:col-span-6 relative perspective-[1000px] pointer-events-none hidden md:block mt-12 lg:mt-0"
          >
            {/* Holographic Base Plate */}
            <div className="absolute bottom-[-10%] left-[10%] w-[80%] h-32 bg-emerald-500/10 rounded-full blur-2xl" style={{ transform: 'rotateX(70deg) translateZ(-150px)' }} />

            {/* Central UI Stack */}
            <div className="relative w-full max-w-lg mx-auto" style={{ transformStyle: 'preserve-3d' }}>
              
              {/* Layer 1: ML Model Card (Back) */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -top-16 -right-8 w-64 bg-neutral-900/60 border border-teal-500/30 p-4 rounded-xl backdrop-blur-md shadow-2xl"
                style={{ transform: 'translateZ(-50px)' }}
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="font-mono text-[10px] text-teal-400 uppercase">RF Model Predictor</span>
                  <Network className="w-4 h-4 text-teal-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">Test RMSE:</span><span className="text-white font-mono">4.82%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">R² Score:</span><span className="text-white font-mono">0.912</span></div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">Horizon:</span><span className="text-white font-mono">4 Hours</span></div>
                </div>
              </motion.div>

              {/* Layer 2: Main Terminal (Middle) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
                className="relative z-20" style={{ transform: 'translateZ(0px)' }}
              >
                <TelemetryTerminal />
              </motion.div>

              {/* Layer 3: Sensor Data Dials (Front) */}
              <div className="absolute -bottom-12 -left-8 flex gap-4 z-30" style={{ transform: 'translateZ(50px)' }}>
                <CircularGauge value={42} label="Bin Capacity" color="#10b981" delay={0.8} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.8 }}
                  className="flex flex-col items-center justify-center p-4 bg-neutral-900/80 border border-teal-500/30 rounded-2xl backdrop-blur-xl shadow-2xl"
                >
                   <BarChart3 className="w-8 h-8 text-teal-400 mb-2" />
                   <div className="font-bold text-xl text-white">1.2<span className="text-xs text-neutral-500 ml-1">kg</span></div>
                   <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mt-1">HX711 Load</span>
                </motion.div>
              </div>

            </div>
          </motion.div>

        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">Explore Architecture</span>
          <div className="w-px h-8 bg-gradient-to-b from-emerald-500 to-transparent" />
        </motion.div>
      </motion.section>

      {/* ========================================================================= */}
      {/* ARCHITECTURE SHOWCASE (SCROLL SECTION) */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 py-32 bg-[#020605]">
        
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            System <span className="text-emerald-500">Architecture</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">A seamless pipeline from edge sensing to cloud prediction, eliminating 45.1% of unnecessary campus collection trips.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Perception Layer */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="bg-neutral-900/30 border border-white/5 p-8 rounded-2xl group hover:border-emerald-500/50 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity"><Cpu className="w-32 h-32 text-emerald-500" /></div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">1. Perception Layer</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Custom-built hardware powered by Arduino Leonardo. Utilizes HC-SR04 ultrasonic range finders for depth and HX711 strain-gauges for weight.
            </p>
            <ul className="space-y-2 font-mono text-[10px] text-emerald-400 uppercase tracking-widest border-t border-white/10 pt-4">
              <li>+ Sub-centimeter Accuracy</li>
              <li>+ Resistive Liquid Detection</li>
              <li>+ Battery Voltage Monitoring</li>
            </ul>
          </motion.div>

          {/* Card 2: Telemetry Layer */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-neutral-900/30 border border-white/5 p-8 rounded-2xl group hover:border-teal-500/50 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity"><Wifi className="w-32 h-32 text-teal-500" /></div>
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 border border-teal-500/30">
              <Network className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">2. Telemetry & Cloud</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              SIM800L GSM/GPRS modems transmit encrypted JSON payloads via HTTP POST. Data is ingested into a RESTful API and stored centrally.
            </p>
            <ul className="space-y-2 font-mono text-[10px] text-teal-400 uppercase tracking-widest border-t border-white/10 pt-4">
              <li>+ 5-Minute Cyclic Transmissions</li>
              <li>+ Hysteresis False-Alert Suppression</li>
              <li>+ Sub-4s SMS Latency</li>
            </ul>
          </motion.div>

          {/* Card 3: Intelligence Layer */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-neutral-900/30 border border-white/5 p-8 rounded-2xl group hover:border-purple-500/50 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity"><LineChart className="w-32 h-32 text-purple-500" /></div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30">
              <Binary className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3. Predictive Analytics</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              A Random Forest regression model trained on 7,056 campus observations. Predicts bin fill levels 4 hours ahead for proactive routing.
            </p>
            <ul className="space-y-2 font-mono text-[10px] text-purple-400 uppercase tracking-widest border-t border-white/10 pt-4">
              <li>+ R² Score: 0.912</li>
              <li>+ Forecast Horizon: 4 Hours</li>
              <li>+ Feature Eng: Temporal & Cluster</li>
            </ul>
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* IMPACT METRICS SECTION */}
      {/* ========================================================================= */}
      <section className="relative z-20 border-t border-white/5 bg-[#030806] py-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-500/20 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
               
               {/* Background effect */}
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTYsMTg1LDEyOSwwLjE1KSIvPjwvc3ZnPg==')] z-0 opacity-50" />

               <div className="relative z-10 md:w-1/2 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white font-mono text-xs uppercase tracking-widest">
                     <TrendingDown className="w-4 h-4 text-emerald-400" /> Pilot Results
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                    Optimizing Campus Sustainability.
                  </h2>
                  <p className="text-neutral-400 leading-relaxed">
                    A 12-week controlled pilot across 12 instrumented bins demonstrated massive efficiency gains over traditional rigid collection schedules.
                  </p>
               </div>

               <div className="relative z-10 md:w-1/2 grid grid-cols-2 gap-6 w-full">
                  <div className="bg-black/50 border border-emerald-500/30 p-6 rounded-2xl text-center backdrop-blur-sm">
                     <div className="text-4xl md:text-5xl font-black text-emerald-400 mb-2">45.1%</div>
                     <div className="font-mono text-xs text-neutral-400 uppercase tracking-wider">Time Reduction</div>
                  </div>
                  <div className="bg-black/50 border border-teal-500/30 p-6 rounded-2xl text-center backdrop-blur-sm">
                     <div className="text-4xl md:text-5xl font-black text-teal-400 mb-2">88.9%</div>
                     <div className="font-mono text-xs text-neutral-400 uppercase tracking-wider">Less Overflow</div>
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}