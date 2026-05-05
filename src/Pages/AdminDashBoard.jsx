import { useState, useEffect, useRef } from "react";
import { adminJobAPI, adminAppAPI } from "../Services/api.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTS = ["APPLIED", "SHORTLISTED", "HIRED", "REJECTED"];

const STATUS_CFG = {
    APPLIED:     { color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", icon: "📨", label: "Applied"     },
    SHORTLISTED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", icon: "⭐", label: "Shortlisted" },
    HIRED:       { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", icon: "🎉", label: "Hired"       },
    REJECTED:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)",  icon: "❌", label: "Rejected"    },
};

const STATUS_CLASSES = {
    OPEN:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    CLOSED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const jobId = (j) => j?.jobId || j?.id;
const appId = (a) => a?.id || a?.applicationId;

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
            dx: (Math.random() - 0.5) * 0.28, dy: (Math.random() - 0.5) * 0.28,
            o: Math.random() * 0.32 + 0.08,
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
                if (d < 90) {
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.06*(1-d/90)})`; ctx.lineWidth=0.5; ctx.stroke();
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className="fixed top-5 right-4 sm:right-6 z-[60] flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] toast-in max-w-[calc(100vw-2rem)]"
             style={{
                 background: type === "success" ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)",
                 borderColor: type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
             }}>
            <span className="text-lg sm:text-xl shrink-0">{type === "success" ? "✅" : "❌"}</span>
            <span className="text-white text-sm font-semibold flex-1" style={{ fontFamily: "'DM Sans',sans-serif" }}>{msg}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-1 text-xl leading-none shrink-0">×</button>
        </div>
    );
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const end = Number(value) || 0;
        if (!end) { setDisplay(0); return; }
        let s = 0; const step = Math.ceil(end / 20);
        const t = setInterval(() => { s += step; if (s >= end) { setDisplay(end); clearInterval(t); } else setDisplay(s); }, 40);
        return () => clearInterval(t);
    }, [value]);
    return <>{display}</>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="au relative overflow-hidden rounded-3xl p-4 sm:p-5 backdrop-blur-xl border transition-all duration-350 cursor-default"
             onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
             style={{
                 animationDelay: delay,
                 background: "linear-gradient(135deg,rgba(18,20,43,0.95),rgba(14,16,34,0.95))",
                 borderColor: hovered ? `${color}40` : "rgba(99,102,241,0.12)",
                 boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.4),0 0 28px ${color}15` : "0 4px 18px rgba(0,0,0,0.2)",
                 transform: hovered ? "translateY(-3px)" : "translateY(0)",
             }}>
            <div className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-350"
                 style={{ background: `radial-gradient(ellipse at 50% 0%,${color}10,transparent 55%)`, opacity: hovered ? 1 : 0 }} />
            <div className="absolute top-0 left-5 right-5 h-px transition-opacity duration-350"
                 style={{ background: `linear-gradient(90deg,transparent,${color}55,transparent)`, opacity: hovered ? 1 : 0 }} />
            <div className="relative flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-transform duration-300"
                     style={{ background: `${color}20`, border: `1px solid ${color}30`, transform: hovered ? "scale(1.1) rotate(-4deg)" : "scale(1)" }}>
                    {icon}
                </div>
                <span className="text-slate-400 text-xs sm:text-sm font-medium">{label}</span>
            </div>
            <div className="relative text-3xl sm:text-4xl font-black" style={{ fontFamily: "'Syne',sans-serif", color }}>
                <AnimatedNumber value={value} />
            </div>
        </div>
    );
}

