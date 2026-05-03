import { useState, useEffect } from "react";

const API = "http://localhost:8080";
const token = () => localStorage.getItem("jwt");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const STATUS_OPTS = ["APPLIED", "SHORTLISTED", "HIRED", "REJECTED"];
const STATUS_CFG = {
    APPLIED:     { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  icon: "📨" },
    SHORTLISTED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  icon: "⭐" },
    HIRED:       { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)",  icon: "🎉" },
    REJECTED:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   icon: "❌" },
};

// ─── Notification Toast ───────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
    return (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] toast-in"
             style={{
                 background: type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                 borderColor: type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
             }}>
            <span className="text-xl">{type === "success" ? "✅" : "❌"}</span>
            <span className="text-white text-sm font-semibold" style={{ fontFamily: "'DM Sans',sans-serif" }}>{msg}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2 text-lg leading-none">×</button>
        </div>
    );
}

// ─── Job Form Modal ───────────────────────────────────────────────────────────
function JobModal({ job, onClose, onSave }) {
    const [form, setForm] = useState(job || { title: "", companyName: "", location: "", description: "", salary: "", jobType: "Full-time", skills: "", jobStatus: "OPEN" });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form, requiredSkills: form.skills?.split(",").map(s => s.trim()).filter(Boolean) };
            if (job?.id) {
                const res = await fetch(`${API}/admin/job/${job.id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
                onSave(await res.json(), false);
            } else {
                const res = await fetch(`${API}/admin/job/createJob`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
                onSave(await res.json(), true);
            }
        } catch { onSave(form, job ? false : true); }
        finally { setSaving(false); onClose(); }
    };

    const fields = [
        { k: "title", label: "Job Title", type: "text", icon: "💼" },
        { k: "companyName", label: "Company", type: "text", icon: "🏢" },
        { k: "location", label: "Location", type: "text", icon: "📍" },
        { k: "salary", label: "Salary (e.g. 12–25 LPA)", type: "text", icon: "💰" },
        { k: "skills", label: "Skills (comma separated)", type: "text", icon: "🛠️" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,8,15,0.85)", backdropFilter: "blur(14px)" }}>
            <div className="modal-in w-full max-w-lg bg-gradient-to-br from-[#12142b] to-[#0e1022] border border-indigo-500/25 rounded-3xl p-7 shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_40px_rgba(99,102,241,0.08)] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>
                        {job?.id ? "✏️ Edit Job" : "➕ Create Job"}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">×</button>
                </div>

                <div className="space-y-4">
                    {fields.map(({ k, label, type, icon }) => (
                        <div key={k}>
                            <label className="text-slate-500 text-xs font-medium mb-1.5 block">{icon} {label}</label>
                            <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)} placeholder={label}
                                   className="w-full px-4 py-3 rounded-2xl border border-slate-700/60 bg-white/3 text-white text-sm outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all placeholder-slate-600"
                                   style={{ fontFamily: "'DM Sans',sans-serif" }} />
                        </div>
                    ))}

                    <div>
                        <label className="text-slate-500 text-xs font-medium mb-1.5 block">📝 Description</label>
                        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={3} placeholder="Job description…"
                                  className="w-full px-4 py-3 rounded-2xl border border-slate-700/60 bg-white/3 text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600 resize-none"
                                  style={{ fontFamily: "'DM Sans',sans-serif" }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[["jobType", "Job Type", ["Full-time", "Part-time", "Contract", "Remote"]], ["jobStatus", "Status", ["OPEN", "CLOSED", "PAUSED"]]].map(([k, label, opts]) => (
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
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-white/5 transition-all" style={{ fontFamily: "'Syne',sans-serif" }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
                            style={{ fontFamily: "'Syne',sans-serif" }}>
                        {saving ? "Saving…" : job?.id ? "Update Job" : "Create Job"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Job Row ──────────────────────────────────────────────────────────────────
function JobRow({ job, onEdit, onDelete, onViewApps }) {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try { await fetch(`${API}/admin/job/${job.id}`, { method: "DELETE", headers: authHeaders() }); }
        catch {}
        finally { setDeleting(false); onDelete(job.id); }
    };

    const sc = { OPEN: ["emerald"], CLOSED: ["rose"], PAUSED: ["amber"] }[job.jobStatus] || ["slate"];

    return (
        <tr className="border-b border-slate-800/60 hover:bg-white/2 transition-colors group">
            <td className="py-4 px-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-lg shrink-0">💼</div>
                    <div>
                        <div className="text-white font-bold text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>{job.title}</div>
                        <div className="text-slate-500 text-xs">{job.companyName || "—"}</div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 text-slate-400 text-sm">{job.location || "—"}</td>
            <td className="py-4 px-4">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full bg-${sc[0]}-500/10 text-${sc[0]}-400 border border-${sc[0]}-500/20`}>
          {job.jobStatus || "OPEN"}
        </span>
            </td>
            <td className="py-4 px-4 text-slate-400 text-sm">{job.salary ? `₹${job.salary}` : "—"}</td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewApps(job)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                        📋 Apps
                    </button>
                    <button onClick={() => onEdit(job)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                        ✏️ Edit
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                        {deleting ? "…" : "🗑️"}
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Applications Panel ───────────────────────────────────────────────────────
function ApplicationsPanel({ job, onClose }) {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch(`${API}/admin/Application/job/${job.id}`, { headers: authHeaders() });
                setApps(await res.json());
            } catch {
                setApps([
                    { id: 1, user: { name: "Subhash V.", email: "subhash@email.com" }, applicationStatus: "APPLIED", appliedAt: "2026-04-25" },
                    { id: 2, user: { name: "Arjun K.", email: "arjun@email.com" }, applicationStatus: "SHORTLISTED", appliedAt: "2026-04-26" },
                    { id: 3, user: { name: "Priya S.", email: "priya@email.com" }, applicationStatus: "HIRED", appliedAt: "2026-04-22" },
                ]);
            } finally { setLoading(false); }
        };
        fetchApps();
    }, [job.id]);

    const updateStatus = async (appId, status) => {
        setUpdating(appId);
        try {
            await fetch(`${API}/admin/Application/${appId}?status=${status}`, { method: "PUT", headers: authHeaders() });
            setApps(prev => prev.map(a => a.id === appId ? { ...a, applicationStatus: status } : a));
            setToast({ msg: `Status updated to ${status}`, type: "success" });
        } catch { setToast({ msg: "Failed to update", type: "error" }); }
        finally { setUpdating(null); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,8,15,0.85)", backdropFilter: "blur(14px)" }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            <div className="modal-in w-full max-w-2xl bg-gradient-to-br from-[#12142b] to-[#0e1022] border border-indigo-500/25 rounded-3xl p-7 shadow-[0_40px_100px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>📋 Applications</h2>
                        <p className="text-slate-500 text-sm mt-0.5">{job.title} · {apps.length} applicants</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-lg">×</button>
                </div>

                {loading ? (
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse" />)}</div>
                ) : apps.length === 0 ? (
                    <div className="text-center py-16"><div className="text-5xl mb-3">📭</div><p className="text-slate-400">No applications yet</p></div>
                ) : (
                    <div className="space-y-3">
                        {apps.map(app => {
                            const sc = STATUS_CFG[app.applicationStatus] || STATUS_CFG.APPLIED;
                            return (
                                <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-700/40 bg-white/2 hover:bg-white/4 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 flex items-center justify-center text-lg font-bold text-indigo-300" style={{ fontFamily: "'Syne',sans-serif" }}>
                                            {(app.user?.name || "U")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>{app.user?.name || "Applicant"}</div>
                                            <div className="text-slate-500 text-xs">{app.user?.email || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>
                      {sc.icon} {app.applicationStatus}
                    </span>
                                        <select
                                            value={app.applicationStatus}
                                            onChange={e => updateStatus(app.id, e.target.value)}
                                            disabled={updating === app.id}
                                            className="px-3 py-2 rounded-xl border border-slate-700/50 bg-[#0e1022] text-white text-xs outline-none focus:border-indigo-500/50 transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                            style={{ fontFamily: "'DM Sans',sans-serif" }}
                                        >
                                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
    return (
        <div className="au bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl p-5 backdrop-blur-xl" style={{ animationDelay: delay }}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>{icon}</div>
                <span className="text-slate-500 text-sm">{label}</span>
            </div>
            <div className="text-3xl font-black" style={{ fontFamily: "'Syne',sans-serif", color }}>{value}</div>
        </div>
    );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [tab, setTab] = useState("jobs"); // jobs | applications
    const [jobs, setJobs] = useState([]);
    const [allApps, setAllApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobModal, setJobModal] = useState(null); // null | {} | job
    const [appsPanel, setAppsPanel] = useState(null);
    const [toast, setToast] = useState(null);
    const [visible, setVisible] = useState(false);
    const [appSearch, setAppSearch] = useState("");

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [jRes] = await Promise.all([
                fetch(`${API}/admin/job/alljobs`, { headers: authHeaders() }),
            ]);
            setJobs(Array.isArray(await jRes.json()) ? await jRes.json() : demoJobs());
        } catch { setJobs(demoJobs()); }
        finally { setLoading(false); }
    };

    const demoJobs = () => [
        { id: 1, title: "Senior React Developer", companyName: "Google", location: "Hyderabad", jobStatus: "OPEN", salary: "28–40", jobType: "Full-time" },
        { id: 2, title: "Java Spring Boot Engineer", companyName: "Amazon", location: "Bangalore", jobStatus: "OPEN", salary: "22–35", jobType: "Full-time" },
        { id: 3, title: "Full Stack Developer", companyName: "TCS Digital", location: "Chennai", jobStatus: "CLOSED", salary: "18–28", jobType: "Full-time" },
        { id: 4, title: "DevOps Engineer", companyName: "Microsoft", location: "Remote", jobStatus: "OPEN", salary: "25–38", jobType: "Full-time" },
        { id: 5, title: "Data Engineer", companyName: "Flipkart", location: "Bangalore", jobStatus: "PAUSED", salary: "20–32", jobType: "Full-time" },
    ];

    const handleSave = (job, isNew) => {
        if (isNew) setJobs(prev => [job, ...prev]);
        else setJobs(prev => prev.map(j => j.id === job.id ? job : j));
        setToast({ msg: isNew ? "Job created!" : "Job updated!", type: "success" });
    };

    const handleDelete = (id) => {
        setJobs(prev => prev.filter(j => j.id !== id));
        setToast({ msg: "Job deleted", type: "success" });
    };

    const openJobs = jobs.filter(j => j.jobStatus === "OPEN").length;
    const closedJobs = jobs.filter(j => j.jobStatus !== "OPEN").length;

    return (
        <>
            <style>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modal-in { from{opacity:0;transform:scale(0.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toast-in { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes drift { 0%{transform:translate(0,0)} 33%{transform:translate(20px,-12px)} 66%{transform:translate(-12px,9px)} 100%{transform:translate(0,0)} }
        .au { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .modal-in { animation: modal-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .toast-in { animation: toast-in 0.4s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

            <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg,#07080f 0%,#0d0f1e 50%,#080a14 100%)", fontFamily: "'DM Sans',sans-serif" }}>
                {/* Orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position: "absolute", top: "5%", left: "5%", width: 450, height: 450, background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 13s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 380, height: 380, background: "radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 17s ease-in-out infinite reverse" }} />
                </div>

                {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
                {jobModal !== null && <JobModal job={jobModal?.id ? jobModal : null} onClose={() => setJobModal(null)} onSave={handleSave} />}
                {appsPanel && <ApplicationsPanel job={appsPanel} onClose={() => setAppsPanel(null)} />}

                <div className="relative max-w-7xl mx-auto px-6 py-12" style={{ zIndex: 10 }}>

                    {/* Header */}
                    <div className={`flex items-center justify-between mb-10 ${visible ? "au" : "opacity-0"}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.4)]">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>Admin Panel</h1>
                                <p className="text-slate-500 text-sm">Manage jobs and applications</p>
                            </div>
                        </div>
                        <button onClick={() => setJobModal({})}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 hover:scale-105"
                                style={{ fontFamily: "'Syne',sans-serif" }}>
                            <span className="text-lg">+</span> Post New Job
                        </button>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatCard icon="💼" label="Total Jobs" value={jobs.length} color="#6366f1" delay="0.08s" />
                        <StatCard icon="🟢" label="Open Jobs" value={openJobs} color="#10b981" delay="0.15s" />
                        <StatCard icon="🔴" label="Closed / Paused" value={closedJobs} color="#ef4444" delay="0.22s" />
                        <StatCard icon="📋" label="Applications" value="—" color="#f59e0b" delay="0.29s" />
                    </div>

                    {/* Tab switcher */}
                    <div className={`flex gap-2 mb-6 au`} style={{ animationDelay: "0.2s" }}>
                        {[["jobs", "💼 Jobs"], ["applications", "📋 All Applications"]].map(([key, label]) => (
                            <button key={key} onClick={() => setTab(key)}
                                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${tab === key ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600"}`}
                                    style={{ fontFamily: "'Syne',sans-serif" }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── JOBS TAB ── */}
                    {tab === "jobs" && (
                        <div className={`au bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl backdrop-blur-xl overflow-hidden`} style={{ animationDelay: "0.25s" }}>
                            {loading ? (
                                <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/3 animate-pulse" />)}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="border-b border-slate-800/80">
                                            {["Job", "Location", "Status", "Salary", "Actions"].map(h => (
                                                <th key={h} className="py-4 px-5 text-left text-slate-500 text-xs font-bold uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {jobs.map(job => (
                                            <JobRow key={job.id} job={job} onEdit={j => setJobModal(j)} onDelete={handleDelete} onViewApps={j => setAppsPanel(j)} />
                                        ))}
                                        </tbody>
                                    </table>
                                    {jobs.length === 0 && (
                                        <div className="text-center py-20">
                                            <div className="text-5xl mb-3">📭</div>
                                            <p className="text-slate-400">No jobs posted yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ALL APPLICATIONS TAB ── */}
                    {tab === "applications" && (
                        <div className="au" style={{ animationDelay: "0.25s" }}>
                            <div className="flex items-center gap-4 mb-5">
                                <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-slate-700/50 bg-white/3 backdrop-blur-md focus-within:border-indigo-500/50 transition-all">
                                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input value={appSearch} onChange={e => setAppSearch(e.target.value)} placeholder="Search by name or job title…"
                                           className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl backdrop-blur-xl overflow-hidden">
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    <div className="text-4xl mb-3">💡</div>
                                    <p className="font-medium text-slate-400 mb-1">Select a job from the Jobs tab</p>
                                    <p>Click the <span className="text-indigo-400 font-semibold">📋 Apps</span> button on any job row to view and update its applicants.</p>
                                    <p className="mt-3 text-xs text-slate-600">Or connect to <code className="text-indigo-400">/admin/Application/getAllApplication</code> for a global view.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}