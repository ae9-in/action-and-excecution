'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Shield, ArrowRight, CheckCircle, FileText, Database,
  GitBranch, Target, Users, ClipboardList, Lock, Bell, Star,
  XCircle, Zap, ShieldAlert, Check
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── Interactive Flow Mockup for Bento Grid ───
function FlowMockup() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s === 3 ? 1 : ((s + 1) as 1 | 2 | 3)));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#131316] border border-white/5 rounded-2xl overflow-hidden">
      {/* Mock Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d0f] border-b border-white/5 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep(1)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${step === 1 ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            1. Businesses
          </button>
          <button
            onClick={() => setStep(2)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${step === 2 ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            2. Categories
          </button>
          <button
            onClick={() => setStep(3)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${step === 3 ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            3. Interactive View
          </button>
        </div>
      </div>

      {/* Render Steps */}
      <div className="flex-1 p-5 flex items-center justify-center min-h-[220px]">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 w-full animate-fade-up">
            {[
              { name: 'Acme Product Group', desc: 'Hardware & Devices' },
              { name: 'Acme Retail Unit', desc: 'Direct-to-consumer store' },
            ].map((b, idx) => (
              <div
                key={idx}
                className="p-4 border border-white/5 bg-[#17171c] rounded-xl text-left hover:border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center mb-3">
                  <Database className="w-4 h-4 text-indigo-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-200">{b.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-2 w-full animate-fade-up">
            {[
              { icon: FileText, label: 'SOPs', col: 'text-indigo-400' },
              { icon: GitBranch, label: 'Hierarchy', col: 'text-violet-400' },
              { icon: Users, label: 'SPOC', col: 'text-blue-400' },
              { icon: Target, label: 'Targets', col: 'text-amber-400' },
              { icon: Bell, label: 'Updates', col: 'text-rose-400' },
              { icon: Star, label: 'Features', col: 'text-green-400' },
            ].map((c, idx) => (
              <div
                key={idx}
                className="p-3 border border-white/5 bg-[#17171c] rounded-xl flex flex-col items-center justify-center text-center"
              >
                <c.icon className={`w-5 h-5 mb-1 ${c.col}`} />
                <span className="text-[10px] font-medium text-slate-400">{c.label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="w-full text-left bg-[#17171c] border border-white/5 rounded-xl p-4 animate-fade-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Email Draft: Pitch Followup</h4>
                <span className="text-[9px] text-slate-500">Tone: Friendly</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono">Mail Draft</span>
            </div>
            <div className="bg-[#0f0f12] rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Hi <span className="text-amber-400 font-semibold">&#123;&#123;name&#125;&#125;</span>,<br />
                Thanks for checking our <span className="text-amber-400 font-semibold">&#123;&#123;product&#125;&#125;</span> proposal. Let me know...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubheadRef = useRef<HTMLParagraphElement>(null);
  const heroCtaContainerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const problemContainerRef = useRef<HTMLDivElement>(null);

  // ─── Hero Word Stagger Animation ───
  useEffect(() => {
    const el = heroTitleRef.current;
    if (!el) return;
    const text = el.innerText;
    // Split by spaces but preserve line breaks
    const words = text.split(/\s+/);
    el.innerHTML = words
      .map(
        (w) =>
          `<span class="inline-block overflow-hidden mr-3 py-1"><span class="hero-word inline-block translate-y-[110%] opacity-0">${w}</span></span>`
      )
      .join('');

    gsap.to('.hero-word', {
      y: 0,
      opacity: 1,
      stagger: 0.05,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.1,
    });

    gsap.fromTo(
      heroSubheadRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.7, ease: 'power2.out' }
    );
    gsap.fromTo(
      heroCtaContainerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.9, ease: 'power2.out' }
    );
  }, []);

  // ─── Magnetic CTA Button Effect ───
  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Limit translates to 35% of offset
      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // ─── Pinned Problem Strip Pin & Cross-Fade ───
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: problemContainerRef.current,
          start: 'top top',
          end: '+=200%',
          scrub: true,
          pin: true,
        },
      });

      // Cross-fade timeline
      tl.to('.slide-1', { opacity: 0, y: -30, duration: 1 })
        .fromTo('.slide-2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, '-=0.5')
        .to('.slide-2', { opacity: 0, y: -30, duration: 1 })
        .fromTo('.slide-3', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, '-=0.5');
    }, problemContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative min-h-screen selection:bg-indigo-500/20 selection:text-white bg-[#0A0A0B] overflow-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex items-center px-6 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center w-full">
          {/* Hero Left Content (60%) */}
          <div className="lg:col-span-7 text-left space-y-8 relative z-10">
            {/* Header Accent Headline Glow */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

            <h1
              ref={heroTitleRef}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] font-display"
            >
              Every business, one command center.
            </h1>

            <p
              ref={heroSubheadRef}
              className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed"
            >
              Business Vault centralizes operations knowledge—SOPs, hierarchy, prices, updates, contacts, and bento records—in a secure, role-gated, and fully audited framework.
            </p>

            <div ref={heroCtaContainerRef} className="flex flex-wrap gap-4 items-center pt-2">
              <Link
                ref={ctaRef}
                href="/login"
                id="hero-cta"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40 text-sm cursor-pointer"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-4 bg-[#131316] hover:bg-[#18181c] border border-white/5 text-white/70 hover:text-white rounded-2xl text-sm font-medium transition-all"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Right Preview Frame (40%) */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Slow drifting radial gradient blob behind tilted preview mockup */}
            <div
              className="absolute w-[350px] h-[350px] rounded-full bg-indigo-600/15 blur-[90px] pointer-events-none"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'drift 12s infinite alternate ease-in-out',
              }}
            />
            
            {/* Custom keyframes injected via styled scope */}
            <style>{`
              @keyframes drift {
                0% { transform: translate(-50%, -50%) translate(-20px, -20px) scale(0.9); }
                50% { transform: translate(-50%, -50%) translate(30px, 30px) scale(1.1); }
                100% { transform: translate(-50%, -50%) translate(-10px, -15px) scale(0.95); }
              }
            `}</style>

            <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-2xl bg-[#131316] border border-white/8 p-5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out overflow-hidden">
              {/* Product Preview Cards Mockup */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">acme-corp.vault</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-400">AP</div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Acme Product Group</h4>
                      <p className="text-[9px] text-slate-500">Active · 18 categories</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-900/50 flex items-center justify-center text-xs font-bold text-violet-400">AR</div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Acme Retail Unit</h4>
                      <p className="text-[9px] text-slate-500">Active · 18 categories</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM STRIP (Horizontal Pinned Scroll) ─── */}
      <section
        ref={problemContainerRef}
        className="relative h-screen bg-[#0d0d0f] flex items-center overflow-hidden border-y border-white/5"
      >
        <div className="max-w-4xl mx-auto w-full px-6 relative h-[250px]">
          {/* Slide 1 */}
          <div className="slide-1 absolute inset-x-6 text-center space-y-6 flex flex-col items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500/60" />
            <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white font-display">
              Scattered SOPs and operation plans?
            </h3>
            <p className="text-base text-slate-400 max-w-lg leading-relaxed">
              Replace loose document sharing with structured, business-scoped category drawers.
            </p>
          </div>

          {/* Slide 2 */}
          <div className="slide-2 absolute inset-x-6 text-center space-y-6 flex flex-col items-center justify-center opacity-0 pointer-events-none">
            <ShieldAlert className="w-10 h-10 text-amber-500/60" />
            <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white font-display">
              No visibility into changes or mutations?
            </h3>
            <p className="text-base text-slate-400 max-w-lg leading-relaxed">
              Every edit, update, or deletion compiles an append-only before/after audit log.
            </p>
          </div>

          {/* Slide 3 */}
          <div className="slide-3 absolute inset-x-6 text-center space-y-6 flex flex-col items-center justify-center opacity-0 pointer-events-none">
            <Bell className="w-10 h-10 text-indigo-500/60" />
            <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white font-display">
              Stale prices and targets spreadsheets?
            </h3>
            <p className="text-base text-slate-400 max-w-lg leading-relaxed">
              Versioned data items rendering clean, sequential timeline records of your history.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BENTO GRID ─── */}
      <section id="features" className="px-6 py-24 lg:py-32 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">The Platform</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Purpose-built UI for all category schemas.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main interactive mockup card (8-cols) */}
          <div className="lg:col-span-8 p-6 bg-[#131316] border border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-200">Interactive Navigation Flow</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Click through businesses, filter by 18 custom categories, and render structured views instantly.
              </p>
            </div>
            <FlowMockup />
          </div>

          {/* Cloudinary media card (4-cols) */}
          <div className="lg:col-span-4 p-6 bg-[#131316] border border-white/5 rounded-2xl flex flex-col justify-between">
            <div>
              <Lock className="w-6 h-6 text-indigo-400 mb-4" />
              <h4 className="text-sm font-semibold text-slate-200">Cloudinary Signed Uploads</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload images, videos, and PDFs directly via secure client signatures. API secrets never touch the frontend.
              </p>
            </div>
            <div className="mt-6 p-4 border border-white/5 bg-[#17171c] rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Acme_SOP_v1.pdf</span>
              <span className="text-indigo-400 font-medium">Signed</span>
            </div>
          </div>

          {/* Audit Logs card (4-cols) */}
          <div className="lg:col-span-4 p-6 bg-[#131316] border border-white/5 rounded-2xl">
            <ClipboardList className="w-6 h-6 text-indigo-400 mb-4" />
            <h4 className="text-sm font-semibold text-slate-200">Before/After Audit Logging</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every operation tracks actor, IP, timestamp, and a JSON payload diff representing the change state.
            </p>
            <div className="mt-6 space-y-2">
              <div className="p-2.5 bg-[#17171c] border border-white/5 rounded-xl text-[10px] flex items-center justify-between font-mono">
                <span className="text-indigo-400">EDIT</span>
                <span className="text-slate-400">Price Record #104</span>
              </div>
              <div className="p-2.5 bg-[#17171c] border border-white/5 rounded-xl text-[10px] flex items-center justify-between font-mono">
                <span className="text-indigo-400">DELETE</span>
                <span className="text-slate-400">SOP File #208</span>
              </div>
            </div>
          </div>

          {/* Global Search card (4-cols) */}
          <div className="lg:col-span-4 p-6 bg-[#131316] border border-white/5 rounded-2xl flex flex-col justify-between">
            <div>
              <Database className="w-6 h-6 text-indigo-400 mb-4" />
              <h4 className="text-sm font-semibold text-slate-200">Global Search Palette</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A central command palette searching across categories, files, and structured CRM data, gated strictly by user business access.
              </p>
            </div>
            <div className="mt-6 p-2.5 bg-[#17171c] border border-white/5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">Type ⌘K to search...</span>
            </div>
          </div>

          {/* Org Chart / SPOC card (4-cols) */}
          <div className="lg:col-span-4 p-6 bg-[#131316] border border-white/5 rounded-2xl flex flex-col justify-between">
            <div>
              <GitBranch className="w-6 h-6 text-indigo-400 mb-4" />
              <h4 className="text-sm font-semibold text-slate-200">Visual Org Chart Tree</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Model organization hierarchies dynamically. Add nodes and click through reporting relationships.
              </p>
            </div>
            <div className="mt-6 p-4 border border-white/5 bg-[#17171c] rounded-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">JD</div>
              <div>
                <h5 className="text-[11px] font-semibold text-slate-200">Jane Doe</h5>
                <p className="text-[9px] text-slate-500">Managing Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROLE-ACCESS SECTION ─── */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Access Boundaries</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Role-Based Gated Permissions
          </h2>
        </div>

        <div className="relative">
          {/* Connecting gradient line behind cards */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-indigo-500/10 via-indigo-500/40 to-indigo-500/10 -translate-y-1/2 hidden md:block" />

          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {[
              {
                role: 'User',
                badge: 'Read & Upload',
                desc: 'Access assigned workspaces. View files, download materials, and create category database records.',
                perms: ['View assigned businesses', 'Upload files', 'Create records'],
              },
              {
                role: 'Admin',
                badge: 'Write & Edit',
                desc: 'Full read/write permissions for assigned workspaces. Authorized to update records and delete entries.',
                perms: ['View assigned businesses', 'Edit files & records', 'Audit-logged deletions'],
              },
              {
                role: 'Super Admin',
                badge: 'Full Ownership',
                desc: 'Unrestricted control across all workspaces. Manage administrator profiles and inspect comprehensive audit logs.',
                perms: ['Access all businesses', 'Access audit trails', 'Create admin accounts'],
              },
            ].map((r, i) => (
              <div
                key={i}
                className="group relative p-6 bg-[#131316] border border-white/5 rounded-2xl hover:border-[#6366F1]/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <h3 className="text-base font-bold text-slate-200">{r.role}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-medium">
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {r.desc}
                  </p>
                </div>
                <ul className="space-y-2">
                  {r.perms.map((p, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─── */}
      <section className="border-y border-white/5 py-10 bg-[#0d0d0f]">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-between items-center gap-6 text-xs text-slate-500">
          <div>IMPENDING AUDIT TRAIL</div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div>ROLE-BASED ACCESS</div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div>VERSIONED HISTORICAL TIMELINES</div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div>CLOUDINARY STORAGE</div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section className="px-6 py-28 relative">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Ready to vault your operations?
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Consolidate your businesses, team workspaces, and operational SOPs in one secure hub.
          </p>
          <div className="pt-4">
            <Link
              id="footer-cta"
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40 text-sm cursor-pointer"
            >
              Sign In to Command Center <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">Business Vault</span>
          </div>
          <p>© {new Date().getFullYear()} Acme Corp. Internal Command Center.</p>
        </div>
      </footer>
    </main>
  );
}
