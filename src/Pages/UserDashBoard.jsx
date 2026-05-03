import { useState, useEffect } from "react";

const API = "http://localhost:8080";
const token = () => localStorage.getItem("jwt");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    APPLIED:     { color: "#6366f1", bg: "rgba(99,102,241,0.12)",   border: "rgba(99,102,241,0.25)",  icon: "📨", label: "Applied",     step: 1 },
    SHORTLISTED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   border: "rgba(245,158,11,0.25)",  icon: "⭐", label: "Shortlisted", step: 2 },
    HIRED:       { color: "#10b981", bg: "rgba(16,185,129,0.12)",   border: "rgba(16,185,129,0.25)",  icon: "🎉", label: "Hired!",      step: 4 },
    REJECTED:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",    border: "rgba(239,68,68,0.25)",   icon: "❌", label: "Rejected",    step: 4 },
};

const STEPS = ["Applied", "Shortlisted", "Interview", "Decision"];

// ─── Application Card ─────────────────────────────────────────────────────────
function AppCard({ app, idx }) {
    const [expanded, setExpanded] = useState(false);
    const sc = STATUS_CONFIG[app.applicationStatus] || STATUS_CONFIG.APPLIED;
    const stepIdx = sc.step - 1;

    return (
        <div
            className="card-in bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            style={{ borderColor: "rgba(99,102,241,0.15)", animationDelay: `${idx * 0.07}s` }}
        >
            {/* Status accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${sc.color}, transparent)` }} />

            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-xl shrink-0">
                            {["💼", "🚀", "🏢", "⚡", "🌐"][app.id % 5]}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base leading-tight" style={{ fontFamily: "'Syne',sans-serif" }}>
                                {app.job?.title || app.jobTitle || "Software Engineer"}
                            </h3>
                            <p className="text-slate-500 text-sm">{app.job?.companyName || "Company"} · {app.job?.location || "Remote"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                         style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>
                        <span>{sc.icon}</span>
                        {sc.label}
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-1 mb-4">
                    {STEPS.map((s, i) => {
                        const done = i < stepIdx;
                        const active = i === stepIdx;
                        const isHired = app.applicationStatus === "HIRED";
                        const isRejected = app.applicationStatus === "REJECTED";
                        const lastActive = (isHired || isRejected) && i === 3;
                        return (
                            <div key={s} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1 w-full">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                                        lastActive && isHired ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            : lastActive && isRejected ? "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                                : done || active ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                                                    : "bg-slate-800 border border-slate-700"
                                    }`}>
                                        {done ? (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        ) : lastActive && isRejected ? (
                                            <span className="text-white text-xs">✕</span>
                                        ) : (
                                            <span className={`text-xs ${active ? "text-white" : "text-slate-600"}`}>{i + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
                                        done || active ? (lastActive && isRejected ? "text-rose-400" : lastActive && isHired ? "text-emerald-400" : "text-indigo-400") : "text-slate-600"
                                    }`}>{s}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="flex-1 h-px mb-4 mx-1" style={{ background: i < stepIdx ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)" }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-500 text-xs">
                        <span>💰 {app.job?.salary ? `₹${app.job.salary} LPA` : "₹12–25 LPA"}</span>
                        <span>📅 {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("en-IN") : "Today"}</span>
                    </div>
                    <button onClick={() => setExpanded(!expanded)}
                            className="text-indigo-400 text-xs font-semibold hover:text-indigo-300 transition-colors flex items-center gap-1">
                        {expanded ? "Less ↑" : "Details ↓"}
                    </button>
                </div>

                {/* Expanded details */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60">
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">
                            {app.job?.description || "Work on exciting projects with a world-class engineering team."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {(app.job?.skills || ["React", "Node.js"]).map((s, i) => (
                                <span key={i} className="px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{s}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
    return (
        <div className="au bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl p-5 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300"
             style={{ animationDelay: delay }}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    {icon}
                </div>
                <span className="text-slate-500 text-sm font-medium">{label}</span>
            </div>
            <div className="text-3xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif", color }}>{value}</div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function UserDashboard() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${API}/user/application`, { headers: authHeaders() });
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch {
            // demo fallback
            setApplications([
                { id: 1, jobTitle: "Senior React Developer", applicationStatus: "SHORTLISTED", appliedAt: "2026-04-25", job: { title: "Senior React Developer", companyName: "Google", location: "Hyderabad", salary: "28–40", skills: ["React", "TypeScript", "GraphQL"], description: "Build amazing UIs." } },
                { id: 2, jobTitle: "Java Spring Boot Engineer", applicationStatus: "APPLIED", appliedAt: "2026-04-28", job: { title: "Java Spring Boot Engineer", companyName: "Amazon", location: "Bangalore", salary: "22–35", skills: ["Java", "Spring Boot", "Kafka"], description: "Design scalable microservices." } },
                { id: 3, jobTitle: "Full Stack Developer", applicationStatus: "HIRED", appliedAt: "2026-04-20", job: { title: "Full Stack Developer", companyName: "TCS Digital", location: "Chennai", salary: "18–28", skills: ["React", "Node.js", "MongoDB"], description: "Work across the full stack." } },
                { id: 4, jobTitle: "DevOps Engineer", applicationStatus: "REJECTED", appliedAt: "2026-04-15", job: { title: "DevOps Engineer", companyName: "Microsoft", location: "Remote", salary: "25–38", skills: ["Kubernetes", "Terraform", "Azure"], description: "Automate cloud infra." } },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const counts = {
        ALL: applications.length,
        APPLIED: applications.filter(a => a.applicationStatus === "APPLIED").length,
        SHORTLISTED: applications.filter(a => a.applicationStatus === "SHORTLISTED").length,
        HIRED: applications.filter(a => a.applicationStatus === "HIRED").length,
        REJECTED: applications.filter(a => a.applicationStatus === "REJECTED").length,
    };

    const filtered = filter === "ALL" ? applications : applications.filter(a => a.applicationStatus === filter);

    return (
        <>
            <style>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes card-in { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes drift { 0%{transform:translate(0,0)} 33%{transform:translate(22px,-14px)} 66%{transform:translate(-14px,10px)} 100%{transform:translate(0,0)} }
        .au { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .card-in { animation: card-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

            <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg,#07080f 0%,#0d0f1e 50%,#080a14 100%)", fontFamily: "'DM Sans',sans-serif" }}>
                {/* Orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position: "absolute", top: "5%", left: "5%", width: 450, height: 450, background: "radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 13s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 380, height: 380, background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 17s ease-in-out infinite reverse" }} />
                </div>

                <div className="relative max-w-6xl mx-auto px-6 py-12" style={{ zIndex: 10 }}>

                    {/* Header */}
                    <div className={`mb-10 ${visible ? "au" : "opacity-0"}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.4)]">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Syne',sans-serif" }}>
                                    My Dashboard
                                </h1>
                                <p className="text-slate-500 text-sm">Track all your job applications</p>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatCard icon="📨" label="Total Applied" value={counts.ALL} color="#6366f1" delay="0.1s" />
                        <StatCard icon="⭐" label="Shortlisted" value={counts.SHORTLISTED} color="#f59e0b" delay="0.18s" />
                        <StatCard icon="🎉" label="Hired" value={counts.HIRED} color="#10b981" delay="0.26s" />
                        <StatCard icon="❌" label="Rejected" value={counts.REJECTED} color="#ef4444" delay="0.34s" />
                    </div>

                    {/* Filter Tabs */}
                    <div className={`flex flex-wrap gap-2 mb-8 au`} style={{ animationDelay: "0.2s" }}>
                        {Object.entries(counts).map(([key, cnt]) => (
                            <button key={key} onClick={() => setFilter(key)}
                                    className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                                        filter === key
                                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                            : "border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600"
                                    }`}
                                    style={{ fontFamily: "'Syne',sans-serif" }}>
                                {key}
                                <span className="px-1.5 py-0.5 text-xs rounded-md bg-white/10">{cnt}</span>
                            </button>
                        ))}
                    </div>

                    {/* Applications */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-52 rounded-3xl bg-white/3 border border-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-slate-400 text-lg font-medium">No {filter !== "ALL" ? filter.toLowerCase() : ""} applications yet</p>
                            <a href="/jobs" className="inline-block mt-4 px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300"
                               style={{ fontFamily: "'Syne',sans-serif" }}>Browse Jobs →</a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filtered.map((app, i) => <AppCard key={app.id} app={app} idx={i} />)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}