import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Radio, Scale, Droplets, 
  Database, Network, Smartphone, LineChart,
  CheckCircle2, FileText, Server, GitMerge
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
// DATA SOURCED DIRECTLY FROM THE CONFERENCE PAPER
// ============================================================================
const hardwareSpecs = [
  {
    id: "mcu",
    title: "Arduino Leonardo",
    icon: <Cpu className="w-8 h-8 text-emerald-400" />,
    specs: ["ATmega32u4, 16 MHz", "32 KB Flash", "Native USB HID"],
    desc: "The central processing unit coordinating sensor acquisition, threshold evaluation, and GSM transmission every 30 seconds."
  },
  {
    id: "ultrasonic",
    title: "HC-SR04 Transducer",
    icon: <Radio className="w-8 h-8 text-teal-400" />,
    specs: ["40 kHz bursts", "2-400 cm range", "±3 mm accuracy"],
    desc: "Measures distance to waste surface. Fill percentage is derived via F = (1 - d/D) × 100."
  },
  {
    id: "loadcell",
    title: "HX711 + Load Cell",
    icon: <Scale className="w-8 h-8 text-emerald-500" />,
    specs: ["24-bit delta-sigma ADC", "5 kg capacity", "±1 g resolution"],
    desc: "Amplifies the Wheatstone bridge output. Supplements fill-level readings and flags anomalously heavy deposits."
  },
  {
    id: "liquid",
    title: "Resistive Liquid Sensor",
    icon: <Droplets className="w-8 h-8 text-teal-500" />,
    specs: ["Interdigitated copper", "10-bit ADC", "Threshold: ≥ 600"],
    desc: "Outputs an analogue voltage proportional to water contact area, triggering wet-waste segregation flags."
  }
];

const mlFeatures = [
  { name: "fill_t", desc: "Current fill level (%)", importance: "0.34" },
  { name: "Δfill_3h", desc: "Fill change in 3 hours", importance: "0.21" },
  { name: "hour", desc: "Hour of day (0-23)", importance: "0.16" },
  { name: "Δfill_1h", desc: "Fill change in 1 hour", importance: "0.12" },
];

