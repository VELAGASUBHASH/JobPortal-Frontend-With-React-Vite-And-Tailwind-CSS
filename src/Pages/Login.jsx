import { useState, useEffect, useRef } from "react";

// ─── Particle Canvas (same as Hero) ──────────────────────────────────────────
function ParticleCanvas() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.35,
            dy: (Math.random() - 0.5) * 0.35,
            opacity: Math.random() * 0.45 + 0.15,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p) => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > W) p.dx *= -1;
                if (p.y < 0 || p.y > H) p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
                ctx.fill();
            });
            for (let i = 0; i < particles.length; i++)
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99,102,241,${0.1 * (1 - dist / 110)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener("resize", onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Floating Input ───────────────────────────────────────────────────────────
function FloatingInput({ type, label, icon, value, onChange, show, onToggle }) {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;
    return (
        <div className="relative mb-5">
            <div
                className={`flex items-center gap-3 px-4 pt-5 pb-3 rounded-2xl border transition-all duration-300 ${
                    focused
                        ? "border-indigo-500/60 bg-indigo-500/5 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                        : "border-slate-700/60 bg-white/3 hover:border-slate-600/60"
                }`}
            >
                <span className={`text-lg transition-colors duration-200 ${focused ? "opacity-100" : "opacity-40"}`}>{icon}</span>
                <div className="relative flex-1">
                    <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none font-medium ${
                            active
                                ? "text-xs -top-2 text-indigo-400"
                                : "text-sm top-0.5 text-slate-500"
                        }`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                        {label}
                    </label>
                    <input
                        type={show !== undefined ? (show ? "text" : "password") : type}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="w-full bg-transparent text-white text-sm pt-2 outline-none placeholder-transparent"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                </div>
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="text-slate-500 hover:text-slate-300 transition-colors duration-200 shrink-0"
                    >
                        {show ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main Login ───────────────────────────────────────────────────────────────
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
    }, []);

    useEffect(() => {
        const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    const parallaxStyle = (factor = 0.02) => ({
        transform: `translate(${(mousePos.x - window.innerWidth / 2) * factor}px, ${(mousePos.y - window.innerHeight / 2) * factor}px)`,
        transition: "transform 0.12s linear",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <>
            <style>{`
        @keyframes drift {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(28px,-18px) scale(1.04); }
          66% { transform: translate(-18px,14px) scale(0.96); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-r {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(14px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .animate-slide-up { animation: slide-up 0.75s cubic-bezier(0.22,1,0.36,1) both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.13s; }
        .d3 { animation-delay: 0.21s; } .d4 { animation-delay: 0.29s; }
        .d5 { animation-delay: 0.37s; } .d6 { animation-delay: 0.45s; }
        .d7 { animation-delay: 0.53s; }
      `}</style>

            <div
                className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #07080f 0%, #0d0f1e 50%, #080a14 100%)", fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* Particles */}
                <ParticleCanvas />

                {/* Ambient orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
                    <div style={{ position: "absolute", top: "5%", left: "5%", width: 520, height: 520, background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 14s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 420, height: 420, background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 17s ease-in-out infinite reverse" }} />
                    <div style={{ position: "absolute", top: "45%", right: "25%", width: 260, height: 260, background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 11s ease-in-out infinite 2s" }} />
                </div>

                {/* ── Floating Side Info Cards ── */}
                {/* Left card */}
                <div
                    className="hidden lg:block absolute left-16 top-1/2 -translate-y-1/2"
                    style={{ animation: "float 6s ease-in-out infinite", zIndex: 10, ...parallaxStyle(0.025) }}
                >
                    <div className="w-56 bg-[#0f1120]/85 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-xl">🎯</div>
                            <div>
                                <div className="text-white font-bold text-xs" style={{ fontFamily: "'Syne', sans-serif" }}>Smart Match</div>
                                <div className="text-slate-500 text-xs">AI-powered</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {["React Dev", "Java Backend", "DevOps"].map((tag, i) => (
                                <div key={tag} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    <span className="text-slate-400 text-xs">{tag}</span>
                                    <span className="ml-auto text-indigo-300 text-xs font-bold">{95 - i * 8}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right card */}
                <div
                    className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2"
                    style={{ animation: "float-r 5.5s ease-in-out infinite 1s", zIndex: 10, ...parallaxStyle(0.02) }}
                >
                    <div className="w-52 bg-[#0f1120]/85 border border-violet-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="text-slate-500 text-xs font-medium mb-3">Today's Activity</div>
                        <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                            2,847
                        </div>
                        <div className="text-indigo-300 text-xs mb-4">Applications sent</div>
                        <div className="flex gap-1 items-end h-10">
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-violet-500 opacity-80" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Login Card ── */}
                <div
                    className="relative"
                    style={{ zIndex: 20, perspective: "1200px" }}
                >
                    {/* Orbit rings */}
                    <div className="absolute -inset-16 rounded-full border border-indigo-500/8 pointer-events-none" style={{ animation: "spin-slow 25s linear infinite" }} />
                    <div className="absolute -inset-8 rounded-full border border-violet-500/8 pointer-events-none" style={{ animation: "spin-slow 18s linear infinite reverse" }} />

                    {/* Glow pulse ring */}
                    <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: "rgba(99,102,241,0.06)", animation: "pulse-ring 3s ease-out infinite", zIndex: -1 }} />

                    <div
                        className={`w-[420px] max-w-[calc(100vw-2rem)] ${visible ? "animate-slide-up" : "opacity-0"}`}
                    >
                        <div
                            className="bg-gradient-to-br from-[#12142b]/95 to-[#0e1022]/95 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_50px_rgba(99,102,241,0.08)]"
                        >
                            {/* Header */}
                            <div className="text-center mb-8 animate-slide-up d1">
                                {/* Logo icon */}
                                <div className="relative inline-block mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(99,102,241,0.5)]">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0e1022] flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-300" />
                                    </div>
                                </div>
                                <h1
                                    className="text-3xl font-black text-white mb-1"
                                    style={{ fontFamily: "'Syne', sans-serif" }}
                                >
                                    Welcome Back
                                </h1>
                                <p className="text-slate-500 text-sm">Sign in to RiseFlow to continue your journey</p>
                            </div>



                            {/* Divider */}
                            <div className="flex items-center gap-4 mb-6 animate-slide-up d3">
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-slate-600 text-xs font-medium tracking-widest uppercase">or email</span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="animate-slide-up d4">
                                    <FloatingInput
                                        type="email"
                                        label="Email Address"
                                        icon="✉️"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="animate-slide-up d5">
                                    <FloatingInput
                                        type="password"
                                        label="Password"
                                        icon="🔒"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        show={showPassword}
                                        onToggle={() => setShowPassword(!showPassword)}
                                    />
                                </div>

                                {/* Remember + Forgot */}
                                <div className="flex items-center justify-between mb-6 animate-slide-up d5">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <div
                                            onClick={() => setRemember(!remember)}
                                            className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                                                remember
                                                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-500"
                                                    : "border-slate-700 bg-transparent group-hover:border-indigo-500/60"
                                            }`}
                                        >
                                            {remember && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-sm">Remember me</span>
                                    </label>
                                    <a href="#" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors duration-200 font-medium">
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="animate-slide-up d6 relative w-full py-4 rounded-2xl font-bold text-white text-base overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                    style={{
                                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                        boxShadow: "0 0 25px rgba(99,102,241,0.5), 0 8px 32px rgba(0,0,0,0.3)",
                                        fontFamily: "'Syne', sans-serif",
                                    }}
                                >
                                    {/* shimmer overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                                            backgroundSize: "200% 100%",
                                            animation: "shimmer 2.5s ease-in-out infinite",
                                        }}
                                    />
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-3">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing you in…
                    </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            <p className="text-center text-slate-500 text-sm mt-6 animate-slide-up d7">
                                Don't have an account?{" "}
                                <a
                                    href="#"
                                    className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors duration-200 underline underline-offset-2 decoration-indigo-500/40"
                                >
                                    Create one free →
                                </a>
                            </p>

                            {/* Trust badges */}
                            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-800/60 animate-slide-up d7">
                                {["🔐 SSL Secure", "✅ Verified", "🛡️ Private"].map((b) => (
                                    <span key={b} className="text-slate-600 text-xs font-medium">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;