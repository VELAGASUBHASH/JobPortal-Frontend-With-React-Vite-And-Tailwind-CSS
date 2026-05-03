import { useState, useEffect, useRef } from "react";

// ─── Floating 3D Card ───────────────────────────────────────────────────────
function Card3D({ children, className = "" }) {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotX = ((y - cy) / cy) * -12;
        const rotY = ((x - cx) / cx) * 12;
        el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
    };

    const handleMouseLeave = () => {
        if (ref.current)
            ref.current.style.transform =
                "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{ transition: "transform 0.2s ease", transformStyle: "preserve-3d" }}
        >
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
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
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

        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.5 + 0.2,
        }));

        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p) => {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0 || p.x > W) p.dx *= -1;
                if (p.y < 0 || p.y > H) p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
                ctx.fill();
            });

            // draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
            raf = requestAnimationFrame(draw);
        };
        draw();

        const onResize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}

// ─── Floating Job Tags ────────────────────────────────────────────────────────
const JOB_TAGS = [
    { label: "React Dev", color: "#6366f1", delay: "0s" },
    { label: "Java Backend", color: "#8b5cf6", delay: "0.4s" },
    { label: "UI/UX Design", color: "#06b6d4", delay: "0.8s" },
    { label: "DevOps", color: "#10b981", delay: "1.2s" },
    { label: "Data Science", color: "#f59e0b", delay: "1.6s" },
    { label: "Cloud Architect", color: "#ef4444", delay: "2s" },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? "bg-[#07080f]/90 backdrop-blur-xl border-b border-indigo-500/20 shadow-[0_8px_32px_rgba(99,102,241,0.1)]"
                    : "bg-transparent"
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </div>
                    </div>
                    <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent"
                          style={{ fontFamily: "'Syne', sans-serif" }}>
            RisePath
          </span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {["Find Jobs", "Companies", "Talents", "Pricing"].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="text-slate-400 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200 relative group"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-300" />
                        </a>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <button
                        className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500/60 rounded-xl transition-all duration-200 hover:bg-indigo-500/10"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Sign In
                    </button>
                    <button
                        className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                        Post a Job
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-slate-400 hover:text-white"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <div className="w-6 h-5 flex flex-col justify-between">
                        <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                        <span className={`block h-0.5 bg-current transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
                        <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                    </div>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-64" : "max-h-0"}`}>
                <div className="px-6 pb-6 space-y-4 bg-[#07080f]/95 backdrop-blur-xl border-t border-indigo-500/10">
                    {["Find Jobs", "Companies", "Talents", "Pricing"].map((item) => (
                        <a key={item} href="#" className="block text-slate-400 hover:text-white text-sm py-1"
                           style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {item}
                        </a>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <button className="flex-1 py-2 text-sm text-slate-300 border border-slate-700 rounded-xl">Sign In</button>
                        <button className="flex-1 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600">Post a Job</button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function Hero() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        // Google Fonts
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 100);
    }, []);

    useEffect(() => {
        const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    const parallaxStyle = (factor = 0.02) => ({
        transform: `translate(${(mousePos.x - window.innerWidth / 2) * factor}px, ${(mousePos.y - window.innerHeight / 2) * factor}px)`,
        transition: "transform 0.1s linear",
    });

    return (
        <>
            {/* Font imports injected via useEffect */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(2deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(18px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.7), 0 0 80px rgba(139,92,246,0.3); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes drift {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-20px,15px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tag-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>

            <div
                className="relative min-h-screen overflow-hidden"
                style={{ background: "linear-gradient(135deg, #07080f 0%, #0d0f1e 50%, #080a14 100%)", fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* ── Particle Canvas ── */}
                <ParticleCanvas />

                {/* ── Background Orbs ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
                    <div
                        style={{
                            position: "absolute", top: "8%", left: "10%", width: 600, height: 600,
                            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                            animation: "drift 12s ease-in-out infinite",
                            borderRadius: "50%",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500,
                            background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
                            animation: "drift 15s ease-in-out infinite reverse",
                            borderRadius: "50%",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute", top: "40%", right: "20%", width: 300, height: 300,
                            background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
                            animation: "drift 10s ease-in-out infinite 3s",
                            borderRadius: "50%",
                        }}
                    />
                </div>

                {/* ── Navbar ── */}
                <Navbar />

                {/* ── Main Content ── */}
                <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-20 flex flex-col lg:flex-row items-center gap-16" style={{ zIndex: 10 }}>

                    {/* ── LEFT COLUMN ── */}
                    <div className={`flex-1 max-w-2xl ${visible ? "animate-slide-up" : "opacity-0"}`}>

                        {/* Badge */}
                        <div className="animate-slide-up delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
                            <span className="text-sm text-indigo-300 font-semibold tracking-wide">🚀 500+ Companies Hiring Right Now</span>
                        </div>

                        {/* Headline */}
                        <h1
                            className="animate-slide-up delay-200 font-black leading-none tracking-tight mb-6"
                            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(3rem, 5vw, 5rem)" }}
                        >
                            <span className="text-white block">Find Your</span>
                            <span
                                className="block"
                                style={{
                                    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                Dream Career
              </span>
                            <span className="text-white block">Today.</span>
                        </h1>

                        {/* Subtext */}
                        <p className="animate-slide-up delay-300 text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
                            Connect with top companies across tech, design, and beyond. Your next big opportunity is just one search away.
                        </p>

                        {/* Search Bar */}
                        <div className="animate-slide-up delay-400 flex items-center gap-3 p-2 pl-5 rounded-2xl border border-indigo-500/20 bg-white/5 backdrop-blur-md mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-indigo-500/40 transition-all duration-300 group">
                            <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Job title, skills or company..."
                                className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
                            />
                            <div className="h-8 w-px bg-slate-700" />
                            <div className="flex items-center gap-2 px-3 text-slate-500 text-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                Hyderabad
                            </div>
                            <button
                                className="px-6 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] transition-all duration-300 shrink-0"
                            >
                                Search
                            </button>
                        </div>

                        {/* Trending Tags */}
                        <div className="animate-slide-up delay-500">
                            <span className="text-slate-500 text-sm font-medium">Trending:</span>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {["React", "Spring Boot", "Python", "AWS", "Full Stack", "DevOps"].map((tag) => (
                                    <button
                                        key={tag}
                                        className="px-3 py-1.5 text-xs font-semibold text-indigo-300 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 cursor-pointer"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="animate-slide-up delay-600 flex gap-10 mt-12 pt-8 border-t border-slate-800">
                            {[
                                { end: 12000, suffix: "+", label: "Active Jobs" },
                                { end: 850, suffix: "+", label: "Companies" },
                                { end: 95, suffix: "%", label: "Placement Rate" },
                            ].map(({ end, suffix, label }) => (
                                <div key={label}>
                                    <div
                                        className="text-3xl font-black text-white"
                                        style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                                    >
                                        <Counter end={end} suffix={suffix} />
                                    </div>
                                    <div className="text-slate-500 text-sm font-medium mt-1">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: 3D Cards ── */}
                    <div className="flex-1 relative flex items-center justify-center min-h-[520px] w-full">

                        {/* Orbit Ring */}
                        <div
                            className="absolute rounded-full border border-indigo-500/10"
                            style={{ width: 440, height: 440, animation: "spin-slow 30s linear infinite" }}
                        />
                        <div
                            className="absolute rounded-full border border-violet-500/10"
                            style={{ width: 340, height: 340, animation: "spin-slow 20s linear infinite reverse" }}
                        />

                        {/* Glow Orb Center */}
                        <div
                            style={{
                                position: "absolute", width: 200, height: 200,
                                background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
                                borderRadius: "50%",
                                animation: "pulse-glow 3s ease-in-out infinite",
                                ...parallaxStyle(0.01),
                            }}
                        />

                        {/* Central Job Card */}
                        <div style={{ ...parallaxStyle(0.015), zIndex: 20 }}>
                            <Card3D className="w-72 bg-gradient-to-br from-[#13152a] to-[#0e1022] border border-indigo-500/20 rounded-3xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(99,102,241,0.1)] backdrop-blur-xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center text-2xl">
                                            🏢
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>TechCorp Inc.</div>
                                            <div className="text-slate-500 text-xs">Hyderabad, IN</div>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full">Hiring</span>
                                </div>

                                <div className="text-white font-black text-lg mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Senior React Developer</div>
                                <div className="text-slate-500 text-sm mb-5">Full-time · 4–7 Years Experience</div>

                                <div className="flex flex-wrap gap-2 mb-5">
                                    {["React", "TypeScript", "Node.js"].map(t => (
                                        <span key={t} className="px-2.5 py-1 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{t}</span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>₹28–40</span>
                                        <span className="text-slate-500 text-sm"> LPA</span>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                        Apply Now
                                    </button>
                                </div>
                            </Card3D>
                        </div>

                        {/* Floating Mini Cards */}
                        <div
                            style={{
                                position: "absolute", top: "5%", right: "5%",
                                animation: "float 5s ease-in-out infinite",
                                ...parallaxStyle(0.03),
                                zIndex: 30,
                            }}
                        >
                            <Card3D className="w-52 bg-[#0f1120]/90 border border-violet-500/20 rounded-2xl p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-lg">🚀</div>
                                    <div>
                                        <div className="text-white font-bold text-xs" style={{ fontFamily: "'Syne', sans-serif" }}>Spring Boot Dev</div>
                                        <div className="text-slate-500 text-xs">Google · Remote</div>
                                    </div>
                                </div>
                                <div className="text-violet-300 font-black text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>₹22–35 LPA</div>
                            </Card3D>
                        </div>

                        <div
                            style={{
                                position: "absolute", bottom: "8%", left: "2%",
                                animation: "floatReverse 6s ease-in-out infinite 1s",
                                ...parallaxStyle(0.025),
                                zIndex: 30,
                            }}
                        >
                            <Card3D className="w-48 bg-[#0f1120]/90 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🎨</span>
                                    <div>
                                        <div className="text-white font-bold text-xs" style={{ fontFamily: "'Syne', sans-serif" }}>UI/UX Designer</div>
                                        <div className="text-slate-500 text-xs">Swiggy · Hybrid</div>
                                    </div>
                                </div>
                                <div className="text-cyan-300 font-black text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>₹18–28 LPA</div>
                            </Card3D>
                        </div>

                        {/* Floating Job Tag Pills */}
                        {JOB_TAGS.map(({ label, color, delay }, i) => {
                            const angle = (i / JOB_TAGS.length) * 2 * Math.PI - Math.PI / 2;
                            const R = 210;
                            const cx = 220, cy = 240;
                            const x = cx + R * Math.cos(angle) - 55;
                            const y = cy + R * Math.sin(angle) - 14;
                            return (
                                <div
                                    key={label}
                                    style={{
                                        position: "absolute",
                                        left: x,
                                        top: y,
                                        animation: `tag-float ${4 + i * 0.5}s ease-in-out infinite`,
                                        animationDelay: delay,
                                        zIndex: 15,
                                        ...parallaxStyle(0.02),
                                    }}
                                >
                                    <div
                                        className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border whitespace-nowrap"
                                        style={{
                                            color: color,
                                            borderColor: `${color}40`,
                                            backgroundColor: `${color}15`,
                                            boxShadow: `0 4px 20px ${color}25`,
                                        }}
                                    >
                                        {label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Bottom Wave ── */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 5 }}>
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
                        <path d="M0 40 C360 80 1080 0 1440 40 L1440 80 L0 80 Z" fill="rgba(99,102,241,0.04)" />
                        <path d="M0 60 C400 20 1000 80 1440 60 L1440 80 L0 80 Z" fill="rgba(139,92,246,0.03)" />
                    </svg>
                </div>

                {/* ── Company Logos Strip ── */}
                <div className="relative max-w-7xl mx-auto px-6 pb-16" style={{ zIndex: 10 }}>
                    <p className="text-center text-slate-600 text-xs font-medium tracking-widest uppercase mb-8">Trusted by Industry Leaders</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
                        {["Google", "Amazon", "Microsoft", "Infosys", "TCS", "Wipro"].map((co) => (
                            <div
                                key={co}
                                className="text-slate-400 font-black text-sm tracking-wide hover:text-slate-200 transition-colors duration-200 cursor-pointer"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                {co}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}