// ============================================================================
// COMPONENT: 3D HARDWARE CARD
// ============================================================================
const HardwareCard = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative bg-neutral-900/40 border border-white/5 rounded-2xl p-6 md:p-8 hover:border-emerald-500/40 transition-colors backdrop-blur-sm overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 bg-neutral-950 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500">
          {item.icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
        <p className="text-neutral-400 text-sm leading-relaxed mb-6 h-20">
          {item.desc}
        </p>
        <ul className="space-y-2 border-t border-white/10 pt-4">
          {item.specs.map((spec, i) => (
            <li key={i} className="flex items-center gap-2 text-xs font-mono text-emerald-400/80">
              <div className="w-1 h-1 bg-emerald-400 rounded-full" /> {spec}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT: ANIMATED ML PIPELINE SVG
// ============================================================================
const MLPipeline = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="w-full py-12 overflow-hidden relative">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
        
        {/* Node 1: Sensors */}
        <div className="z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-neutral-900 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Radio className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="font-mono text-xs text-neutral-400 mt-4 uppercase tracking-widest">Edge Telemetry</span>
        </div>

        {/* Animated Connecting Line 1 */}
        <div className="hidden md:block flex-1 h-px bg-white/10 relative mx-4">
          {isInView && (
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-emerald-400 shadow-[0_0_10px_#10b981] transform -translate-y-1/2"
              initial={{ width: "0%", left: "0%" }}
              animate={{ width: ["0%", "100%", "0%"], left: ["0%", "0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Node 2: REST API */}
        <div className="z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-neutral-900 border-2 border-teal-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.2)]">
            <Server className="w-8 h-8 text-teal-400" />
          </div>
          <span className="font-mono text-xs text-neutral-400 mt-4 uppercase tracking-widest">Cloud API</span>
        </div>

        {/* Animated Connecting Line 2 */}
        <div className="hidden md:block flex-1 h-px bg-white/10 relative mx-4">
          {isInView && (
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-teal-400 shadow-[0_0_10px_#14b8a6] transform -translate-y-1/2"
              initial={{ width: "0%", left: "0%" }}
              animate={{ width: ["0%", "100%", "0%"], left: ["0%", "0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Node 3: Random Forest */}
        <div className="z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-neutral-900 border-2 border-purple-500 rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.2)]">
             <GitMerge className="w-10 h-10 text-purple-400 -rotate-45" />
          </div>
          <span className="font-mono text-xs text-purple-400 mt-6 uppercase tracking-widest">Random Forest</span>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// MAIN ABOUT PAGE COMPONENT
// ============================================================================
export default function About() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div className="min-h-screen bg-[#020605] text-white selection:bg-emerald-500/30 font-sans relative overflow-x-hidden pb-32">
      
      {/* Background Ambient Grid */}
      <motion.div style={{ y: yBg }} className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </motion.div>

      {/* --- NAVIGATION --- */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-colors font-mono text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
        <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-500 uppercase tracking-widest border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">
          <FileText className="w-3 h-3" /> Research Overview
        </div>
      </nav>

      {/* --- HEADER SECTION --- */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight mb-6">
            IoT-Enabled Smart Waste Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">System</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-8">
            With Machine Learning-Based Predictive Fill-Level Analytics: A Campus-Scale Deployment and Evaluation.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm font-mono text-neutral-500 border-y border-white/10 py-6">
            <div className="flex flex-col">
              <span className="text-white">A. Jai Harish</span>
              <span>Roll No: 24-PCS-026</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20" />
            <div className="flex flex-col">
              <span className="text-white">Dr. M. Regina</span>
              <span>Assistant Professor</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20" />
            <div className="flex flex-col">
              <span className="text-white">Loyola College</span>
              <span>Chennai - 34</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* --- THE ABSTRACT --- */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
          className="bg-neutral-900/50 border-l-4 border-emerald-500 p-8 md:p-12 rounded-r-3xl backdrop-blur-md"
        >
          <h2 className="text-xs font-mono text-emerald-400 uppercase tracking-[0.3em] mb-4">01. Abstract</h2>
          <p className="text-lg text-neutral-300 leading-relaxed">
            Urban waste infrastructure continues to depend on rigid, time-based collection schedules that ignore actual bin occupancy, resulting in unnecessary vehicle dispatches and frequent overflow. This research proposes, implements, and evaluates an IoT-enabled Smart Waste Management System (SWMS) augmented with a Random Forest regression model for predictive fill-level estimation.
          </p>
        </motion.div>
      </section>

      {/* --- HARDWARE ARCHITECTURE --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
            Perception <span className="text-emerald-500">Layer</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl">
            A modular, sub-₹3,000 smart bin prototype integrating ultrasonic, gravimetric, and liquid-detection sensing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hardwareSpecs.map((item, i) => (
            <HardwareCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* --- MACHINE LEARNING PIPELINE --- */}
      <section className="relative z-10 bg-[#040c09] border-y border-emerald-900/30 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
              Intelligence <span className="text-purple-500">Layer</span>
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Transforming historical fill trajectories into 4-hour forecasts to enable proactive scheduling.
            </p>
          </div>

          <MLPipeline />

          <div className="grid md:grid-cols-2 gap-12 mt-16 max-w-5xl mx-auto">
            {/* Model Performance */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-black border border-white/10 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <LineChart className="text-purple-500" /> Random Forest Performance
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2"><span className="text-neutral-400">RMSE (% fill)</span><span className="text-emerald-400">4.82%</span></div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "95%" }} transition={{ duration: 1 }} className="h-full bg-emerald-500" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2"><span className="text-neutral-400">R² Score</span><span className="text-teal-400">0.912</span></div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "91.2%" }} transition={{ duration: 1 }} className="h-full bg-teal-500" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-mono mb-2"><span className="text-neutral-400">MAPE</span><span className="text-purple-400">7.3%</span></div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: "92.7%" }} transition={{ duration: 1 }} className="h-full bg-purple-500" /></div>
                </div>
              </div>
            </motion.div>

            {/* Feature Importance */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-black border border-white/10 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Database className="text-teal-500" /> Top Predictive Features
              </h3>
              <div className="space-y-4">
                {mlFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <p className="font-mono text-emerald-400 text-sm">{feat.name}</p>
                      <p className="text-xs text-neutral-500">{feat.desc}</p>
                    </div>
                    <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{feat.importance}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 12-WEEK PILOT RESULTS --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32">
        <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-xs font-mono text-emerald-400 uppercase tracking-[0.3em] mb-4">Pilot Validation</h2>
          <h3 className="text-3xl md:text-5xl font-black text-white mb-12">12-Week Campus Deployment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="bg-black/50 p-8 rounded-2xl border border-white/5">
              <div className="text-5xl font-black text-emerald-400 mb-2">45.1%</div>
              <div className="text-sm font-mono text-neutral-400 uppercase tracking-widest mb-4">Time Reduction</div>
              <p className="text-xs text-neutral-500">Daily collection time fell from 132 min to 72.6 min.</p>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-black/50 p-8 rounded-2xl border border-white/5">
              <div className="text-5xl font-black text-teal-400 mb-2">88.9%</div>
              <div className="text-sm font-mono text-neutral-400 uppercase tracking-widest mb-4">Overflow Drop</div>
              <p className="text-xs text-neutral-500">Incidents decreased from 18 to just 2 during the SWMS period.</p>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="bg-black/50 p-8 rounded-2xl border border-white/5">
              <div className="text-5xl font-black text-purple-400 mb-2">±1.4<span className="text-2xl">cm</span></div>
              <div className="text-sm font-mono text-neutral-400 uppercase tracking-widest mb-4">Fill Accuracy</div>
              <p className="text-xs text-neutral-500">Sensor accuracy satisfied predefined benchmarks against manual tape measures.</p>
            </motion.div>
          </div>

          {/* Proceed to Game Button */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="mt-16">
            <button 
              onClick={() => navigate('/game')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
            >
              Test The System (Interactive) <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </motion.div>

        </div>
      </section>

    </div>
  );
}