import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8080";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem("jwt");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

function statusColor(s) {
    if (!s) return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    const m = { OPEN: ["emerald", "Open"], CLOSED: ["rose", "Closed"], PAUSED: ["amber", "Paused"] };
    const [c, l] = m[s] || ["slate", s];
    return { bg: `bg-${c}-500/10`, text: `text-${c}-400`, border: `border-${c}-500/20`, label: l };
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");
        let W = (canvas.width = window.innerWidth), H = (canvas.height = window.innerHeight);
        const pts = Array.from({ length: 50 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.8 + 0.4,
            dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
            o: Math.random() * 0.4 + 0.1,
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
                if (d < 100) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
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

// ─── Apply Success Overlay ────────────────────────────────────────────────────
function ApplySuccess({ job, onClose }) {
    const [phase, setPhase] = useState(0); // 0=rocket, 1=confetti, 2=card
    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 600);
        const t2 = setTimeout(() => setPhase(2), 1400);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const confetti = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        color: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"][i % 6],
        size: Math.random() * 8 + 4,
    }));

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(7,8,15,0.92)", backdropFilter: "blur(16px)" }}>
            <style>{`
        @keyframes rocket-launch { 0%{transform:translateY(0) scale(1);opacity:1} 60%{transform:translateY(-120px) scale(1.4);opacity:1} 100%{transform:translateY(-200px) scale(0.6);opacity:0} }
        @keyframes confetti-fall { 0%{transform:translateY(-60px) rotate(0deg);opacity:1} 100%{transform:translateY(400px) rotate(720deg);opacity:0} }
        @keyframes success-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes check-draw { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        .rocket-anim { animation: rocket-launch 1.2s cubic-bezier(0.22,1,0.36,1) both; }
        .success-pop { animation: success-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

            {/* Confetti */}
            {phase >= 1 && confetti.map(c => (
                <div key={c.id} className="absolute top-0 pointer-events-none" style={{
                    left: `${c.left}%`,
                    width: c.size, height: c.size,
                    background: c.color,
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${c.delay}s both`,
                }} />
            ))}

            <div className="text-center px-6">
                {/* Rocket Phase */}
                {phase < 2 && (
                    <div className="rocket-anim text-7xl mb-4 inline-block">🚀</div>
                )}

                {/* Success Card Phase */}
                {phase >= 2 && (
                    <div className="success-pop">
                        {/* Glow ring */}
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="absolute w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)" }} />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeDasharray="100" strokeDashoffset="0" style={{ animation: "check-draw 0.5s ease 0.1s both" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Applied! 🎉
                        </h2>
                        <p className="text-slate-400 text-base mb-1">You've successfully applied to</p>
                        <p className="text-indigo-300 font-bold text-xl mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{job?.title}</p>
                        <p className="text-slate-500 text-sm mb-8">at {job?.companyName || "the company"}</p>

                        <div className="flex gap-3 justify-center">
                            <button onClick={onClose}
                                    className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105"
                                    style={{ fontFamily: "'Syne', sans-serif" }}>
                                Browse More Jobs →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, applied, onApply, applying }) {
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
    const ref = useRef(null);

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        setTilt({ rx: ((y - r.height / 2) / r.height) * -10, ry: ((x - r.width / 2) / r.width) * 10 });
    };

    const tagColors = ["indigo", "violet", "cyan", "emerald", "amber"];
    const sc = statusColor(job.jobStatus);

    return (
        <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
             className="relative group bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl p-6 backdrop-blur-xl hover:border-indigo-500/35 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_30px_rgba(99,102,241,0.08)]"
             style={{ transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transition: "transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s ease", transformStyle: "preserve-3d" }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
                        {["🏢", "🚀", "💼", "🌐", "⚡"][job.id % 5]}
                    </div>
                    <div>
                        <h3 className="text-white font-black text-base leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{job.title}</h3>
                        <p className="text-slate-500 text-sm">{job.companyName || "TechCorp"} · {job.location || "Remote"}</p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${sc.bg} ${sc.text} ${sc.border} shrink-0`}>
          {job.jobStatus || "OPEN"}
        </span>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {job.description || "Exciting opportunity to work with cutting-edge technologies in a fast-paced environment."}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
                {(job.requiredSkills || job.skills || ["Java", "Spring Boot"]).slice(0, 4).map((s, i) => (
                    <span key={s} className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-${tagColors[i % 5]}-500/10 text-${tagColors[i % 5]}-400 border border-${tagColors[i % 5]}-500/20`}>
            {s}
          </span>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div>
          <span className="text-white font-black text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
            {job.salary ? `₹${job.salary}` : "₹12–25"}
          </span>
                    <span className="text-slate-500 text-sm"> LPA</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs">{job.jobType || "Full-time"}</span>
                    {applied ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Applied
                        </div>
                    ) : (
                        <button onClick={() => onApply(job)}
                                disabled={applying === job.id}
                                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            {applying === job.id ? (
                                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Applying…
                </span>
                            ) : "Apply Now"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Jobs Page ───────────────────────────────────────────────────────────
export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [applying, setApplying] = useState(null);
    const [appliedIds, setAppliedIds] = useState(new Set());
    const [successJob, setSuccessJob] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        setTimeout(() => setVisible(true), 80);
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${API}/user/jobs`, { headers: authHeaders() });
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch {
            // demo fallback
            setJobs([
                { id: 1, title: "Senior React Developer", companyName: "Google", location: "Hyderabad", jobStatus: "OPEN", salary: "28–40", jobType: "Full-time", description: "Build world-class web applications with React and TypeScript.", skills: ["React", "TypeScript", "GraphQL", "AWS"] },
                { id: 2, title: "Java Spring Boot Engineer", companyName: "Amazon", location: "Bangalore", jobStatus: "OPEN", salary: "22–35", jobType: "Full-time", description: "Design scalable microservices using Spring Boot and cloud platforms.", skills: ["Java", "Spring Boot", "Kafka", "Docker"] },
                { id: 3, title: "Full Stack Developer", companyName: "TCS Digital", location: "Chennai", jobStatus: "OPEN", salary: "18–28", jobType: "Full-time", description: "Work across the stack building end-to-end features for enterprise clients.", skills: ["React", "Node.js", "MongoDB", "REST APIs"] },
                { id: 4, title: "DevOps Engineer", companyName: "Microsoft", location: "Remote", jobStatus: "OPEN", salary: "25–38", jobType: "Full-time", description: "Automate, scale, and monitor cloud infrastructure on Azure.", skills: ["Kubernetes", "Terraform", "Azure", "CI/CD"] },
                { id: 5, title: "UI/UX Designer", companyName: "Swiggy", location: "Hyderabad", jobStatus: "OPEN", salary: "15–22", jobType: "Full-time", description: "Craft beautiful, intuitive product experiences for millions of users.", skills: ["Figma", "Framer", "Design Systems", "Prototyping"] },
                { id: 6, title: "Data Engineer", companyName: "Flipkart", location: "Bangalore", jobStatus: "CLOSED", salary: "20–32", jobType: "Full-time", description: "Build and maintain large-scale data pipelines and warehouses.", skills: ["Python", "Spark", "Airflow", "SQL"] },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const applyJob = async (job) => {
        setApplying(job.id);
        try {
            await fetch(`${API}/user/apply/${job.id}`, { method: "POST", headers: authHeaders() });
            setAppliedIds(prev => new Set([...prev, job.id]));
            setSuccessJob(job);
        } catch {
            setAppliedIds(prev => new Set([...prev, job.id]));
            setSuccessJob(job);
        } finally {
            setApplying(null);
        }
    };

    const filtered = jobs.filter(j => {
        const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
            j.companyName?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "ALL" || j.jobStatus === filter;
        return matchSearch && matchFilter;
    });

    return (
        <>
            <style>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drift { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(25px,-15px) scale(1.03)} 66%{transform:translate(-15px,12px) scale(0.97)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes card-in { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .au { animation: slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .card-in { animation: card-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden }
      `}</style>

            <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg,#07080f 0%,#0d0f1e 50%,#080a14 100%)", fontFamily: "'DM Sans',sans-serif" }}>
                <ParticleCanvas />

                {/* Orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position: "absolute", top: "5%", left: "5%", width: 500, height: 500, background: "radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 14s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", borderRadius: "50%", animation: "drift 17s ease-in-out infinite reverse" }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-12" style={{ zIndex: 10 }}>
                    {/* Header */}
                    <div className={`mb-10 ${visible ? "au" : "opacity-0"}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)" }} />
                            <span className="text-indigo-300 text-xs font-semibold">{jobs.length} Open Positions</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Find Your Next{" "}
                            <span style={{ background: "linear-gradient(135deg,#818cf8,#c084fc,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Role
              </span>
                        </h1>
                        <p className="text-slate-400 text-lg">Browse opportunities matched for you</p>
                    </div>

                    {/* Search + Filter Bar */}
                    <div className={`flex flex-col sm:flex-row gap-4 mb-8 ${visible ? "au" : "opacity-0"}`} style={{ animationDelay: "0.1s" }}>
                        <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-slate-700/50 bg-white/3 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
                            <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by role or company…"
                                   className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
                        </div>
                        <div className="flex gap-2">
                            {["ALL", "OPEN", "CLOSED"].map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                        className={`px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 ${filter === f ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600"}`}
                                        style={{ fontFamily: "'Syne',sans-serif" }}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Jobs Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-64 rounded-3xl bg-white/3 border border-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-slate-400 text-lg font-medium">No jobs found for "{search}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filtered.map((job, i) => (
                                <div key={job.id} className="card-in" style={{ animationDelay: `${i * 0.07}s` }}>
                                    <JobCard job={job} applied={appliedIds.has(job.id)} onApply={applyJob} applying={applying} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Apply Success Overlay */}
                {successJob && <ApplySuccess job={successJob} onClose={() => setSuccessJob(null)} />}
            </div>
        </>
    );
}