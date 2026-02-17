import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Cookie } from "lucide-react";

export const metadata = {
    title: "Privacy Policy",
    description: "Learn how Youplex handles your data with our privacy-first approach.",
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-300 pb-20">
            {/* HEADER */}
            <nav className="max-w-4xl mx-auto px-6 py-8">
                <Link href="/" className="flex items-center gap-2 text-sm font-bold text-brand-primary hover:gap-3 transition-all">
                    <ArrowLeft size={16} /> BACK TO HOME
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-4 tracking-tighter">
                        Privacy <span className="text-brand-primary text-transparent bg-clip-text bg-brand-gradient">Policy</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Last Updated: February 17, 2026</p>
                </div>

                <div className="space-y-12">
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-surface rounded-lg text-brand-primary"><ShieldCheck size={24}/></div>
                            <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Our Philosophy</h2>
                        </div>
                        <p className="leading-relaxed">
                            At Youplex, we believe privacy is a fundamental right. Unlike other downloaders, we don&#39;t track your downloads, store your URLs, or build profiles on your interests. Our business model is based on utility, not data harvesting.
                        </p>
                    </section>

                    <section className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800">
                            <Lock className="mb-4 text-brand-primary" />
                            <h3 className="font-black mb-2 text-black dark:text-white uppercase text-sm tracking-widest">No Data Storage</h3>
                            <p className="text-sm">We do not store the media you download or the URLs you provide on our servers. Processing happens in volatile memory and is purged immediately after the stream ends.</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800">
                            <EyeOff className="mb-4 text-brand-primary" />
                            <h3 className="font-black mb-2 text-black dark:text-white uppercase text-sm tracking-widest">No Logs</h3>
                            <p className="text-sm">Our API logs are anonymized. We track &#34;how many&#34; downloads occur for scaling purposes, but never &#34;what&#34; was downloaded or &#34;who&#34; downloaded it.</p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-surface rounded-lg text-brand-primary"><Cookie size={24}/></div>
                            <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Cookies & Local Storage</h2>
                        </div>
                        <p className="leading-relaxed mb-4">
                            We use <strong>Local Storage</strong> solely to provide the &ldquo;History&#34; feature. This data stays on your device and is never sent to our servers. You can clear this at any time using the &#34;Clear History&#34; button on the home page.
                        </p>
                        <p className="text-sm italic">Note: Third-party analytics (like Google Analytics) may be used to improve site performance, but they do not receive your download data.</p>
                    </section>

                    <section className="p-8 bg-brand-gradient rounded-[2.5rem] text-white">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Compliance</h2>
                        <p className="opacity-90 leading-relaxed mb-6 font-medium">
                            By using Youplex, you agree that you will not use this service for copyright infringement. Youplex is designed to download content that you own or have the legal right to access.
                        </p>
                        <a href="mailto:support@youplex.cc" className="inline-block bg-white text-brand-primary px-6 py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform">
                            CONTACT PRIVACY OFFICER
                        </a>
                    </section>
                </div>
            </main>
        </div>
    );
}