import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { userAPI } from "../Services/api.js";

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    APPLIED:     { color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", icon: "📨", label: "Applied",     step: 1 },
    SHORTLISTED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", icon: "⭐", label: "Shortlisted", step: 2 },
    HIRED:       { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", icon: "🎉", label: "Hired!",      step: 4 },
    REJECTED:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)",  icon: "❌", label: "Rejected",    step: 4 },
};

const STEPS = ["Applied", "Shortlisted", "Interview", "Decision"];

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");
        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        const pts = Array.from({ length: 50 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.6 + 0.4,
            dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
            o: Math.random() * 0.35 + 0.1,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            pts.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > W) p.dx *= -1;
                if (p.y < 0 || p.y > H) p.dy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,102,241,${p.o})`; ctx.fill();
            });
            for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 100) {
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.07 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
                }
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        const onR = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener("resize", onR);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
    }, []);
    return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = Number(value) || 0;
        if (end === 0) { setDisplay(0); return; }
        const step = Math.ceil(end / 20);
        const t = setInterval(() => {
            start += step;
            if (start >= end) { setDisplay(end); clearInterval(t); }
            else setDisplay(start);
        }, 40);
        return () => clearInterval(t);
    }, [value]);
    return <>{display}</>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="au relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl border transition-all duration-400 cursor-default"
             onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
             style={{
                 animationDelay: delay,
                 background: "linear-gradient(135deg,rgba(18,20,43,0.95),rgba(14,16,34,0.95))",
                 borderColor: hovered ? `${color}40` : "rgba(99,102,241,0.13)",
                 boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.4),0 0 30px ${color}15` : "0 4px 20px rgba(0,0,0,0.2)",
                 transform: hovered ? "translateY(-3px)" : "translateY(0)",
             }}>
            {/* Glow blob on hover */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-400 rounded-3xl"
                 style={{ background: `radial-gradient(ellipse at 50% 0%,${color}12 0%,transparent 60%)`, opacity: hovered ? 1 : 0 }} />
            {/* Top shimmer edge */}
            <div className="absolute top-0 left-6 right-6 h-px transition-opacity duration-400"
                 style={{ background: `linear-gradient(90deg,transparent,${color}60,transparent)`, opacity: hovered ? 1 : 0 }} />

            <div className="relative flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-transform duration-300"
                     style={{ background: `${color}20`, border: `1px solid ${color}30`, transform: hovered ? "scale(1.1) rotate(-3deg)" : "scale(1)" }}>
                    {icon}
                </div>
                <span className="text-slate-400 text-sm font-medium">{label}</span>
            </div>
            <div className="relative text-4xl font-black" style={{ fontFamily: "'Syne',sans-serif", color }}>
                <AnimatedNumber value={value} />
            </div>
        </div>
    );
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
function ProgressSteps({ app }) {
    const sc = STATUS_CONFIG[app.applicationStatus] || STATUS_CONFIG.APPLIED;
    const stepIdx = sc.step - 1;
    const isHired = app.applicationStatus === "HIRED";
    const isRejected = app.applicationStatus === "REJECTED";

    return (
        <div className="flex items-center gap-0.5 sm:gap-1">
            {STEPS.map((s, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                const lastActive = (isHired || isRejected) && i === 3;
                return (
                    <div key={s} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 w-full">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                lastActive && isHired ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                                    : lastActive && isRejected ? "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                                        : done || active ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                            : "bg-slate-800 border border-slate-700"
                            }`}>
                                {done ? (
                                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : lastActive && isRejected ? (
                                    <span className="text-white text-xs">✕</span>
                                ) : (
                                    <span className={`text-xs ${active ? "text-white" : "text-slate-600"}`}>{i + 1}</span>
                                )}
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap hidden sm:block transition-colors ${
                                done || active
                                    ? lastActive && isRejected ? "text-rose-400"
                                        : lastActive && isHired ? "text-emerald-400"
                                            : "text-indigo-400"
                                    : "text-slate-600"
                            }`}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="flex-1 h-px mb-4 mx-0.5 sm:mx-1 min-w-[8px]"
                                 style={{ background: i < stepIdx ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Application Card ─────────────────────────────────────────────────────────
function AppCard({ app, idx }) {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const sc = STATUS_CONFIG[app.applicationStatus] || STATUS_CONFIG.APPLIED;

    // ── Field mapping: supports both flat & nested job object from backend ──
    const jobTitle    = app.job?.title    || app.jobTitle    || "Software Engineer";
    const jobCompany  = app.job?.company  || app.company     || "Company";
    const jobLocation = app.job?.location || app.location    || "Remote";
    const jobSalary   = app.job?.salary   || app.salary      || null;
    const jobDesc     = app.job?.description || app.description || "Work on exciting projects with a world-class engineering team.";
    const jobSkills   = app.job?.requiredSkills || app.job?.skills || app.skills || [];
    const appliedDate = app.appliedAt
        ? new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "Recently";
    const emoji = ["💼","🚀","🏢","⚡","🌐"][(app.id || app.applicationId || 0) % 5];

    return (
        <div className="card-in relative rounded-3xl overflow-hidden backdrop-blur-xl border transition-all duration-400 cursor-default"
             onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
             style={{
                 animationDelay: `${idx * 0.07}s`,
                 background: "linear-gradient(135deg,rgba(18,20,43,0.95),rgba(14,16,34,0.95))",
                 borderColor: hovered ? `${sc.color}35` : "rgba(99,102,241,0.13)",
                 boxShadow: hovered
                     ? `0 24px 60px rgba(0,0,0,0.45),0 0 30px ${sc.color}10,inset 0 1px 0 rgba(255,255,255,0.06)`
                     : "0 4px 20px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.03)",
                 transform: hovered ? "translateY(-3px)" : "translateY(0)",
             }}>

            {/* Status accent bar */}
            <div className="h-1 w-full transition-all duration-400"
                 style={{ background: `linear-gradient(90deg, ${sc.color}, ${sc.color}40, transparent)` }} />

            {/* Hover glow */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-400"
                 style={{ background: `radial-gradient(ellipse at 50% 0%,${sc.color}08 0%,transparent 55%)`, opacity: hovered ? 1 : 0 }} />
            {/* Shimmer top edge */}
            <div className="absolute top-1 left-8 right-8 h-px transition-opacity duration-400"
                 style={{ background: `linear-gradient(90deg,transparent,${sc.color}50,transparent)`, opacity: hovered ? 1 : 0 }} />

            <div className="relative p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 transition-transform duration-300"
                             style={{
                                 background: `linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))`,
                                 border: "1px solid rgba(99,102,241,0.2)",
                                 transform: hovered ? "scale(1.08) rotate(-4deg)" : "scale(1)",
                             }}>
                            {emoji}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-black text-sm sm:text-base leading-tight truncate"
                                style={{ fontFamily: "'Syne',sans-serif" }}>
                                {jobTitle}
                            </h3>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
                                {jobCompany} · {jobLocation}
                            </p>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border shrink-0"
                         style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>
                        <span>{sc.icon}</span>
                        <span className="hidden xs:block sm:block">{sc.label}</span>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-4">
                    <ProgressSteps app={app} />
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-slate-500 text-xs flex-wrap">
                        <span className="flex items-center gap-1">
                            💰 {jobSalary ? `₹${Number(jobSalary).toLocaleString()}` : "Negotiable"}
                        </span>
                        <span className="flex items-center gap-1">
                            📅 {appliedDate}
                        </span>
                    </div>
                    <button onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs font-semibold transition-colors duration-200 shrink-0"
                            style={{ color: sc.color }}>
                        {expanded ? "Less ↑" : "Details ↓"}
                    </button>
                </div>

                {/* Expanded details */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60 animate-fade-in">
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">{jobDesc}</p>
                        {jobSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {jobSkills.map((s, i) => (
                                    <span key={i} className="px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{s}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
    return (
        <div className="text-center py-16 sm:py-24 bg-white/2 border border-slate-800/40 rounded-3xl backdrop-blur-md">
            <div className="text-5xl sm:text-6xl mb-4">📭</div>
            <p className="text-slate-300 text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>
                No {filter !== "ALL" ? filter.toLowerCase() : ""} applications yet
            </p>
            <p className="text-slate-500 text-sm mb-6">
                {filter === "ALL" ? "Start applying to jobs to track your progress here" : `You have no ${filter.toLowerCase()} applications at the moment`}
            </p>
            <Link to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.4)", fontFamily: "'Syne',sans-serif" }}>
                Browse Jobs →
            </Link>
        </div>
    );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ onRetry }) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-rose-500/25 bg-rose-500/8 mb-6">
            <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-rose-300 text-sm font-medium">Failed to load applications. Please check your connection.</p>
            </div>
            <button onClick={onRetry} className="px-4 py-2 rounded-xl text-sm font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-500/15 transition-all shrink-0"
                    style={{ fontFamily: "'Syne',sans-serif" }}>
                ↺ Retry
            </button>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function UserDashboard() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(false);
    const [filter, setFilter]             = useState("ALL");
    const [visible, setVisible]           = useState(false);

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        setError(false);
        try {
            // ✅ Uses userAPI.getMyApplications() → GET /user/application with JWT
            const res = await userAPI.getMyApplications();
            setApplications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
            setError(true);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const counts = {
        ALL:         applications.length,
        APPLIED:     applications.filter(a => a.applicationStatus === "APPLIED").length,
        SHORTLISTED: applications.filter(a => a.applicationStatus === "SHORTLISTED").length,
        HIRED:       applications.filter(a => a.applicationStatus === "HIRED").length,
        REJECTED:    applications.filter(a => a.applicationStatus === "REJECTED").length,
    };

    const filtered = filter === "ALL"
        ? applications
        : applications.filter(a => a.applicationStatus === filter);

    const filterIcons = { ALL: "📋", APPLIED: "📨", SHORTLISTED: "⭐", HIRED: "🎉", REJECTED: "❌" };
    const filterColors = { ALL: "#6366f1", APPLIED: "#6366f1", SHORTLISTED: "#f59e0b", HIRED: "#10b981", REJECTED: "#ef4444" };

    return (
        <>
            <style>{`
                @keyframes slide-up  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
                @keyframes card-in   { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes drift     { 0%{transform:translate(0,0)} 33%{transform:translate(22px,-14px)} 66%{transform:translate(-14px,10px)} 100%{transform:translate(0,0)} }
                @keyframes fade-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
                .au       { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
                .card-in  { animation: card-in 0.55s cubic-bezier(0.22,1,0.36,1) both; }
                .animate-fade-in { animation: fade-in 0.3s ease both; }
            `}</style>

            <div className="min-h-screen relative overflow-x-hidden"
                 style={{ background: "linear-gradient(145deg,#06070e 0%,#09091a 45%,#070912 100%)", fontFamily: "'DM Sans',sans-serif" }}>

                <ParticleCanvas />

                {/* Ambient orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position:"absolute", top:"5%", left:"5%", width:480, height:480, background:"radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)", borderRadius:"50%", animation:"drift 13s ease-in-out infinite" }} />
                    <div style={{ position:"absolute", bottom:"5%", right:"5%", width:380, height:380, background:"radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", borderRadius:"50%", animation:"drift 17s ease-in-out infinite reverse" }} />
                    <div style={{ position:"absolute", top:"45%", left:"55%", width:250, height:250, background:"radial-gradient(circle,rgba(6,182,212,0.05) 0%,transparent 70%)", borderRadius:"50%", animation:"drift 11s ease-in-out infinite 2s" }} />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ zIndex: 10 }}>

                    {/* ── Page Header ── */}
                    <div className={`mb-8 sm:mb-10 ${visible ? "au" : "opacity-0"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(99,102,241,0.4)]"
                                     style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Syne',sans-serif" }}>
                                        My Dashboard
                                    </h1>
                                    <p className="text-slate-500 text-sm mt-0.5">Track all your job applications in real time</p>
                                </div>
                            </div>
                            <Link to="/"
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-300 border border-slate-700/60 hover:border-indigo-500/40 hover:text-white hover:bg-indigo-500/8 transition-all duration-200 self-start sm:self-auto">
                                ← Browse Jobs
                            </Link>
                        </div>
                    </div>

                    {/* ── Error Banner ── */}
                    {error && <ErrorBanner onRetry={fetchApplications} />}

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                        <StatCard icon="📨" label="Total Applied" value={counts.ALL}         color="#6366f1" delay="0.08s" />
                        <StatCard icon="⭐" label="Shortlisted"   value={counts.SHORTLISTED} color="#f59e0b" delay="0.15s" />
                        <StatCard icon="🎉" label="Hired"         value={counts.HIRED}        color="#10b981" delay="0.22s" />
                        <StatCard icon="❌" label="Rejected"      value={counts.REJECTED}     color="#ef4444" delay="0.29s" />
                    </div>

                    {/* ── Filter Tabs ── */}
                    <div className="au flex flex-wrap gap-2 mb-6 sm:mb-8" style={{ animationDelay: "0.2s" }}>
                        {Object.entries(counts).map(([key, cnt]) => {
                            const active = filter === key;
                            return (
                                <button key={key} onClick={() => setFilter(key)}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-95"
                                        style={{
                                            background: active ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.03)",
                                            border: active ? "none" : "1px solid rgba(99,102,241,0.15)",
                                            color: active ? "white" : "#94a3b8",
                                            boxShadow: active ? "0 0 18px rgba(99,102,241,0.4)" : "none",
                                            fontFamily: "'Syne',sans-serif",
                                        }}>
                                    <span>{filterIcons[key]}</span>
                                    <span>{key}</span>
                                    <span className="px-1.5 py-0.5 text-xs rounded-lg"
                                          style={{ background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", color: active ? "white" : "#6366f1" }}>
                                        {cnt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Applications Grid ── */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-3xl border border-slate-800/60 animate-pulse"
                                     style={{ height: "14rem", background: "rgba(255,255,255,0.02)", animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState filter={filter} />
                    ) : (
                        <>
                            <p className="text-slate-600 text-xs font-medium mb-4">
                                Showing {filtered.length} {filter !== "ALL" ? filter.toLowerCase() : ""} application{filtered.length !== 1 ? "s" : ""}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                {filtered.map((app, i) => (
                                    <AppCard key={app.id || app.applicationId || i} app={app} idx={i} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}