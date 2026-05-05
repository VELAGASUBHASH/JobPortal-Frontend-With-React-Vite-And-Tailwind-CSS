import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext.jsx";
import { api } from "../Services/api.js";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s) {
    if (!s) return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    const m = { OPEN: ["emerald", "Open"], CLOSED: ["rose", "Closed"], PAUSED: ["amber", "Paused"] };
    const [c, l] = m[s] || ["slate", s];
    return { bg: `bg-${c}-500/10`, text: `text-${c}-400`, border: `border-${c}-500/20`, label: l };
}

// ─── Floating 3D Card ────────────────────────────────────────────────────────
function Card3D({ children, className = "" }) {
    const ref = useRef(null);
    const handleMouseMove = (e) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const rotX = ((e.clientY - rect.top - rect.height / 2) / rect.height) * -16;
        const rotY = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 16;
        el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.05,1.05,1.05)`;
    };
    const handleMouseLeave = () => {
        if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    };
    return (
        <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={className}
             style={{ transition: "transform 0.18s ease", transformStyle: "preserve-3d" }}>
            {children}
        </div>
    );
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "", duration = 2000 }) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    useEffect(() => {
        if (!started) return;
        let s = 0; const step = end / (duration / 16);
        const t = setInterval(() => { s += step; if (s >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
        return () => clearInterval(t);
    }, [started, end, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function ParticleCanvas() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        const particles = Array.from({ length: 85 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2.2 + 0.4,
            dx: (Math.random() - 0.5) * 0.38, dy: (Math.random() - 0.5) * 0.38,
            opacity: Math.random() * 0.55 + 0.12,
            hue: Math.random() > 0.55 ? 240 : 270,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > W) p.dx *= -1;
                if (p.y < 0 || p.y > H) p.dy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue},78%,66%,${p.opacity})`; ctx.fill();
            });
            for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 125) {
                    const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    grad.addColorStop(0, `hsla(240,78%,66%,${0.14*(1-dist/125)})`);
                    grad.addColorStop(1, `hsla(270,78%,66%,${0.14*(1-dist/125)})`);
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = grad; ctx.lineWidth = 0.65; ctx.stroke();
                }
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener("resize", onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Perspective Grid ─────────────────────────────────────────────────────────
function GridLines() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: 0.032 }}>
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)",
                backgroundSize: "64px 64px",
                transform: "perspective(700px) rotateX(16deg) scale(1.35)",
                transformOrigin: "50% 0%",
                maskImage: "linear-gradient(to bottom,transparent,black 28%,black 72%,transparent)",
                WebkitMaskImage: "linear-gradient(to bottom,transparent,black 28%,black 72%,transparent)",
            }} />
        </div>
    );
}

