import React, { useEffect, useState } from 'react';

export default function ContactUs() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
    }, []);

    return (
        <div className="min-h-screen relative flex items-center justify-center" style={{ background: "linear-gradient(135deg,#07080f 0%,#0d0f1e 50%,#080a14 100%)", fontFamily: "'DM Sans',sans-serif" }}>

            {/* Ambient Background Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div style={{ position: "absolute", top: "10%", left: "10%", width: 500, height: 500, background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", borderRadius: "50%" }} />
            </div>

            <div className={`relative w-full max-w-5xl mx-auto px-6 py-24 z-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: "'Syne',sans-serif" }}>
                        Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Touch</span>
                    </h1>
                    <p className="text-slate-400 text-lg">Have a question or need support? We're here to help.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {[
                            { icon: "📍", title: "Office", text: "Hyderabad, India" },
                            { icon: "✉️", title: "Email", text: "support@riseflow.com" },
                            { icon: "📞", title: "Phone", text: "+91 98765 43210" }
                        ].map((info, i) => (
                            <div key={i} className="bg-gradient-to-br from-[#12142b]/90 to-[#0e1022]/90 border border-indigo-500/15 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
                                    {info.icon}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>{info.title}</h3>
                                    <p className="text-slate-400 text-sm">{info.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Google Form Placeholder */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#12142b]/95 to-[#0e1022]/95 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                        <div className="w-full h-[500px] bg-[#07080f]/50 border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 border-dashed">
                            <span className="text-4xl mb-4">📋</span>
                            <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>Google Form Embed Area</h3>
                            <p className="text-slate-500 text-sm max-w-md">
                                Replace this entire div container with your Google Form iframe code when you are ready. The dark background will perfectly frame your form.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}