import React, { useEffect, useState } from 'react';

export default function AboutUs() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
    }, []);

    const companies = [
        { name: "Google", sector: "Technology", icon: "🌐" },
        { name: "Microsoft", sector: "Software", icon: "💻" },
        { name: "Amazon", sector: "E-Commerce", icon: "📦" },
        { name: "TCS Digital", sector: "IT Services", icon: "⚡" },
        { name: "LTIMindtree", sector: "Consulting", icon: "🏢" },
        { name: "Flipkart", sector: "Retail", icon: "🛍️" }
    ];

    return (
        <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg,#07080f 0%,#0d0f1e 50%,#080a14 100%)", fontFamily: "'DM Sans',sans-serif" }}>
            <div className="relative max-w-6xl mx-auto px-6 py-24" style={{ zIndex: 10 }}>

                <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                    <h1 className="text-5xl font-black text-white mb-6" style={{ fontFamily: "'Syne',sans-serif" }}>
                        Redefining the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Future of Work</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
                        RiseFlow is a premium career matchmaking platform designed to bridge the gap between world-class talent and industry-leading enterprises. We believe finding your dream job should be a seamless, empowering experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        { title: "Our Mission", icon: "🚀", text: "To empower professionals to discover opportunities that align with their skills and passions." },
                        { title: "Our Vision", icon: "👁️", text: "To create a global ecosystem where talent and innovation meet effortlessly without barriers." },
                        { title: "Our Values", icon: "💎", text: "Transparency, continuous growth, and prioritizing the candidate experience above all else." }
                    ].map((card, i) => (
                        <div key={i} className={`bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl p-8 backdrop-blur-xl transition-all duration-700 delay-${i * 100} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                            <div className="text-4xl mb-4">{card.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>{card.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{card.text}</p>
                        </div>
                    ))}
                </div>

                <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}>
                    <h2 className="text-3xl font-black text-center text-white mb-10" style={{ fontFamily: "'Syne',sans-serif" }}>Trusted by Industry Leaders</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {companies.map((company, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-6 bg-white/5 border border-slate-700/50 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer">
                                <span className="text-3xl mb-3">{company.icon}</span>
                                <span className="text-white font-bold text-sm text-center" style={{ fontFamily: "'Syne',sans-serif" }}>{company.name}</span>
                                <span className="text-slate-500 text-xs mt-1">{company.sector}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}