// ─── Apply Success Overlay ────────────────────────────────────────────────────
function ApplySuccess({ job, onClose }) {
    const [phase, setPhase] = useState(0);
    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 600);
        const t2 = setTimeout(() => setPhase(2), 1400);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    const confetti = Array.from({ length: 40 }, (_, i) => ({
        id: i, left: Math.random() * 100, delay: Math.random() * 0.9,
        color: ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f43f5e"][i % 7],
        size: Math.random() * 10 + 4,
    }));
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
             style={{ background: "rgba(7,8,15,0.94)", backdropFilter: "blur(20px)" }}>
            <style>{`
                @keyframes rocket-launch{0%{transform:translateY(0) scale(1);opacity:1}60%{transform:translateY(-130px) scale(1.5);opacity:1}100%{transform:translateY(-220px) scale(0.5);opacity:0}}
                @keyframes confetti-fall{0%{transform:translateY(-80px) rotate(0deg);opacity:1}100%{transform:translateY(500px) rotate(800deg);opacity:0}}
                @keyframes success-pop{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
                @keyframes check-draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
                @keyframes ring-pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.12)}}
                .rocket-anim{animation:rocket-launch 1.3s cubic-bezier(0.22,1,0.36,1) both}
                .success-pop{animation:success-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) both}
            `}</style>
            {phase >= 1 && confetti.map(c => (
                <div key={c.id} className="absolute top-0 pointer-events-none" style={{
                    left:`${c.left}%`,width:c.size,height:c.size,background:c.color,
                    borderRadius:Math.random()>0.5?"50%":"3px",
                    animation:`confetti-fall ${1.5+Math.random()*0.8}s ease-in ${c.delay}s both`,
                }} />
            ))}
            <div className="text-center px-4 max-w-sm w-full">
                {phase < 2 && <div className="rocket-anim text-8xl mb-4 inline-block">🚀</div>}
                {phase >= 2 && (
                    <div className="success-pop">
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="absolute w-40 h-40 rounded-full" style={{background:"radial-gradient(circle,rgba(16,185,129,0.35),transparent 70%)",animation:"ring-pulse 2s ease-in-out infinite"}}/>
                            <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-500/30" style={{animation:"ring-pulse 2s ease-in-out infinite 0.3s"}}/>
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.7)]">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeDasharray="100" strokeDashoffset="0" style={{animation:"check-draw 0.5s ease 0.1s both"}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white mb-2" style={{fontFamily:"'Syne',sans-serif"}}>Applied! 🎉</h2>
                        <p className="text-slate-400 text-base mb-1">You've successfully applied to</p>
                        <p className="text-indigo-300 font-bold text-xl mb-1" style={{fontFamily:"'Syne',sans-serif"}}>{job?.title}</p>
                        <p className="text-slate-500 text-sm mb-8">at {job?.company || "the company"}</p>
                        <button onClick={onClose} className="px-7 py-3.5 rounded-2xl font-bold text-white text-base w-full sm:w-auto transition-all duration-300 hover:scale-105"
                                style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 30px rgba(99,102,241,0.6)"}}>
                            Browse More Jobs →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, applied, onApply, applying }) {
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
    const [hovered, setHovered] = useState(false);
    const ref = useRef(null);

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        setTilt({ rx: ((e.clientY-r.top-r.height/2)/r.height)*-12, ry: ((e.clientX-r.left-r.width/2)/r.width)*12 });
    };

    const tagColors = ["indigo","violet","cyan","emerald","amber"];
    const sc = statusColor(job.jobStatus);
    const jobIdSafe = job.jobId || job.id; // Fallback for Java ID mapping
    const emoji = ["🏢","🚀","💼","🌐","⚡"][(jobIdSafe||0)%5];

    return (
        <div ref={ref} onMouseMove={onMove}
             onMouseLeave={()=>{setTilt({rx:0,ry:0});setHovered(false);}}
             onMouseEnter={()=>setHovered(true)}
             className="relative group bg-gradient-to-br from-[#12142b]/95 to-[#0d0f20]/95 border rounded-3xl p-5 sm:p-6 backdrop-blur-xl cursor-pointer overflow-hidden"
             style={{
                 transform:`perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                 transition:"transform 0.15s ease,box-shadow 0.4s ease,border-color 0.3s ease",
                 transformStyle:"preserve-3d",
                 borderColor: hovered ? "rgba(99,102,241,0.38)" : "rgba(99,102,241,0.14)",
                 boxShadow: hovered
                     ? "0 28px 70px rgba(0,0,0,0.55),0 0 40px rgba(99,102,241,0.14),inset 0 1px 0 rgba(255,255,255,0.07)"
                     : "0 6px 28px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.03)",
             }}>

            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                 style={{background:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.09) 0%,transparent 65%)"}}/>
            <div className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                 style={{background:"linear-gradient(90deg,transparent,rgba(139,92,246,0.65),transparent)"}}/>

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/20 flex items-center justify-center text-xl sm:text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                        {emoji}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                             style={{background:"radial-gradient(circle,rgba(99,102,241,0.22),transparent 70%)"}}/>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white font-black text-sm sm:text-base leading-tight truncate" style={{fontFamily:"'Syne',sans-serif"}}>{job.title}</h3>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">{job.company||"TechCorp"} · {job.location||"Remote"}</p>
                    </div>
                </div>
                <span className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-full border shrink-0 ml-2 ${sc.bg} ${sc.text} ${sc.border}`}>
                    {job.jobStatus||"OPEN"}
                </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2">
                {job.description||"Exciting opportunity to work with cutting-edge technologies in a fast-paced environment."}
            </p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
                {(job.requiredSkills||job.skills||["Java","Spring Boot"]).slice(0,4).map((s,i)=>(
                    <span key={s} className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg bg-${tagColors[i%5]}-500/10 text-${tagColors[i%5]}-400 border border-${tagColors[i%5]}-500/20`}>{s}</span>
                ))}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <div>
                        <span className="text-white font-black text-base sm:text-lg" style={{fontFamily:"'Syne',sans-serif"}}>
                            {job.salary?`₹${job.salary.toLocaleString()}`:"Negotiable"}
                        </span>
                        {job.salary&&<span className="text-slate-500 text-xs sm:text-sm"> LPA</span>}
                    </div>
                    <p className="text-slate-600 text-xs">{job.jobType||"Full-time"}</p>
                </div>
                {applied ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Applied
                    </div>
                ) : (
                    <button onClick={()=>onApply(job)} disabled={applying===jobIdSafe}
                            className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                            style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 18px rgba(99,102,241,0.38)"}}>
                        <span className="relative z-10">
                            {applying===jobIdSafe?(
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                    Applying…
                                </span>
                            ):"Apply Now"}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Floating Job Tags ────────────────────────────────────────────────────────
const JOB_TAGS = [
    { label: "React Dev",       color: "#6366f1", delay: "0s"   },
    { label: "Java Backend",    color: "#8b5cf6", delay: "0.4s" },
    { label: "UI/UX Design",    color: "#06b6d4", delay: "0.8s" },
    { label: "DevOps",          color: "#10b981", delay: "1.2s" },
    { label: "Data Science",    color: "#f59e0b", delay: "1.6s" },
    { label: "Cloud Architect", color: "#ef4444", delay: "2s"   },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, role, logout } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToJobs = (e) => {
        e.preventDefault();
        document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false);
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled?"bg-[#07080f]/93 backdrop-blur-2xl border-b border-indigo-500/20 shadow-[0_8px_40px_rgba(99,102,241,0.12)]":"bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">

                {/* Logo */}
                <div onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="flex items-center gap-2.5 group cursor-pointer shrink-0">
                    <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 rotate-6 group-hover:rotate-[18deg] transition-transform duration-400 shadow-[0_4px_16px_rgba(99,102,241,0.5)]"/>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </div>
                    </div>
                    <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent" style={{fontFamily:"'Syne',sans-serif"}}>RisePath</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    {[["#","Find Jobs",scrollToJobs],["/companies","Companies",null],["/about","About Us",null],["/contact","Contact",null]].map(([href,label,handler])=>
                        handler?(
                            <a key={label} href={href} onClick={handler} className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 relative group">
                                {label}<span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-300"/>
                            </a>
                        ):(
                            <Link key={label} to={href} className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 relative group">
                                {label}<span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-300"/>
                            </Link>
                        )
                    )}
                </div>

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    {!isAuthenticated?(
                        <>
                            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/60 rounded-xl transition-all duration-200 hover:bg-indigo-500/8">Sign In</Link>
                            <Link to="/register" className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                                  style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 20px rgba(99,102,241,0.4)"}}>Sign Up</Link>
                        </>
                    ):(
                        <>
                            <Link to={role==="ADMIN"?"/admin":"/dashboard"} className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all duration-300 hover:scale-105"
                                  style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 20px rgba(99,102,241,0.4)"}}>
                                {role==="ADMIN"?"Admin Panel":"My Dashboard"}
                            </Link>
                            <button onClick={logout} className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 rounded-xl transition-all">Logout</button>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl border border-slate-700/60 bg-white/4 text-slate-400 hover:text-white transition-all shrink-0"
                        onClick={()=>setMenuOpen(!menuOpen)}>
                    <div className="w-5 flex flex-col gap-1.5">
                        <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen?"rotate-45 translate-y-2":""}`}/>
                        <span className={`block h-0.5 bg-current rounded-full transition-all duration-200 ${menuOpen?"opacity-0 scale-x-0":""}`}/>
                        <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen?"-rotate-45 -translate-y-2":""}`}/>
                    </div>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-400 ${menuOpen?"max-h-[28rem] opacity-100":"max-h-0 opacity-0"}`}>
                <div className="px-4 pb-6 pt-2 space-y-1 bg-[#06070e]/98 backdrop-blur-2xl border-t border-indigo-500/10">
                    {[["#","🔍 Find Jobs",scrollToJobs],["/companies","🏢 Companies",null],["/about","ℹ️ About Us",null],["/contact","✉️ Contact",null]].map(([href,label,handler])=>
                        handler?(
                            <a key={label} href={href} onClick={handler} className="flex items-center px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">{label}</a>
                        ):(
                            <Link key={label} to={href} onClick={()=>setMenuOpen(false)} className="flex items-center px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">{label}</Link>
                        )
                    )}
                    <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-800/70 mt-2">
                        {!isAuthenticated?(
                            <>
                                <Link to="/login" onClick={()=>setMenuOpen(false)} className="py-3.5 text-center text-sm font-semibold text-slate-300 border border-slate-700/80 rounded-2xl hover:bg-white/5 transition-all">Sign In</Link>
                                <Link to="/register" onClick={()=>setMenuOpen(false)} className="py-3.5 text-center text-sm font-bold text-white rounded-2xl"
                                      style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 20px rgba(99,102,241,0.4)"}}>Sign Up Free</Link>
                            </>
                        ):(
                            <>
                                <Link to={role==="ADMIN"?"/admin":"/dashboard"} onClick={()=>setMenuOpen(false)} className="py-3.5 text-center text-sm font-bold text-white rounded-2xl"
                                      style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)"}}>
                                    {role==="ADMIN"?"Admin Panel":"My Dashboard"}
                                </Link>
                                <button onClick={()=>{logout();setMenuOpen(false);}} className="py-3.5 text-center text-sm font-semibold text-rose-400 border border-rose-500/20 rounded-2xl hover:bg-rose-500/8 transition-all">Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// ─── Main Hero + Jobs Section ─────────────────────────────────────────────────
export default function Hero() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [applying, setApplying] = useState(null);
    const [appliedIds, setAppliedIds] = useState(new Set());
    const [successJob, setSuccessJob] = useState(null);

    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 100);
        fetchJobs();
    }, []);

    useEffect(() => {
        const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    const fetchJobs = async () => {
        try {
            // Using your standard API
            const res = await api.get("/admin/job/alljobs");
            setJobs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Jobs fetch failed.");
            // NOTE: Dummy data removed as instructed!
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    };

    const px = (f=0.02) => ({
        transform:`translate(${(mousePos.x-(typeof window!=="undefined"?window.innerWidth:800)/2)*f}px,${(mousePos.y-(typeof window!=="undefined"?window.innerHeight:600)/2)*f}px)`,
        transition:"transform 0.1s linear",
    });

    const handleSearchClick = () => document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" });

    const applyJob = async (job) => {
        if (!isAuthenticated) { navigate("/login"); return; }
        if (role === "ADMIN") {
            toast.error("Admins cannot apply to jobs.");
            return;
        }

        const jobIdSafe = job.jobId || job.id;
        setApplying(jobIdSafe);
        try {
            await api.post(`/user/apply/${jobIdSafe}`);
            setAppliedIds(prev => new Set([...prev, jobIdSafe]));
            setSuccessJob(job);
        } catch (error) {
            console.error("Failed to apply:", error);
            const msg = error.response?.data?.message || "Failed to apply.";
            toast.error(msg);
        } finally {
            setApplying(null);
        }
    };

    const filteredJobs = jobs.filter(j => {
        const ms = j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase());
        const mf = filter === "ALL" || j.jobStatus === filter;
        return ms && mf;
    });

    return (
        <>
            <style>{`
                @keyframes float{0%,100%{transform:translateY(0px) rotate(0deg)}50%{transform:translateY(-20px) rotate(2deg)}}
                @keyframes floatReverse{0%,100%{transform:translateY(0px)}50%{transform:translateY(20px)}}
                @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 45px rgba(99,102,241,0.75),0 0 90px rgba(139,92,246,0.3)}}
                @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                @keyframes drift{0%{transform:translate(0,0) scale(1)}33%{transform:translate(32px,-22px) scale(1.06)}66%{transform:translate(-22px,16px) scale(0.95)}100%{transform:translate(0,0) scale(1)}}
                @keyframes slide-up{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
                @keyframes tag-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.03)}}
                @keyframes card-in{from{opacity:0;transform:translateY(24px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
                @keyframes hero-glow{0%,100%{opacity:0.5}50%{opacity:1}}
                @keyframes orb-drift{0%{transform:translate(0,0)}25%{transform:translate(38px,-28px)}50%{transform:translate(-20px,38px)}75%{transform:translate(28px,18px)}100%{transform:translate(0,0)}}
                @keyframes dot-orbit{0%{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)}100%{transform:rotate(360deg) translateX(var(--r)) rotate(-360deg)}}

                .animate-slide-up{animation:slide-up 0.85s cubic-bezier(0.22,1,0.36,1) both}
                .card-in{animation:card-in 0.55s cubic-bezier(0.22,1,0.36,1) both}
                .delay-100{animation-delay:0.1s}.delay-200{animation-delay:0.2s}
                .delay-300{animation-delay:0.3s}.delay-400{animation-delay:0.4s}
                .delay-500{animation-delay:0.5s}.delay-600{animation-delay:0.6s}
                .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
            `}</style>

            <div className="relative min-h-screen overflow-x-hidden"
                 style={{background:"linear-gradient(148deg,#06070e 0%,#09091a 42%,#070912 100%)",fontFamily:"'DM Sans',sans-serif"}}>

                <ParticleCanvas />
                <GridLines />

                {/* Ambient orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:1}}>
                    <div style={{position:"absolute",top:"4%",left:"6%",width:700,height:700,background:"radial-gradient(circle,rgba(99,102,241,0.11) 0%,transparent 65%)",borderRadius:"50%",animation:"orb-drift 16s ease-in-out infinite"}}/>
                    <div style={{position:"absolute",bottom:"6%",right:"4%",width:560,height:560,background:"radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 65%)",borderRadius:"50%",animation:"orb-drift 21s ease-in-out infinite reverse"}}/>
                    <div style={{position:"absolute",top:"38%",right:"20%",width:300,height:300,background:"radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 65%)",borderRadius:"50%",animation:"orb-drift 12s ease-in-out infinite 2.5s"}}/>
                    <div style={{position:"absolute",top:"65%",left:"12%",width:220,height:220,background:"radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 65%)",borderRadius:"50%",animation:"orb-drift 10s ease-in-out infinite 1s"}}/>
                </div>

                <Navbar />

                {/* ════ HERO ════ */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 sm:pb-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-16" style={{zIndex:10}}>

                    {/* Left column */}
                    <div className={`flex-1 max-w-2xl w-full ${visible?"animate-slide-up":"opacity-0"}`}>

                        <div className="animate-slide-up delay-100 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/8 backdrop-blur-sm mb-7">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{animation:"pulse-glow 2s ease-in-out infinite",boxShadow:"0 0 8px rgba(52,211,153,0.9)"}}/>
                            <span className="text-xs sm:text-sm text-indigo-300 font-semibold">🚀 500+ Companies Hiring Right Now</span>
                        </div>

                        <h1 className="animate-slide-up delay-200 font-black leading-[0.92] tracking-tight mb-5 sm:mb-6"
                            style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(2.5rem,5.8vw,5.2rem)"}}>
                            <span className="text-white block">Find Your</span>
                            <span className="block my-1 sm:my-1.5" style={{
                                background:"linear-gradient(135deg,#818cf8 0%,#c084fc 45%,#38bdf8 100%)",
                                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                                filter:"drop-shadow(0 0 28px rgba(139,92,246,0.45))",
                            }}>Dream Career</span>
                            <span className="text-white block">Today.</span>
                        </h1>

                        <p className="animate-slide-up delay-300 text-slate-400 text-base sm:text-lg leading-relaxed mb-7 sm:mb-9 max-w-xl">
                            Connect with top companies across tech, design, and beyond. Your next big opportunity is just one search away.
                        </p>

                        {/* Search bar */}
                        <div className="animate-slide-up delay-400 flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-2xl border border-indigo-500/20 bg-white/4 backdrop-blur-lg mb-6 shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-indigo-500/40 transition-all duration-300">
                            <div className="flex items-center gap-3 flex-1 px-3 sm:px-4">
                                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                                       onKeyDown={e=>e.key==="Enter"&&handleSearchClick()}
                                       placeholder="Job title, skills or company..."
                                       className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base outline-none py-3 sm:py-0"/>
                            </div>
                            <button onClick={handleSearchClick}
                                    className="relative px-5 sm:px-7 py-3 rounded-xl font-bold text-white text-sm overflow-hidden shrink-0 transition-all duration-300 hover:scale-[1.03] active:scale-95"
                                    style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 24px rgba(99,102,241,0.55)"}}>
                                <span className="relative z-10">Search Jobs</span>
                                <div className="absolute inset-0" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)",backgroundSize:"200%",animation:"shimmer 2.5s ease infinite"}}/>
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="animate-slide-up delay-600 flex gap-5 sm:gap-10 mt-8 sm:mt-12 pt-7 sm:pt-8 border-t border-slate-800/80">
                            {[{end:12000,suffix:"+",label:"Active Jobs"},{end:850,suffix:"+",label:"Companies"},{end:95,suffix:"%",label:"Placement Rate"}].map(({end,suffix,label})=>(
                                <div key={label}>
                                    <div className="text-2xl sm:text-3xl font-black" style={{fontFamily:"'Syne',sans-serif",background:"linear-gradient(135deg,#818cf8,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                                        <Counter end={end} suffix={suffix}/>
                                    </div>
                                    <div className="text-slate-500 text-xs sm:text-sm font-medium mt-1">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column – 3D visual (desktop only) */}
                    <div className="hidden lg:flex flex-1 relative items-center justify-center min-h-[520px] w-full">

                        {/* Orbit rings with glowing dots */}
                        {[{sz:480,dur:"32s",color:"#6366f1",r:240},{sz:375,dur:"22s",color:"#8b5cf6",r:187},{sz:280,dur:"15s",color:"#06b6d4",r:140}].map(({sz,dur,color,r},i)=>(
                            <div key={i} style={{position:"absolute",width:sz,height:sz,borderRadius:"50%",border:`1px solid ${color}18`,animation:`spin-slow ${dur} linear infinite ${i%2?"reverse":""}`}}>
                                <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,borderRadius:"50%",background:color,boxShadow:`0 0 12px ${color}`}}/>
                            </div>
                        ))}

                        {/* Center glow */}
                        <div style={{position:"absolute",width:230,height:230,background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)",borderRadius:"50%",animation:"hero-glow 3s ease-in-out infinite",...px(0.01)}}/>

                        {/* Main 3D card */}
                        <div style={{...px(0.015),zIndex:20}}>
                            <Card3D className="w-72 bg-gradient-to-br from-[#13152a]/98 to-[#0e1022]/98 border border-indigo-500/25 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.65),0_0_50px_rgba(99,102,241,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]">
                                <div className="absolute top-0 left-6 right-6 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(139,92,246,0.65),transparent)"}}/>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-[0_4px_16px_rgba(99,102,241,0.28)]">🏢</div>
                                        <div>
                                            <div className="text-white font-bold text-sm" style={{fontFamily:"'Syne',sans-serif"}}>TechCorp Inc.</div>
                                            <div className="text-slate-500 text-xs">Hyderabad, IN</div>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full" style={{boxShadow:"0 0 10px rgba(52,211,153,0.25)"}}>Hiring</span>
                                </div>
                                <div className="text-white font-black text-lg mb-1" style={{fontFamily:"'Syne',sans-serif"}}>Senior React Developer</div>
                                <div className="text-slate-500 text-sm mb-4">Full-time · 4–7 Years</div>
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {["React","TypeScript","Node.js"].map(t=>(
                                        <span key={t} className="px-2.5 py-1 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{t}</span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xl font-black text-white" style={{fontFamily:"'Syne',sans-serif"}}>₹28–40</span>
                                        <span className="text-slate-500 text-sm"> LPA</span>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-bold text-white rounded-xl pointer-events-none"
                                            style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 18px rgba(99,102,241,0.5)"}}>Apply Now</button>
                                </div>
                            </Card3D>
                        </div>

                        {/* Floating mini cards */}
                        <div style={{position:"absolute",top:"3%",right:"3%",animation:"float 5.5s ease-in-out infinite",zIndex:30,...px(0.03)}}>
                            <Card3D className="w-48 rounded-2xl p-4 backdrop-blur-xl border border-violet-500/25" style={{background:"rgba(13,14,32,0.92)",boxShadow:"0 20px 50px rgba(0,0,0,0.5),0 0 20px rgba(139,92,246,0.12)"}}>
                                <div className="absolute top-0 left-4 right-4 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(139,92,246,0.55),transparent)"}}/>
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-pink-500/25 flex items-center justify-center text-lg">🚀</div>
                                    <div>
                                        <div className="text-white font-bold text-xs" style={{fontFamily:"'Syne',sans-serif"}}>Spring Boot Dev</div>
                                        <div className="text-slate-500 text-xs">Remote</div>
                                    </div>
                                </div>
                                <div className="text-violet-300 font-black text-sm" style={{fontFamily:"'Syne',sans-serif"}}>₹22–35 LPA</div>
                            </Card3D>
                        </div>

                        <div style={{position:"absolute",bottom:"5%",left:"1%",animation:"floatReverse 6.5s ease-in-out infinite 1s",zIndex:30,...px(0.025)}}>
                            <Card3D className="w-44 rounded-2xl p-4 backdrop-blur-xl border border-cyan-500/25" style={{background:"rgba(13,14,32,0.92)",boxShadow:"0 20px 50px rgba(0,0,0,0.5),0 0 18px rgba(6,182,212,0.1)"}}>
                                <div className="absolute top-0 left-4 right-4 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(6,182,212,0.55),transparent)"}}/>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🎨</span>
                                    <div>
                                        <div className="text-white font-bold text-xs" style={{fontFamily:"'Syne',sans-serif"}}>UI/UX Designer</div>
                                        <div className="text-slate-500 text-xs">Hybrid</div>
                                    </div>
                                </div>
                                <div className="text-cyan-300 font-black text-sm" style={{fontFamily:"'Syne',sans-serif"}}>₹18–28 LPA</div>
                            </Card3D>
                        </div>

                        {/* Orbital tag pills */}
                        {JOB_TAGS.map(({label,color,delay},i)=>{
                            const angle=(i/JOB_TAGS.length)*2*Math.PI-Math.PI/2;
                            const R=218;
                            const x=240+R*Math.cos(angle)-58, y=250+R*Math.sin(angle)-15;
                            return(
                                <div key={label} style={{position:"absolute",left:x,top:y,animation:`tag-float ${4+i*0.5}s ease-in-out infinite`,animationDelay:delay,zIndex:15,...px(0.022)}}>
                                    <div className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border whitespace-nowrap hover:scale-110 transition-transform duration-300"
                                         style={{color,borderColor:`${color}45`,backgroundColor:`${color}18`,boxShadow:`0 4px 20px ${color}30`}}>
                                        {label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ════ JOBS SECTION ════ */}
                <div id="jobs-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-22 border-t border-indigo-500/10" style={{zIndex:10}}>

                    {/* Section header */}
                    <div className="mb-8 sm:mb-12">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" style={{boxShadow:"0 0 8px rgba(52,211,153,0.9)"}}/>
                                    <span className="text-indigo-300 text-xs font-semibold">{jobs.length} Open Positions</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-white" style={{fontFamily:"'Syne',sans-serif"}}>
                                    Explore{" "}
                                    <span style={{background:"linear-gradient(135deg,#818cf8,#c084fc,#38bdf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                                        Opportunities
                                    </span>
                                </h2>
                                <p className="text-slate-400 text-base sm:text-lg mt-2">Browse opportunities matched for you</p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {["ALL","OPEN","CLOSED"].map(f=>(
                                    <button key={f} onClick={()=>setFilter(f)}
                                            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-250 ${filter===f?"text-white":"border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600/80"}`}
                                            style={filter===f?{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",boxShadow:"0 0 18px rgba(99,102,241,0.5)"}:{}}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-2xl border border-slate-700/50 bg-white/3 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
                            <svg className="w-4 sm:w-5 h-4 sm:h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                                   placeholder="Search by role or company…"
                                   className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"/>
                            {search&&(
                                <button onClick={()=>setSearch("")} className="text-slate-500 hover:text-white transition-colors text-xl leading-none shrink-0">×</button>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    {loadingJobs?(
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                            {Array.from({length:6}).map((_,i)=>(
                                <div key={i} className="h-56 sm:h-64 rounded-3xl bg-white/3 border border-slate-800/60 animate-pulse" style={{animationDelay:`${i*0.1}s`}}/>
                            ))}
                        </div>
                    ):filteredJobs.length===0?(
                        <div className="text-center py-20 sm:py-28 bg-white/3 border border-slate-700/30 rounded-3xl backdrop-blur-md">
                            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                            <p className="text-slate-300 text-lg sm:text-xl font-bold mb-2" style={{fontFamily:"'Syne',sans-serif"}}>
                                {search?`No results for "${search}"`:"No jobs available right now"}
                            </p>
                            <p className="text-slate-500 text-sm">{search?"Try a different keyword":"Check back later for new openings"}</p>
                            {search&&(
                                <button onClick={()=>setSearch("")} className="mt-5 px-5 py-2.5 rounded-2xl text-sm font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all">Clear Search</button>
                            )}
                        </div>
                    ):(
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                            {filteredJobs.map((job,i)=>(
                                <div key={job.jobId || job.id} className="card-in" style={{animationDelay:`${(i%9)*0.07}s`}}>
                                    <JobCard job={job} applied={appliedIds.has(job.jobId || job.id)} onApply={applyJob} applying={applying}/>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Company strip */}
                    <div className="mt-16 sm:mt-20 pt-10 border-t border-slate-800/60">
                        <p className="text-center text-slate-700 text-xs font-semibold tracking-[0.2em] uppercase mb-7">Trusted by Industry Leaders</p>
                        <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-10 opacity-30">
                            {["Google","Amazon","Microsoft","Infosys","TCS","Wipro"].map(co=>(
                                <span key={co} className="text-slate-400 font-black text-sm sm:text-base tracking-wider hover:text-slate-200 transition-all duration-300 cursor-pointer"
                                      style={{fontFamily:"'Syne',sans-serif"}}>{co}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {successJob&&<ApplySuccess job={successJob} onClose={()=>setSuccessJob(null)}/>}
            </div>
        </>
    );
}
