"use client";

import { useState, useEffect } from "react";
import { Search, Download, Video, Music, Shield, Zap, Loader2, CheckCircle, X, MousePointerClick, Copy, Save, Clock, Trash2 } from "lucide-react";

interface DownloadItem {
    id: string;
    url: string;
    title: string;
    thumbnail?: string;
    type: "video" | "audio";
    date: string;
}

export default function Home() {
    const [url, setUrl] = useState("");
    const [mode, setMode] = useState<"video" | "audio">("video");
    const [status, setStatus] = useState<"idle" | "loading" | "streaming" | "success" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [activeThumbnail, setActiveThumbnail] = useState("");
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [recentDownloads, setRecentDownloads] = useState<DownloadItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("youplex_history");
        if (saved) setRecentDownloads(JSON.parse(saved));
    }, []);

    const handleDownload = async () => {
        if (!url) return;
        setStatus("loading");
        setProgress(0);
        setActiveThumbnail("");

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, type: mode }),
            });

            if (!response.ok || !response.body) throw new Error("Failed");

            const reader = response.body.getReader();
            const contentLength = Number(response.headers.get('Content-Length')) || 0;
            const realTitle = decodeURIComponent(response.headers.get("X-Video-Title") || "Media");
            const thumb = decodeURIComponent(response.headers.get("X-Video-Thumbnail") || "");

            setActiveThumbnail(thumb);
            // Switch to streaming mode once headers arrive
            setStatus("streaming");

            let receivedLength = 0;
            const chunks: Uint8Array[] = [];

            while(true) {
                const {done, value} = await reader.read();
                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                if (contentLength > 0) {
                    setProgress(Math.round((receivedLength / contentLength) * 100));
                }
            }

            const blob = new Blob(chunks, { type: mode === 'audio' ? 'audio/mpeg' : 'video/mp4' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `${realTitle}.${mode === "audio" ? "mp3" : "mp4"}`;
            link.click();

            const newItem = {
                id: Date.now().toString(),
                url, title: realTitle,
                thumbnail: thumb,
                type: mode,
                date: new Date().toLocaleDateString()
            };
            const updated = [newItem, ...recentDownloads].slice(0, 5);
            setRecentDownloads(updated);
            localStorage.setItem("youplex_history", JSON.stringify(updated));

            setStatus("success");
            setTimeout(() => { setStatus("idle"); setProgress(0); setActiveThumbnail(""); }, 5000);
            setUrl("");

        } catch (err) {
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 relative">
            {/* HOW IT WORKS MODAL */}
            {showHowItWorks && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl border border-slate-200 dark:border-zinc-800">
                        <button onClick={() => setShowHowItWorks(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-3xl font-black mb-6">How it <span className="text-brand-primary">Works</span></h2>
                        <div className="space-y-6">
                            <Step icon={<Copy />} title="Copy URL" desc="Copy the link of the video or audio from your favorite social platform." />
                            <Step icon={<MousePointerClick />} title="Paste & Select" desc="Paste the link into the search bar and choose Video or Audio mode." />
                            <Step icon={<Save />} title="Save Media" desc="Click 'Fetch Media' and wait a few seconds. Your download will start automatically." />
                        </div>
                        <button onClick={() => setShowHowItWorks(false)} className="w-full mt-8 bg-brand-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-primary/20">Got it, thanks!</button>
                    </div>
                </div>
            )}

            {/* NAVIGATION */}
            <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/20">Y</div>
                    <span className="text-xl font-black tracking-tighter">YOUPLEX</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium opacity-70">
                    <button onClick={() => setShowHowItWorks(true)} className="hover:text-brand-primary transition-colors font-bold text-sm">How it works</button>
                </div>
                <button className="px-5 py-2 rounded-full border border-brand-primary/20 text-brand-primary text-sm font-bold hover:bg-brand-surface transition-all">Support Us</button>
            </nav>

            {/* HERO & INPUT BOX */}
            <section className="px-4 pt-16 pb-12">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        Download Content <br />
                        <span className="text-transparent bg-clip-text bg-brand-gradient">Without Limits.</span>
                    </h1>

                    <div className="relative max-w-3xl mx-auto">
                        <div className="flex justify-center gap-2 mb-4">
                            <button onClick={() => setMode("video")} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === "video" ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500"}`}><Video size={14} /> VIDEO</button>
                            <button onClick={() => setMode("audio")} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === "audio" ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500"}`}><Music size={14} /> AUDIO</button>
                        </div>

                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 flex items-center px-4 gap-3">
                                    <Search className="text-slate-400 w-5 h-5" />
                                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={`Paste ${mode} link here...`} className="w-full py-4 bg-transparent outline-none text-lg" disabled={status === "loading" || status === "streaming"} />
                                </div>
                                <button onClick={handleDownload} disabled={status === "loading" || status === "streaming" || !url} className="bg-brand-gradient text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                                    {(status === "loading" || status === "streaming") ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                                    {status === "loading" ? "Processing..." : status === "streaming" ? "Downloading..." : "Fetch Media"}
                                </button>
                            </div>

                            {/* IMPROVED PROGRESS UI */}
                            {(status === "loading" || status === "streaming") && (
                                <div className="px-4 pb-4 mt-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                                    {activeThumbnail && <img src={activeThumbnail} className="w-20 h-12 rounded-lg object-cover shadow-md" alt="Preview" />}
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-widest text-slate-400">
                                            <span>{status === "loading" ? "Server Processing..." : "Streaming to Browser"}</span>
                                            <span>{status === "loading" ? "..." : `${progress}%`}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                                            {status === "loading" ? (
                                                <div className="absolute inset-0 bg-brand-gradient animate-pulse opacity-50" />
                                            ) : (
                                                <div className="h-full bg-brand-gradient transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* RECENT ACTIVITY (Locked Design) */}
            {recentDownloads.length > 0 && (
                <section className="max-w-3xl mx-auto px-6 mb-24 mt-16">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-black flex items-center gap-2"><Clock className="text-brand-primary" size={20}/> Recent Activity</h3>
                        <button onClick={() => { setRecentDownloads([]); localStorage.removeItem("youplex_history"); }} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"><Trash2 size={12}/> Clear History</button>
                    </div>
                    <div className="space-y-3">
                        {recentDownloads.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-2xl group hover:border-brand-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm overflow-hidden">
                                        {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" alt="" /> : <Video className="text-brand-primary" size={18}/>}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-sm truncate max-w-[200px] md:max-w-sm">{item.title}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{item.date}</p>
                                    </div>
                                </div>
                                <button onClick={() => setUrl(item.url)} className="opacity-0 group-hover:opacity-100 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:text-brand-primary transition-all">Re-download</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* FEATURES GRID */}
            <section className="bg-slate-50 dark:bg-zinc-950 py-24 px-6 mt-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard icon={<Video className="text-brand-primary" />} title="4K Video" desc="Download in stunning Ultra HD resolution." />
                    <FeatureCard icon={<Music className="text-brand-primary" />} title="MP3 Extraction" desc="Convert any video to high-quality 320kbps audio." />
                    <FeatureCard icon={<Zap className="text-brand-primary" />} title="Turbo Speed" desc="Next.js 16 optimized server processing." />
                    <FeatureCard icon={<Shield className="text-brand-primary" />} title="Safe & Private" desc="No tracking, no logs, just your media." />
                </div>
            </section>

            <footer className="py-12 text-center border-t border-slate-100 dark:border-zinc-800 text-sm text-slate-400">© 2026 Youplex Downloader.</footer>
        </div>
    );
}

function Step({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 bg-brand-surface text-brand-primary rounded-2xl flex items-center justify-center">{icon}</div>
            <div><h4 className="font-bold text-lg">{title}</h4><p className="text-slate-500 text-sm">{desc}</p></div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 hover:border-brand-primary/30 transition-all group">
            <div className="w-12 h-12 bg-brand-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-gradient group-hover:text-white transition-all">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
