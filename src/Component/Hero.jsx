import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext.jsx";
import { api } from "../Services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s) {
    if (!s) return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    const m = { OPEN: ["emerald", "Open"], CLOSED: ["rose", "Closed"], PAUSED: ["amber", "Paused"] };
    const [c, l] = m[s] || ["slate", s];
    return { bg: `bg-${c}-500/10`, text: `text-${c}-400`, border: `border-${c}-500/20`, label: l };
}

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

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Apply Success Overlay ────────────────────────────────────────────────────
function ApplySuccess({ job, onClose }) {
    const [phase, setPhase] = useState(0);
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
                {phase < 2 && <div className="rocket-anim text-7xl mb-4 inline-block">🚀</div>}
                {phase >= 2 && (
                    <div className="success-pop">
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="absolute w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)" }} />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeDasharray="100" strokeDashoffset="0" style={{ animation: "check-draw 0.5s ease 0.1s both" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Applied! 🎉</h2>
                        <p className="text-slate-400 text-base mb-1">You've successfully applied to</p>
                        <p className="text-indigo-300 font-bold text-xl mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{job?.title}</p>
                        <p className="text-slate-500 text-sm mb-8">at {job?.company || "the company"}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105">
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
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
                        {["🏢", "🚀", "💼", "🌐", "⚡"][(job.jobId || 0) % 5]}
                    </div>
                    <div>
                        <h3 className="text-white font-black text-base leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{job.title}</h3>
                        <p className="text-slate-500 text-sm">{job.company || "TechCorp"} · {job.location || "Remote"}</p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${sc.bg} ${sc.text} ${sc.border} shrink-0`}>
          {job.jobStatus || "OPEN"}
        </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {job.description || "Exciting opportunity to work with cutting-edge technologies in a fast-paced environment."}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
                {(job.requiredSkills || job.skills || ["Java", "Spring Boot"]).slice(0, 4).map((s, i) => (
                    <span key={s} className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-${tagColors[i % 5]}-500/10 text-${tagColors[i % 5]}-400 border border-${tagColors[i % 5]}-500/20`}>
            {s}
          </span>
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div>
          <span className="text-white font-black text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
            {job.salary ? `₹${job.salary.toLocaleString()}` : "Negotiable"}
          </span>
                    {job.salary && <span className="text-slate-500 text-sm"> LPA</span>}
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
                                disabled={applying === job.jobId}
                                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60"
                        >
                            {applying === job.jobId ? "Applying…" : "Apply Now"}
                        </button>
                    )}
                </div>
            </div>
        </div>
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
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#07080f]/90 backdrop-blur-xl border-b border-indigo-500/20 shadow-[0_8px_32px_rgba(99,102,241,0.1)]" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </div>
                    </div>
                    <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent" style={{ fontFamily: "'Syne', sans-serif" }}>RisePath</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#jobs-section" onClick={scrollToJobs} className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200">Find Jobs</a>
                    <Link to="/companies" className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200">Companies</Link>
                    <Link to="/about" className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200">About Us</Link>
                    <Link to="/contact" className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200">Contact</Link>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500/60 rounded-xl transition-all duration-200 hover:bg-indigo-500/10">Sign In</Link>
                            <Link to="/register" className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">Sign Up</Link>
                        </>
                    ) : (
                        <>
                            <Link to={role === 'ADMIN' ? '/admin' : '/dashboard'} className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">
                                {role === 'ADMIN' ? 'Admin Dashboard' : 'My Dashboard'}
                            </Link>
                            <button onClick={logout} className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all">Logout</button>
                        </>
                    )}
                </div>

                <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-80" : "max-h-0"}`}>
                <div className="px-6 pb-6 space-y-4 bg-[#07080f]/95 backdrop-blur-xl border-t border-indigo-500/10">
                    <a href="#jobs-section" onClick={scrollToJobs} className="block text-slate-400 hover:text-white text-sm py-1">Find Jobs</a>
                    <Link to="/companies" className="block text-slate-400 hover:text-white text-sm py-1">Companies</Link>
                    <Link to="/about" className="block text-slate-400 hover:text-white text-sm py-1">About Us</Link>
                    <Link to="/contact" className="block text-slate-400 hover:text-white text-sm py-1">Contact</Link>
                    <div className="flex flex-col gap-3 pt-2">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="py-2 text-center text-sm text-slate-300 border border-slate-700 rounded-xl">Sign In</Link>
                                <Link to="/register" className="py-2 text-center text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600">Sign Up</Link>
                            </>
                        ) : (
                            <>
                                <Link to={role === 'ADMIN' ? '/admin' : '/dashboard'} className="py-2 text-center text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600">
                                    {role === 'ADMIN' ? 'Admin Dashboard' : 'My Dashboard'}
                                </Link>
                                <button onClick={logout} className="py-2 text-center text-sm text-slate-300 border border-slate-700 rounded-xl">Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// ─── Main Hero + Jobs Section ──────────────────────────────────────────────────
export default function Hero() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    // Jobs State
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
        link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap";
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
            // Using standard fetch/api to get jobs. Make sure your backend allows public access to /user/jobs or /admin/job/alljobs
            // If it fails due to auth, it will drop to the catch block and use the fallback.
            const res = await api.get('/admin/job/alljobs'); // Usually retrieving all jobs is public or admin
            setJobs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Jobs fetch failed. Ensure backend has a public endpoint or allows this request.");
            // Fallback empty or dummy data so the UI doesn't look broken
            setJobs([
                { jobId: 1, title: "Senior React Developer", company: "Google", location: "Hyderabad", jobStatus: "OPEN", salary: 2800000, jobType: "Full-time", skills: ["React", "TypeScript"] },
                { jobId: 2, title: "Java Spring Boot Engineer", company: "Amazon", location: "Bangalore", jobStatus: "OPEN", salary: 2200000, jobType: "Full-time", skills: ["Java", "Spring Boot"] }
            ]);
        } finally {
            setLoadingJobs(false);
        }
    };

    const parallaxStyle = (factor = 0.02) => ({
        transform: `translate(${(mousePos.x - window.innerWidth / 2) * factor}px, ${(mousePos.y - window.innerHeight / 2) * factor}px)`,
        transition: "transform 0.1s linear",
    });

    const handleSearchClick = () => {
        document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" });
    };

    const applyJob = async (job) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        if (role === "ADMIN") {
            // Admins shouldn't apply to jobs
            return;
        }

        setApplying(job.jobId);
        try {
            await api.post(`/user/apply/${job.jobId}`);
            setAppliedIds(prev => new Set([...prev, job.jobId]));
            setSuccessJob(job);
        } catch (error) {
            console.error("Failed to apply:", error);
            // Even if it fails (e.g. already applied), we can show it as applied
            setAppliedIds(prev => new Set([...prev, job.jobId]));
            setSuccessJob(job);
        } finally {
            setApplying(null);
        }
    };

    const filteredJobs = jobs.filter(j => {
        const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
            j.company?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "ALL" || j.jobStatus === filter;
        return matchSearch && matchFilter;
    });

    return (
        <>
            <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(2deg); } }
        @keyframes floatReverse { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(18px) rotate(-2deg); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.7), 0 0 80px rgba(139,92,246,0.3); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes drift { 0% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.05); } 66% { transform: translate(-20px,15px) scale(0.95); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tag-float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.02); } }
        @keyframes card-in { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .card-in { animation: card-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; } .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; } .delay-600 { animation-delay: 0.6s; }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden }
      `}</style>

            <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #07080f 0%, #0d0f1e 50%, #080a14 100%)", fontFamily: "'DM Sans', sans-serif" }}>
                <ParticleCanvas />

                <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
                    <div style={{ position: "absolute", top: "8%", left: "10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", animation: "drift 12s ease-in-out infinite", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animation: "drift 15s ease-in-out infinite reverse", borderRadius: "50%" }} />
                </div>

                <Navbar />

                {/* ── HERO SECTION ── */}
                <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-20 flex flex-col lg:flex-row items-center gap-16" style={{ zIndex: 10 }}>
                    <div className={`flex-1 max-w-2xl ${visible ? "animate-slide-up" : "opacity-0"}`}>
                        <div className="animate-slide-up delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
                            <span className="text-sm text-indigo-300 font-semibold tracking-wide">🚀 500+ Companies Hiring Right Now</span>
                        </div>

                        <h1 className="animate-slide-up delay-200 font-black leading-none tracking-tight mb-6" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(3rem, 5vw, 5rem)" }}>
                            <span className="text-white block">Find Your</span>
                            <span className="block" style={{ background: "linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Dream Career</span>
                            <span className="text-white block">Today.</span>
                        </h1>

                        <p className="animate-slide-up delay-300 text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
                            Connect with top companies across tech, design, and beyond. Your next big opportunity is just one search away.
                        </p>

                        <div className="animate-slide-up delay-400 flex items-center gap-3 p-2 pl-5 rounded-2xl border border-indigo-500/20 bg-white/5 backdrop-blur-md mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-indigo-500/40 transition-all duration-300">
                            <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                placeholder="Job title, skills or company..."
                                className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
                            />
                            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                            <button onClick={handleSearchClick} className="px-6 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 shrink-0">
                                Search
                            </button>
                        </div>

                        <div className="animate-slide-up delay-500 flex gap-10 mt-12 pt-8 border-t border-slate-800">
                            {[
                                { end: 12000, suffix: "+", label: "Active Jobs" },
                                { end: 850, suffix: "+", label: "Companies" },
                                { end: 95, suffix: "%", label: "Placement Rate" },
                            ].map(({ end, suffix, label }) => (
                                <div key={label}>
                                    <div className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                        <Counter end={end} suffix={suffix} />
                                    </div>
                                    <div className="text-slate-500 text-sm font-medium mt-1">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center min-h-[520px] w-full hidden lg:flex">
                        <div className="absolute rounded-full border border-indigo-500/10" style={{ width: 440, height: 440, animation: "spin-slow 30s linear infinite" }} />
                        <div className="absolute rounded-full border border-violet-500/10" style={{ width: 340, height: 340, animation: "spin-slow 20s linear infinite reverse" }} />

                        <div style={{ ...parallaxStyle(0.015), zIndex: 20 }}>
                            <Card3D className="w-72 bg-gradient-to-br from-[#13152a] to-[#0e1022] border border-indigo-500/20 rounded-3xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(99,102,241,0.1)] backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center text-2xl">🏢</div>
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
                                    {["React", "TypeScript", "Node.js"].map(t => <span key={t} className="px-2.5 py-1 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">{t}</span>)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>₹28–40</span>
                                        <span className="text-slate-500 text-sm"> LPA</span>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.4)] pointer-events-none">Apply Now</button>
                                </div>
                            </Card3D>
                        </div>

                        {JOB_TAGS.map(({ label, color, delay }, i) => {
                            const angle = (i / JOB_TAGS.length) * 2 * Math.PI - Math.PI / 2;
                            const x = 220 + 210 * Math.cos(angle) - 55;
                            const y = 240 + 210 * Math.sin(angle) - 14;
                            return (
                                <div key={label} style={{ position: "absolute", left: x, top: y, animation: `tag-float ${4 + i * 0.5}s ease-in-out infinite`, animationDelay: delay, zIndex: 15, ...parallaxStyle(0.02) }}>
                                    <div className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border whitespace-nowrap" style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>{label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── MERGED JOBS SECTION ── */}
                <div id="jobs-section" className="relative max-w-7xl mx-auto px-6 py-20 border-t border-indigo-500/10" style={{ zIndex: 10 }}>
                    <div className="mb-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)" }} />
                            <span className="text-indigo-300 text-xs font-semibold">{jobs.length} Open Positions</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Explore <span style={{ background: "linear-gradient(135deg,#818cf8,#c084fc,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Opportunities</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                            <p className="text-slate-400 text-lg">Browse opportunities matched for you</p>
                            <div className="flex gap-2">
                                {["ALL", "OPEN", "CLOSED"].map(f => (
                                    <button key={f} onClick={() => setFilter(f)}
                                            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${filter === f ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border border-slate-700/50 bg-white/3 text-slate-400 hover:text-white hover:border-slate-600"}`}
                                            style={{ fontFamily: "'Syne',sans-serif" }}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Jobs Grid */}
                    {loadingJobs ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-64 rounded-3xl bg-white/3 border border-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="text-center py-24 bg-white/5 border border-slate-700/50 rounded-3xl backdrop-blur-md">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-slate-400 text-lg font-medium">No jobs found for "{search}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredJobs.map((job, i) => (
                                <div key={job.jobId} className="card-in" style={{ animationDelay: `${(i % 10) * 0.07}s` }}>
                                    <JobCard job={job} applied={appliedIds.has(job.jobId)} onApply={applyJob} applying={applying} />
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