// ─── Job Form Modal ───────────────────────────────────────────────────────────
function JobModal({ job, onClose, onSave }) {
    const isEdit = !!(job?.jobId || job?.id);
    const initialSkills = job?.requiredSkills || job?.skills;
    const skillsStr = Array.isArray(initialSkills) ? initialSkills.join(", ") : (initialSkills || "");

    const [form, setForm] = useState(isEdit ? { ...job, skills: skillsStr } : {
        title: "", company: "", location: "", description: "",
        salary: "", jobType: "Full-time", skills: "", jobStatus: "OPEN",
    });
    const [saving, setSaving] = useState(false);
    const [fieldError, setFieldError] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        if (!form.title?.trim()) { setFieldError("Job title is required."); return; }
        if (!form.company?.trim()) { setFieldError("Company is required."); return; }
        setFieldError("");
        setSaving(true);
        try {
            const payload = {
                ...form,
                salary: form.salary ? Number(form.salary) : null,
                requiredSkills: form.skills?.split(",").map(s => s.trim()).filter(Boolean),
            };
            if (isEdit) {
                // ✅ Uses adminJobAPI.updateJob()
                const res = await adminJobAPI.updateJob(jobId(job), payload);
                onSave(res.data, false);
            } else {
                // ✅ Uses adminJobAPI.createJob()
                const res = await adminJobAPI.createJob(payload);
                onSave(res.data, true);
            }
        } catch (err) {
            console.error("Save failed:", err);
            onSave(null, isEdit ? false : true);
        } finally {
            setSaving(false);
            onClose();
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-slate-700/60 bg-white/3 text-white text-sm outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all placeholder-slate-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
             style={{ background: "rgba(6,7,14,0.88)", backdropFilter: "blur(18px)" }}>
            <div className="modal-in w-full max-w-lg bg-gradient-to-br from-[#12142b] to-[#0e1022] border border-indigo-500/25 rounded-3xl p-5 sm:p-7 shadow-[0_40px_100px_rgba(0,0,0,0.65),0_0_40px_rgba(99,102,241,0.10)] max-h-[92vh] overflow-y-auto">
                {/* Shimmer top edge */}
                <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.6),transparent)" }} />

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>
                        {isEdit ? "✏️ Edit Job" : "➕ Create Job"}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xl">×</button>
                </div>

                {fieldError && (
                    <div className="mb-4 px-4 py-3 rounded-2xl border border-rose-500/25 bg-rose-500/8 text-rose-300 text-sm">
                        ⚠️ {fieldError}
                    </div>
                )}

                <div className="space-y-4">
                    {[
                        { k: "title",    label: "Job Title",               type: "text",   icon: "💼", required: true  },
                        { k: "company",  label: "Company",                  type: "text",   icon: "🏢", required: true  },
                        { k: "location", label: "Location",                 type: "text",   icon: "📍"                  },
                        { k: "salary",   label: "Salary (annual, e.g. 1200000)", type: "number", icon: "💰"             },
                        { k: "skills",   label: "Skills (comma separated)", type: "text",   icon: "🛠️"                  },
                    ].map(({ k, label, type, icon, required }) => (
                        <div key={k}>
                            <label className="text-slate-500 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                                <span>{icon}</span>{label}{required && <span className="text-rose-400">*</span>}
                            </label>
                            <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)}
                                   placeholder={label} className={inputCls}
                                   style={{ fontFamily: "'DM Sans',sans-serif" }} />
                        </div>
                    ))}

                    <div>
                        <label className="text-slate-500 text-xs font-medium mb-1.5 block">📝 Description</label>
                        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
                                  rows={3} placeholder="Job description…" className={`${inputCls} resize-none`}
                                  style={{ fontFamily: "'DM Sans',sans-serif" }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            ["jobType",   "Job Type", ["Full-time","Part-time","Contract","Remote"]],
                            ["jobStatus", "Status",   ["OPEN","CLOSED","PAUSED"]],
                        ].map(([k, label, opts]) => (
                            <div key={k}>
                                <label className="text-slate-500 text-xs font-medium mb-1.5 block">{label}</label>
                                <select value={form[k] || ""} onChange={e => set(k, e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-700/60 bg-[#0e1022] text-white text-sm outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                        style={{ fontFamily: "'DM Sans',sans-serif" }}>
                                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-white/5 transition-all"
                            style={{ fontFamily: "'Syne',sans-serif" }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.4)", fontFamily: "'Syne',sans-serif" }}>
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                Saving…
                            </span>
                        ) : isEdit ? "Update Job" : "Create Job"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Job Row ──────────────────────────────────────────────────────────────────
function JobRow({ job, onEdit, onDelete, onViewApps }) {
    const [deleting, setDeleting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);

    const handleDelete = async () => {
        if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000); return; }
        setDeleting(true);
        try {
            // ✅ Uses adminJobAPI.deleteJob()
            await adminJobAPI.deleteJob(jobId(job));
            onDelete(jobId(job));
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setDeleting(false);
            setConfirmDel(false);
        }
    };

    const statusCls = STATUS_CLASSES[job.jobStatus] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
        <tr className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors group">
            <td className="py-3.5 px-4 sm:px-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/15 flex items-center justify-center text-base shrink-0">
                        💼
                    </div>
                    <div className="min-w-0">
                        <div className="text-white font-bold text-sm truncate" style={{ fontFamily: "'Syne',sans-serif" }}>{job.title}</div>
                        <div className="text-slate-500 text-xs truncate">{job.company || job.companyName || "—"}</div>
                    </div>
                </div>
            </td>
            <td className="py-3.5 px-3 sm:px-4 text-slate-400 text-sm hidden sm:table-cell">{job.location || "—"}</td>
            <td className="py-3.5 px-3 sm:px-4">
                <span className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-full border ${statusCls}`}>
                    {job.jobStatus || "OPEN"}
                </span>
            </td>
            <td className="py-3.5 px-3 sm:px-4 text-slate-400 text-sm hidden md:table-cell">
                {job.salary ? `₹${Number(job.salary).toLocaleString()}` : "—"}
            </td>
            <td className="py-3.5 px-3 sm:px-4">
                <div className="flex items-center gap-1.5 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewApps(job)}
                            className="px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap">
                        📋 <span className="hidden sm:inline">Apps</span>
                    </button>
                    <button onClick={() => onEdit(job)}
                            className="px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                        ✏️
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                            className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap ${
                                confirmDel ? "text-white bg-rose-600 border border-rose-500" : "text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                            }`}>
                        {deleting ? "…" : confirmDel ? "Sure?" : "🗑️"}
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Applications Panel (per Job) ─────────────────────────────────────────────
function ApplicationsPanel({ job, onClose }) {
    const [apps, setApps]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast]     = useState(null);
    const [search, setSearch]   = useState("");

    useEffect(() => {
        const fetch = async () => {
            const id = jobId(job);
            if (!id) { setLoading(false); return; }
            try {
                // ✅ Uses adminAppAPI.getApplicationsByJob()
                const res = await adminAppAPI.getApplicationsByJob(id);
                setApps(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to fetch apps:", err);
                setApps([]);
            } finally { setLoading(false); }
        };
        fetch();
    }, [job]);

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            // ✅ Uses adminAppAPI.updateStatus()
            await adminAppAPI.updateStatus(id, status);
            setApps(prev => prev.map(a => appId(a) === id ? { ...a, applicationStatus: status } : a));
            setToast({ msg: `Updated to ${status}`, type: "success" });
        } catch (err) {
            console.error("Status update failed:", err);
            setToast({ msg: "Failed to update status", type: "error" });
        } finally { setUpdating(null); }
    };

    const filtered = apps.filter(a =>
        !search ||
        a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
             style={{ background: "rgba(6,7,14,0.88)", backdropFilter: "blur(18px)" }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            <div className="modal-in w-full max-w-2xl bg-gradient-to-br from-[#12142b] to-[#0e1022] border border-indigo-500/25 rounded-3xl p-5 sm:p-7 shadow-[0_40px_100px_rgba(0,0,0,0.65)] max-h-[88vh] flex flex-col">
                {/* Shimmer */}
                <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.6),transparent)" }} />

                <div className="flex items-start justify-between mb-5 shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>📋 Applicants</h2>
                        <p className="text-slate-500 text-sm mt-0.5 truncate max-w-[260px]">{job.title} · {apps.length} applicant{apps.length !== 1 ? "s" : ""}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xl shrink-0">×</button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-700/50 bg-white/3 mb-4 shrink-0 focus-within:border-indigo-500/40 transition-all">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
                           className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-slate-400 text-sm">{search ? "No applicants match your search" : "No applications yet"}</p>
                        </div>
                    ) : (
                        filtered.map(app => {
                            const id = appId(app);
                            const sc = STATUS_CFG[app.applicationStatus] || STATUS_CFG.APPLIED;
                            return (
                                <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-700/35 bg-white/2 hover:bg-white/4 transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
                                             style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", color: "#818cf8", fontFamily: "'Syne',sans-serif" }}>
                                            {(app.user?.name || "U")[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-white font-bold text-sm truncate" style={{ fontFamily: "'Syne',sans-serif" }}>{app.user?.name || "Applicant"}</div>
                                            <div className="text-slate-500 text-xs truncate">{app.user?.email || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0 pl-13 sm:pl-0">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap"
                                              style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>
                                            {sc.icon} {app.applicationStatus}
                                        </span>
                                        <select value={app.applicationStatus}
                                                onChange={e => updateStatus(id, e.target.value)}
                                                disabled={updating === id}
                                                className="px-3 py-2 rounded-xl border border-slate-700/50 bg-[#0e1022] text-white text-xs outline-none focus:border-indigo-500/50 transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                                style={{ fontFamily: "'DM Sans',sans-serif" }}>
                                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {updating === id && (
                                            <svg className="w-4 h-4 animate-spin text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [tab, setTab]           = useState("jobs");
    const [jobs, setJobs]         = useState([]);
    const [allApps, setAllApps]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [loadingApps, setLoadingApps] = useState(false);
    const [errorJobs, setErrorJobs]     = useState(false);

    const [jobModal, setJobModal]   = useState(null);
    const [appsPanel, setAppsPanel] = useState(null);
    const [toast, setToast]         = useState(null);
    const [visible, setVisible]     = useState(false);
    const [appSearch, setAppSearch] = useState("");
    const [jobSearch, setJobSearch] = useState("");

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
        fetchAllJobs();
    }, []);

    // Load all applications only when that tab is first opened
    useEffect(() => {
        if (tab === "applications" && allApps.length === 0 && !loadingApps) {
            setLoadingApps(true);
            // Note: your backend's getAllApplication endpoint requires a path variable {id}
            // which doesn't make sense for a "get all" route. Using getApplicationsByJob
            // per job is the correct approach via the Applications Panel.
            // Adjust this URL if your backend has a dedicated global endpoint.
            import("../services/api").then(({ api }) => {
                api.get("/admin/Application/getAllApplication")
                    .then(res => setAllApps(Array.isArray(res.data) ? res.data : []))
                    .catch(() => setAllApps([]))
                    .finally(() => setLoadingApps(false));
            });
        }
    }, [tab]);

    const fetchAllJobs = async () => {
        setLoading(true); setErrorJobs(false);
        try {
            // ✅ Uses adminJobAPI.getAllJobs()
            const res = await adminJobAPI.getAllJobs();
            setJobs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            setErrorJobs(true);
            setJobs([]);
        } finally { setLoading(false); }
    };

    const handleSave = (job, isNew) => {
        if (!job) { setToast({ msg: "Error saving job", type: "error" }); return; }
        if (isNew) {
            setJobs(prev => [job, ...prev]);
        } else {
            const id = jobId(job);
            setJobs(prev => prev.map(j => jobId(j) === id ? job : j));
        }
        setToast({ msg: isNew ? "✅ Job created!" : "✅ Job updated!", type: "success" });
    };

    const handleDelete = (id) => {
        setJobs(prev => prev.filter(j => jobId(j) !== id));
        setToast({ msg: "Job deleted", type: "success" });
    };

    const openJobs   = jobs.filter(j => j.jobStatus === "OPEN").length;
    const closedJobs = jobs.filter(j => j.jobStatus !== "OPEN").length;

    const filteredJobs = jobs.filter(j =>
        !jobSearch ||
        j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
        (j.company || j.companyName || "").toLowerCase().includes(jobSearch.toLowerCase())
    );

    const filteredApps = allApps.filter(a =>
        !appSearch ||
        a.user?.name?.toLowerCase().includes(appSearch.toLowerCase()) ||
        a.job?.title?.toLowerCase().includes(appSearch.toLowerCase())
    );

    return (
        <>
            <style>{`
                @keyframes slide-up  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
                @keyframes modal-in  { from{opacity:0;transform:scale(0.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes toast-in  { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
                @keyframes drift     { 0%{transform:translate(0,0)} 33%{transform:translate(20px,-12px)} 66%{transform:translate(-12px,9px)} 100%{transform:translate(0,0)} }
                @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
                .au       { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
                .modal-in { animation: modal-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                .toast-in { animation: toast-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen relative overflow-x-hidden"
                 style={{ background: "linear-gradient(145deg,#06070e 0%,#09091a 45%,#070912 100%)", fontFamily: "'DM Sans',sans-serif" }}>

                <ParticleCanvas />

                {/* Ambient orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position:"absolute", top:"5%", left:"5%", width:450, height:450, background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)", borderRadius:"50%", animation:"drift 13s ease-in-out infinite" }} />
                    <div style={{ position:"absolute", bottom:"5%", right:"5%", width:380, height:380, background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)", borderRadius:"50%", animation:"drift 17s ease-in-out infinite reverse" }} />
                </div>

                {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
                {jobModal !== null && (
                    <JobModal job={jobId(jobModal) ? jobModal : null} onClose={() => setJobModal(null)} onSave={handleSave} />
                )}
                {appsPanel && <ApplicationsPanel job={appsPanel} onClose={() => setAppsPanel(null)} />}

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ zIndex: 10 }}>

                    {/* ── Header ── */}
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10 ${visible ? "au" : "opacity-0"}`}>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(99,102,241,0.4)]"
                                 style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>Admin Panel</h1>
                                <p className="text-slate-500 text-sm">Manage jobs and applications</p>
                            </div>
                        </div>
                        <button onClick={() => setJobModal({})}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:scale-105 self-start sm:self-auto"
                                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 22px rgba(99,102,241,0.45)", fontFamily: "'Syne',sans-serif" }}>
                            <span className="text-lg leading-none">+</span> Post New Job
                        </button>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                        <StatCard icon="💼" label="Total Jobs"      value={jobs.length}      color="#6366f1" delay="0.08s" />
                        <StatCard icon="🟢" label="Open Jobs"       value={openJobs}         color="#10b981" delay="0.15s" />
                        <StatCard icon="🔴" label="Closed / Paused" value={closedJobs}        color="#ef4444" delay="0.22s" />
                        <StatCard icon="📋" label="Applications"    value={allApps.length}   color="#f59e0b" delay="0.29s" />
                    </div>

                    {/* ── Tab Switcher ── */}
                    <div className="au flex gap-2 mb-5 sm:mb-6 flex-wrap" style={{ animationDelay: "0.2s" }}>
                        {[["jobs","💼 Jobs"],["applications","📋 All Applications"]].map(([key,label]) => (
                            <button key={key} onClick={() => setTab(key)}
                                    className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                                        tab === key ? "text-white" : "border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600"
                                    }`}
                                    style={tab === key ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)", fontFamily: "'Syne',sans-serif" } : { fontFamily: "'Syne',sans-serif" }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ══ JOBS TAB ══ */}
                    {tab === "jobs" && (
                        <div className="au" style={{ animationDelay: "0.25s" }}>
                            {/* Error */}
                            {errorJobs && (
                                <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-rose-500/25 bg-rose-500/8 mb-5">
                                    <div className="flex items-center gap-3">
                                        <span>⚠️</span>
                                        <p className="text-rose-300 text-sm font-medium">Failed to load jobs.</p>
                                    </div>
                                    <button onClick={fetchAllJobs} className="px-4 py-2 rounded-xl text-sm font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-500/15 transition-all shrink-0"
                                            style={{ fontFamily: "'Syne',sans-serif" }}>↺ Retry</button>
                                </div>
                            )}

                            {/* Job Search */}
                            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-2xl border border-slate-700/50 bg-white/3 backdrop-blur-md mb-4 focus-within:border-indigo-500/40 transition-all">
                                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs by title or company…"
                                       className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
                                {jobSearch && <button onClick={() => setJobSearch("")} className="text-slate-500 hover:text-white text-xl leading-none">×</button>}
                            </div>

                            {/* Table */}
                            <div className="bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/13 rounded-3xl backdrop-blur-xl overflow-hidden">
                                {loading ? (
                                    <div className="p-6 sm:p-8 space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="h-14 rounded-2xl bg-white/3 animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[480px]">
                                            <thead>
                                            <tr className="border-b border-slate-800/70">
                                                {["Job","Location","Status","Salary","Actions"].map((h,i) => (
                                                    <th key={h} className={`py-4 px-3 sm:px-5 text-left text-slate-500 text-xs font-bold uppercase tracking-wider ${i===1||i===3?"hidden sm:table-cell":""}`}>{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredJobs.map(job => (
                                                <JobRow key={jobId(job)} job={job}
                                                        onEdit={j => setJobModal(j)}
                                                        onDelete={handleDelete}
                                                        onViewApps={j => setAppsPanel(j)} />
                                            ))}
                                            </tbody>
                                        </table>
                                        {filteredJobs.length === 0 && (
                                            <div className="text-center py-16 sm:py-20">
                                                <div className="text-5xl mb-3">📭</div>
                                                <p className="text-slate-400 text-base">{jobSearch ? `No jobs matching "${jobSearch}"` : "No jobs posted yet"}</p>
                                                {!jobSearch && (
                                                    <button onClick={() => setJobModal({})} className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105"
                                                            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)", fontFamily: "'Syne',sans-serif" }}>
                                                        + Post First Job
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ ALL APPLICATIONS TAB ══ */}
                    {tab === "applications" && (
                        <div className="au" style={{ animationDelay: "0.25s" }}>
                            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-2xl border border-slate-700/50 bg-white/3 backdrop-blur-md mb-5 focus-within:border-indigo-500/40 transition-all">
                                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                <input value={appSearch} onChange={e => setAppSearch(e.target.value)} placeholder="Search by applicant name or job title…"
                                       className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
                                {appSearch && <button onClick={() => setAppSearch("")} className="text-slate-500 hover:text-white text-xl leading-none">×</button>}
                            </div>

                            <div className="bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/13 rounded-3xl backdrop-blur-xl overflow-hidden">
                                {loadingApps ? (
                                    <div className="p-6 sm:p-8 space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white/3 animate-pulse" />)}
                                    </div>
                                ) : filteredApps.length === 0 ? (
                                    <div className="text-center py-16 sm:py-20">
                                        <div className="text-5xl mb-3">📭</div>
                                        <p className="text-slate-400">
                                            {appSearch ? `No results for "${appSearch}"` : "No applications yet — use 📋 Apps on any job to view its applicants"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[440px]">
                                            <thead>
                                            <tr className="border-b border-slate-800/70">
                                                {["Applicant","Job Applied","Status","Applied On"].map(h => (
                                                    <th key={h} className="py-4 px-3 sm:px-5 text-left text-slate-500 text-xs font-bold uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredApps.map(app => {
                                                const sc = STATUS_CFG[app.applicationStatus] || STATUS_CFG.APPLIED;
                                                return (
                                                    <tr key={appId(app)} className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-3.5 px-3 sm:px-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                                                                     style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", color: "#818cf8", fontFamily: "'Syne',sans-serif" }}>
                                                                    {(app.user?.name || "U")[0].toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-white font-bold text-sm truncate" style={{ fontFamily: "'Syne',sans-serif" }}>{app.user?.name || "Applicant"}</div>
                                                                    <div className="text-slate-500 text-xs truncate">{app.user?.email || "—"}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-3 sm:px-4 text-slate-300 text-sm font-medium max-w-[120px] sm:max-w-none">
                                                            <span className="truncate block">{app.job?.title || "—"}</span>
                                                        </td>
                                                        <td className="py-3.5 px-3 sm:px-4">
                                                                <span className="text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full border whitespace-nowrap"
                                                                      style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>
                                                                    {sc.icon} <span className="hidden sm:inline">{app.applicationStatus}</span>
                                                                </span>
                                                        </td>
                                                        <td className="py-3.5 px-3 sm:px-4 text-slate-400 text-sm whitespace-nowrap">
                                                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
