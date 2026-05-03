import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added for routing
import { api } from "../services/api"; // Added for backend connection
import toast from "react-hot-toast"; // Added for popups

// ─── Particle Canvas ──────────────────────────────────────────────────────────
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

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({ type, label, icon, value, onChange, show, onToggle, error }) {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;
    return (
        <div className="mb-4">
            <div
                className={`flex items-center gap-3 px-4 pt-5 pb-3 rounded-2xl border transition-all duration-300 ${
                    error
                        ? "border-rose-500/50 bg-rose-500/5 shadow-[0_0_0_3px_rgba(244,63,94,0.1)]"
                        : focused
                            ? "border-indigo-500/60 bg-indigo-500/5 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                            : "border-slate-700/60 bg-white/3 hover:border-slate-600/60"
                }`}
            >
                <span className={`text-lg transition-all duration-200 shrink-0 ${focused ? "opacity-100 scale-110" : "opacity-40 scale-100"}`}>{icon}</span>
                <div className="relative flex-1">
                    <label
                        className={`absolute left-0 transition-all duration-200 pointer-events-none font-medium ${
                            active
                                ? `text-xs -top-2 ${error ? "text-rose-400" : "text-indigo-400"}`
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
                        className="w-full bg-transparent text-white text-sm pt-2 outline-none"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                </div>
                {onToggle && (
                    <button type="button" onClick={onToggle} className="text-slate-500 hover:text-slate-300 transition-colors duration-200 shrink-0">
                        {show ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-rose-400 text-xs mt-1.5 ml-2 font-medium">{error}</p>}
        </div>
    );
}

// ─── Password Strength Bar ────────────────────────────────────────────────────
function PasswordStrength({ password }) {
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };
    const score = getStrength();
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
    if (!password) return null;
    return (
        <div className="mb-4 px-1 animate-fade-in">
            <div className="flex gap-1.5 mb-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-400"
                        style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.08)" }}
                    />
                ))}
            </div>
            <p className="text-xs font-semibold" style={{ color: colors[score] }}>
                {labels[score]} {score === 4 ? "🔐" : ""}
            </p>
        </div>
    );
}

function StepIndicator({ step }) {
    const steps = ["Details", "Password"];
    return (
        <div className="flex items-center gap-2 mb-7">
            {steps.map((label, i) => {
                const idx = i + 1;
                const done = idx < step;
                const active = idx === step;
                return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-400 ${
                                    done
                                        ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                        : active
                                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]"
                                            : "bg-slate-800 text-slate-500 border border-slate-700"
                                }`}
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                {done ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : idx}
                            </div>
                            <span className={`text-xs font-medium transition-colors ${active ? "text-indigo-400" : done ? "text-emerald-400" : "text-slate-600"}`}>
                {label}
              </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="flex-1 h-px mb-5 transition-all duration-500"
                                 style={{ background: done ? "linear-gradient(90deg, #10b981, #6366f1)" : "rgba(255,255,255,0.07)" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Register ────────────────────────────────────────────────────────────
function Register() {
    const [step, setStep] = useState(1); // 1 = Details, 2 = Password
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [visible, setVisible] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();

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

    const parallax = (f = 0.02) => ({
        transform: `translate(${(mousePos.x - window.innerWidth / 2) * f}px, ${(mousePos.y - window.innerHeight / 2) * f}px)`,
        transition: "transform 0.12s linear",
    });

    const validateStep = () => {
        const errs = {};
        if (step === 1) { // Validate Step 1 (Details)
            if (!name.trim()) errs.name = "Full name is required";
            if (!email.trim()) errs.email = "Email is required";
            else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
        }
        if (step === 2) { // Validate Step 2 (Password)
            if (password.length < 8) errs.password = "Minimum 8 characters";
            if (password !== confirm) errs.confirm = "Passwords don't match";
            if (!agree) errs.agree = "Please accept the terms";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => { if (validateStep()) setStep((s) => s + 1); };
    const prevStep = () => { setStep((s) => s - 1); setErrors({}); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        setLoading(true);
        try {
            // Hit your Spring Boot backend's register endpoint
            await api.post('/auth/register', { name, email, password });

            toast.success("Account created! Please check your email to verify.", { duration: 5000 });
            navigate("/login"); // Send them to login page after success
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data || "Registration failed. Try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
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
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-r {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(14px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.96); opacity: 0.6; }
          70% { transform: scale(1.14); opacity: 0; }
          100% { transform: scale(0.96); opacity: 0; }
        }
        .animate-slide-up { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-step { animation: slide-in-right 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .d1{animation-delay:0.05s} .d2{animation-delay:0.12s}
        .d3{animation-delay:0.19s} .d4{animation-delay:0.26s}
        .d5{animation-delay:0.33s} .d6{animation-delay:0.40s}
      `}</style>

            <div
                className="relative min-h-screen w-full overflow-hidden flex items-center justify-center py-8"
                style={{ background: "linear-gradient(135deg, #07080f 0%, #0d0f1e 50%, #080a14 100%)", fontFamily: "'DM Sans', sans-serif" }}
            >
                <ParticleCanvas />

                {/* Ambient orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
                    <div style={{ position: "absolute", top: "5%", left: "8%", width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 14s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: "5%", right: "8%", width: 420, height: 420, background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 17s ease-in-out infinite reverse" }} />
                    <div style={{ position: "absolute", top: "50%", right: "28%", width: 250, height: 250, background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", borderRadius: "50%", animation: "drift 11s ease-in-out infinite 2s" }} />
                </div>

                {/* ── Left floating card ── */}
                <div
                    className="hidden xl:block absolute left-14 top-1/2 -translate-y-1/2"
                    style={{ animation: "float 6s ease-in-out infinite", zIndex: 10, ...parallax(0.025) }}
                >
                    <div className="w-56 bg-[#0f1120]/85 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="text-slate-500 text-xs font-medium mb-3 tracking-wide uppercase">Why Join?</div>
                        {[
                            { icon: "⚡", text: "Instant job matches" },
                            { icon: "🤝", text: "500+ hiring companies" },
                            { icon: "📈", text: "Fast-track your career" },
                            { icon: "🔔", text: "Real-time alerts" },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-2.5 mb-3">
                                <span className="text-base">{icon}</span>
                                <span className="text-slate-400 text-xs font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right floating card ── */}
                <div
                    className="hidden xl:block absolute right-14 top-1/2 -translate-y-1/2"
                    style={{ animation: "float-r 5.5s ease-in-out infinite 1s", zIndex: 10, ...parallax(0.02) }}
                >
                    <div className="w-52 bg-[#0f1120]/85 border border-violet-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="text-slate-500 text-xs font-medium mb-3 tracking-wide uppercase">New Members</div>
                        <div className="space-y-3">
                            {[
                                { name: "Arjun K.", role: "React Dev", avatar: "🧑‍💻" },
                                { name: "Priya S.", role: "UX Designer", avatar: "👩‍🎨" },
                                { name: "Rohan M.", role: "Java Dev", avatar: "👨‍💼" },
                            ].map(({ name, role, avatar }) => (
                                <div key={name} className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-sm shrink-0">{avatar}</div>
                                    <div>
                                        <div className="text-white text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{name}</div>
                                        <div className="text-slate-500 text-xs">{role}</div>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Register Card ── */}
                <div className="relative" style={{ zIndex: 20 }}>
                    {/* Orbit rings */}
                    <div className="absolute -inset-16 rounded-full border border-indigo-500/8 pointer-events-none" style={{ animation: "spin-slow 28s linear infinite" }} />
                    <div className="absolute -inset-8 rounded-full border border-violet-500/8 pointer-events-none" style={{ animation: "spin-slow 20s linear infinite reverse" }} />
                    <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: "rgba(99,102,241,0.05)", animation: "pulse-ring 3.5s ease-out infinite" }} />

                    <div className={`w-[440px] max-w-[calc(100vw-2rem)] ${visible ? "animate-slide-up" : "opacity-0"}`}>
                        <div className="bg-gradient-to-br from-[#12142b]/95 to-[#0e1022]/95 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_50px_rgba(99,102,241,0.08)]">

                            {/* Header */}
                            <div className="text-center mb-6 animate-slide-up d1">
                                <div className="relative inline-block mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(99,102,241,0.5)]">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 border-2 border-[#0e1022] flex items-center justify-center">
                                        <span className="text-white text-xs">✦</span>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    Join TalentFlow
                                </h1>
                                <p className="text-slate-500 text-sm">Your career journey starts here</p>
                            </div>

                            {/* Step Indicator */}
                            <div className="animate-slide-up d2">
                                <StepIndicator step={step} />
                            </div>

                            {/* ── STEP CONTENT ── */}
                            <form onSubmit={handleSubmit}>

                                {/* Step 1: Details */}
                                {step === 1 && (
                                    <div className="animate-step">
                                        <FloatingInput type="text" label="Full Name" icon="👤" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
                                        <FloatingInput type="email" label="Email Address" icon="✉️" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
                                    </div>
                                )}

                                {/* Step 2: Password */}
                                {step === 2 && (
                                    <div className="animate-step">
                                        <FloatingInput
                                            type="password" label="Create Password" icon="🔒"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            show={showPass} onToggle={() => setShowPass(!showPass)}
                                            error={errors.password}
                                        />
                                        <PasswordStrength password={password} />
                                        <FloatingInput
                                            type="password" label="Confirm Password" icon="🛡️"
                                            value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                            show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                                            error={errors.confirm}
                                        />

                                        {/* Terms */}
                                        <div className="mb-5">
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div
                                                    onClick={() => setAgree(!agree)}
                                                    className={`w-5 h-5 mt-0.5 rounded-md border shrink-0 flex items-center justify-center transition-all duration-200 ${
                                                        agree
                                                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-500"
                                                            : "border-slate-700 bg-transparent group-hover:border-indigo-500/60"
                                                    }`}
                                                >
                                                    {agree && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-slate-400 text-sm leading-relaxed">
                          I agree to TalentFlow's{" "}
                                                    <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2 decoration-indigo-500/40">Terms of Service</a>
                                                    {" "}and{" "}
                                                    <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2 decoration-indigo-500/40">Privacy Policy</a>
                        </span>
                                            </label>
                                            {errors.agree && <p className="text-rose-400 text-xs mt-1.5 ml-8 font-medium">{errors.agree}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className={`flex gap-3 mt-2 animate-slide-up d5`}>
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex-1 py-4 rounded-2xl font-bold text-slate-300 text-sm border border-slate-700/60 bg-white/3 hover:bg-white/6 hover:border-slate-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ fontFamily: "'Syne', sans-serif" }}
                                        >
                                            ← Back
                                        </button>
                                    )}

                                    {step < 2 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="flex-1 py-4 rounded-2xl font-bold text-white text-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                                boxShadow: "0 0 25px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.3)",
                                                fontFamily: "'Syne', sans-serif",
                                            }}
                                        >
                                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", backgroundSize: "200% 100%", animation: "shimmer 2.5s ease-in-out infinite" }} />
                                            Continue →
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-4 rounded-2xl font-bold text-white text-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                            style={{
                                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                                boxShadow: "0 0 25px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.3)",
                                                fontFamily: "'Syne', sans-serif",
                                            }}
                                        >
                                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", backgroundSize: "200% 100%", animation: "shimmer 2.5s ease-in-out infinite" }} />
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-3">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating account…
                        </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                          🚀 Create Account
                        </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Footer */}
                            <p className="text-center text-slate-500 text-sm mt-6 animate-slide-up d6">
                                Already have an account?{" "}
                                <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors duration-200 underline underline-offset-2 decoration-indigo-500/40">
                                    Sign in →
                                </Link>
                            </p>

                            {/* Trust row */}
                            <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t border-slate-800/60 animate-slide-up d6">
                                {["🔐 SSL Secure", "✅ Verified", "🛡️ No Spam"].map((b) => (
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

export default Register;