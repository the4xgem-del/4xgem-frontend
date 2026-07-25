import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import TradingViewCalendar from "@/features/calendar/TradingViewCalendar";
import {
  Zap, History, Newspaper, CalendarDays, BookOpen, BarChart2,
  GraduationCap, CreditCard, Headphones, User, LogOut,
  Bell, ShieldCheck, Star, Menu, ArrowRight, Check,
  Eye, EyeOff, Mail, Lock, AlertTriangle, ChevronRight,
  Clock, Activity, Target, TrendingUp,
} from "lucide-react";
const LOGO = "/images/logo.png";
const PerformanceSection = lazy(() => import("@/features/analytics/PerformanceSection"));

import { useSignals } from "@/features/signals/useSignals";
import { MarketTicker } from "@/features/market/MarketTicker";
import { useNews } from "@/features/news/useNews";
import { useCalendar } from "@/features/calendar/useCalendar";
import { usePlans } from "@/features/plans/plansApi";
import { NotificationsBell } from "@/features/notifications/NotificationsBell";
import { useAdminUsers, useAdminSummary } from "@/features/admin/usersApi";
import { useEducation } from "@/features/education/educationApi";
import { billingApi } from "@/features/billing/billingApi";
import { useProfileSettings } from "@/features/settings/settingsApi";
import { TwoFactorSettings } from "@/features/auth/TwoFactorSettings";
import { useCreateSignal, useCreateNews, useCreateEvent } from "@/features/admin/contentApi";
import { GoogleSignInButton } from "@/features/auth/GoogleSignInButton";
import type { toUiSignal } from "@/features/signals/signalsApi";

type UiSignal = ReturnType<typeof toUiSignal>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function signalTypeStyle(type: string) {
  if (type === "BUY") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (type === "SELL") return "bg-red-100 text-red-600 border-red-200";
  if (type === "BUY LIMIT") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-orange-100 text-orange-700 border-orange-200";
}

function signalStatusBadge(status: string) {
  if (status === "Open") return "bg-slate-100 text-slate-600";
  if (status === "Running") return "bg-emerald-100 text-emerald-700";
  if (status.startsWith("Hit")) return "bg-amber-100 text-amber-700";
  if (status === "Stop Loss") return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-500";
}

function impactBadge(impact: string) {
  if (impact === "High") return "bg-red-100 text-red-600";
  if (impact === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ height = 64 }: { height?: number }) {
  return (
    <img
      src={LOGO}
      alt="4xGem"
      style={{
        height: `${height}px`,
        width: "auto",
      }}
      className="object-contain"
    />
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

type View = "landing" | "auth" | "dashboard";
type AuthView = "welcome" | "signin" | "signup";
type DashSection = "signals" | "history" | "news" | "calendar" | "journal" | "performance" | "education" | "subscription" | "support" | "profile" | "admin";

export default function App() {
  const { user, isLoading, logout } = useAuth();
  const [view, setView] = useState<View>("landing");
  const [authView, setAuthView] = useState<AuthView>("welcome");
  const [showTerms, setShowTerms] = useState(false);
  const [dashSection, setDashSection] = useState<DashSection>("signals");
  const [termsChecked, setTermsChecked] = useState([false, false, false]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // If a valid session cookie is already present (e.g. page refresh), skip
  // straight to the dashboard instead of showing the landing page again.
  useEffect(() => {
    if (!isLoading && user && view === "landing") {
      setView("dashboard");
    }
  }, [isLoading, user, view]);

  const handleAuthSuccess = () => {
    setView("dashboard");
    setShowTerms(true);
  };

  const handleLogout = async () => {
    await logout();
    setView("landing");
    setTermsChecked([false, false, false]);
  };

  const handleTermsAccept = () => {
    if (termsChecked.every(Boolean)) setShowTerms(false);
  };

  const handleTermsDecline = () => {
    setShowTerms(false);
    setView("landing");
    setTermsChecked([false, false, false]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LandingPage onGetStarted={() => { setAuthView("welcome"); setView("auth"); }} />
          </motion.div>
        )}
        {view === "auth" && (
          <motion.div key="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AuthScreen authView={authView} setAuthView={setAuthView} onAuthSuccess={handleAuthSuccess} onBack={() => setView("landing")} />
          </motion.div>
        )}
        {view === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex h-screen overflow-hidden">
            <Sidebar section={dashSection} setSection={setDashSection} open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} isAdmin={user?.role?.name === "ADMIN"} />
            <main className="flex-1 overflow-y-auto bg-[#F8FAFC] min-w-0">
              {dashSection === "signals" && <LiveSignals />}
              {dashSection === "performance" && (
                <Suspense fallback={<div className="p-6 lg:p-8"><div className="h-96 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" /></div>}>
                  <PerformanceSection />
                </Suspense>
              )}
              {dashSection === "news" && <MarketNewsSection />}
              {dashSection === "calendar" && <EconomicCalendarSection />}
              {dashSection === "education" && <EducationSection />}
              {dashSection === "subscription" && <SubscriptionSection />}
              {dashSection === "profile" && <ProfileSection />}
              {dashSection === "admin" && <AdminSection />}
              {!["signals", "performance", "news", "calendar", "education", "subscription", "profile", "admin"].includes(dashSection) && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                  <Activity className="w-12 h-12 opacity-20" />
                  <p className="text-lg font-medium">Coming Soon</p>
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerms && (
          <TermsModal checked={termsChecked} setChecked={setTermsChecked} onAccept={handleTermsAccept} onDecline={handleTermsDecline} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen">
      <LandingNav onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <StatsSection />
      <FeaturesSection />
      <SignalPreviewSection />
      <PricingPreview onGetStarted={onGetStarted} />
      <FooterSection />
    </div>
  );
}

function LandingNav({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/92 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
         
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
          {["Features", "Signals", "Pricing", "Education"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#111827] transition-colors">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onGetStarted} className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors px-3 py-1.5">Sign In</button>
          <button onClick={onGetStarted} className="text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const traders = useCounter(12847);
  const accuracy = useCounter(89);
  const signals = useCounter(127);

  const floatingGems = [
    { left: "8%", top: "22%", size: 64, delay: 0 },
    { left: "84%", top: "14%", size: 88, delay: 0.6 },
    { left: "78%", top: "68%", size: 52, delay: 1.1 },
    { left: "18%", top: "74%", size: 44, delay: 1.7 },
    { left: "52%", top: "8%", size: 36, delay: 0.9 },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-16 flex items-center">
      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-blue-100/70 to-purple-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-emerald-50/60 to-blue-50/30 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[400px] rounded-full bg-gradient-to-r from-purple-50/40 to-transparent blur-3xl" />
      </div>

      {/* Floating diamonds */}
      {floatingGems.map((gem, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: gem.left, top: gem.top }}
          animate={{ y: [0, -18, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 4.5 + i * 0.6, repeat: Infinity, delay: gem.delay, ease: "easeInOut" }}
        >
          <svg width={gem.size} height={gem.size} viewBox="0 0 60 60" fill="none" style={{ opacity: 0.1 }}>
            <defs>
              <linearGradient id={`fg${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#2563EB" /><stop offset="1" stopColor="#6D28D9" />
              </linearGradient>
            </defs>
            <polygon points="30,2 58,18 58,42 30,58 2,42 2,18" fill={`url(#fg${i})`} />
          </svg>
        </motion.div>
      ))}

      {/* Animated chart lines */}
      <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none">
        <svg viewBox="0 0 600 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <motion.path d="M0,400 Q100,320 200,300 T400,220 T600,140" stroke="#2563EB" strokeWidth="2" fill="none" opacity="0.08" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, ease: "easeInOut" }} />
          <motion.path d="M0,460 Q120,400 240,370 T480,280 T600,200" stroke="#6D28D9" strokeWidth="1.5" fill="none" opacity="0.06" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, ease: "easeInOut", delay: 0.5 }} />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-28 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Trading Signals Active
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-[#111827] leading-[1.1] tracking-tight mb-6">
            Professional Trading Signals That Help You{" "}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#6D28D9] bg-clip-text text-transparent">Trade Smarter</span>
          </h1>
          <p className="text-xl text-[#6B7280] leading-relaxed mb-8">
            Real-time Forex, Gold, Crypto, and Index trading signals with expert market analysis. Join 12,000+ traders worldwide.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <button onClick={onGetStarted} className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200/80 hover:shadow-xl hover:shadow-blue-300/60 hover:-translate-y-0.5">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onGetStarted} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#111827] font-semibold px-7 py-3.5 rounded-2xl border border-[#E5E7EB] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <Zap className="w-4 h-4 text-[#F5B301]" />
              View Live Signals
            </button>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            {[
              { label: "Active Traders", value: traders.toLocaleString() },
              { label: "Signal Accuracy", value: `${accuracy}%` },
              { label: "Signals Today", value: signals },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
                <div className="text-xs text-[#6B7280] font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Preview card */}
        <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="hidden lg:block relative">
          <div className="relative">
            <div className="absolute inset-0 translate-x-4 translate-y-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl opacity-50" />
            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl opacity-70" />
            <div className="relative bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs text-[#6B7280] font-medium uppercase tracking-wider mb-1">Gold / USD</div>
                  <div className="text-2xl font-bold text-[#111827] font-mono">XAUUSD</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">BUY</span>
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{ label: "Entry", value: "2,345.50", bg: "bg-[#F8FAFC]" }, { label: "Stop Loss", value: "2,318.00", bg: "bg-red-50" }, { label: "Take Profit 1", value: "2,368.00", bg: "bg-emerald-50" }, { label: "Take Profit 2", value: "2,385.00", bg: "bg-emerald-50/70" }].map(p => (
                  <div key={p.label} className={`${p.bg} rounded-xl p-3`}>
                    <div className="text-xs text-[#6B7280] mb-1">{p.label}</div>
                    <div className="font-semibold text-[#111827] text-sm font-mono">{p.value}</div>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#6B7280] font-medium">Confidence Level</span>
                  <span className="text-[#111827] font-bold">87%</span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-[#2563EB] to-[#6D28D9] rounded-full" initial={{ width: 0 }} animate={{ width: "87%" }} transition={{ duration: 1.5, delay: 1 }} />
                </div>
              </div>
              <div className="flex items-center justify-between bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
                <div>
                  <div className="text-xs text-[#6B7280] font-medium">Floating Profit</div>
                  <div className="text-xl font-bold text-emerald-600 font-mono">+$127.50</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6B7280] font-medium">Live Pips</div>
                  <div className="text-xl font-bold text-emerald-600 font-mono">+45</div>
                </div>
              </div>
            </div>
          </div>
          <motion.div className="absolute -top-8 -right-6 bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg" animate={{ y: [0, -10, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
            <div className="text-xs text-[#6B7280] font-medium">Monthly Pips</div>
            <div className="text-xl font-bold text-[#111827]">4,280</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">↑ +12% this month</div>
          </motion.div>
          <motion.div className="absolute -bottom-4 -left-6 bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg" animate={{ y: [0, 10, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
            <div className="text-xs text-[#6B7280] font-medium mb-1.5">Win Rate</div>
            <div className="text-xl font-bold text-[#111827] mb-1.5">91%</div>
            <div className="flex gap-1">
              {[1, 1, 1, 1, 1, 0, 1, 1, 1, 1].map((v, i) => (
                <div key={i} className={`w-2 h-2 rounded-sm ${v ? "bg-emerald-500" : "bg-red-400"}`} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const pips = useCounter(4280);
  const traders = useCounter(12847);
  const accuracy = useCounter(89);
  const signals = useCounter(3420);

  return (
    <section className="bg-[#111827] py-14">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { icon: <Activity className="w-6 h-6" />, value: traders.toLocaleString(), label: "Active Traders", color: "#2563EB" },
          { icon: <Target className="w-6 h-6" />, value: `${accuracy}%`, label: "Signal Accuracy", color: "#10B981" },
          { icon: <Zap className="w-6 h-6" />, value: signals.toLocaleString(), label: "Total Signals", color: "#6D28D9" },
          { icon: <TrendingUp className="w-6 h-6" />, value: pips.toLocaleString(), label: "Monthly Pips", color: "#F5B301" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: `${s.color}22`, color: s.color }}>
              {s.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-sm text-gray-400 font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <Zap />, title: "Real-Time Signals", desc: "Instant trading signals with precise entry, stop-loss, and take-profit levels the moment our analysts identify an opportunity.", color: "#2563EB" },
    { icon: <ShieldCheck />, title: "Risk Management", desc: "Every signal includes risk percentage, risk-reward ratio, and confidence score to help you manage capital effectively.", color: "#10B981" },
    { icon: <BarChart2 />, title: "Expert Analysis", desc: "Full market analysis including trend direction, support & resistance, liquidity zones, and SMC entry rationale.", color: "#6D28D9" },
    { icon: <Bell />, title: "Multi-Platform Alerts", desc: "Never miss a signal with push notifications, email alerts, browser notifications, and Telegram messages.", color: "#F5B301" },
    { icon: <Star />, title: "Multi-Market Coverage", desc: "Trade across Forex, Gold (XAUUSD), Bitcoin, Ethereum, Nasdaq, S&P 500, Oil, and commodity markets.", color: "#2563EB" },
    { icon: <GraduationCap />, title: "Education Library", desc: "Learn from beginner to advanced — Forex basics, price action, SMC, ICT concepts, and trading psychology.", color: "#10B981" },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] border border-blue-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Star className="w-3.5 h-3.5" /> Premium Features
          </div>
          <h2 className="text-4xl font-bold text-[#111827] mb-4">Everything You Need to Trade Professionally</h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">A complete trading intelligence platform built for serious traders who demand precision, clarity, and performance.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="group bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-[#111827] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SignalPreviewSection() {
  const { signals, isLoading } = useSignals({ pageSize: 3, sort: "confidence" });
  return (
    <section id="signals" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Signals Preview
          </div>
          <h2 className="text-4xl font-bold text-[#111827] mb-4">See Our Live Signals in Action</h2>
          <p className="text-lg text-[#6B7280]">A snapshot of the real-time trading signals our members receive every day.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {isLoading
            ? [0, 1, 2].map((i) => <div key={i} className="h-64 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />)
            : signals.slice(0, 3).map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}>
                  <SignalCard signal={s} preview />
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview({ onGetStarted }: { onGetStarted: () => void }) {
  const { plans, isLoading } = usePlans();
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-[#6D28D9] border border-purple-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <CreditCard className="w-3.5 h-3.5" /> Subscription Plans
          </div>
          <h2 className="text-4xl font-bold text-[#111827] mb-4">Choose Your Trading Edge</h2>
          <p className="text-lg text-[#6B7280]">Flexible plans for every level of trader. Upgrade or cancel anytime.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="h-80 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] animate-pulse" />)
            : plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.popular ? "border-[#6D28D9] shadow-lg shadow-purple-100" : "border-[#E5E7EB]"}`}
              style={{ background: plan.bg }}>
              {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6D28D9] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Most Popular</div>}
              <div className="mb-5">
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-[#111827]">{plan.price}</span>
                  <span className="text-sm text-[#6B7280] mb-1">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px" style={{ background: plan.color }}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-[#111827] text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={30} />
             
            </div>
            <p className="text-sm leading-relaxed mb-4 text-gray-500">Professional trading signals for Forex, Gold, Crypto, and Indices. Trusted by 12,000+ traders worldwide.</p>
            <p className="text-xs text-gray-600 leading-relaxed">Trading signals are for educational and informational purposes only. Trading involves substantial risk of loss and may not be suitable for all investors. Past performance is not indicative of future results.</p>
          </div>
          {[
            { title: "Platform", links: ["Live Signals", "Signal History", "Market News", "Economic Calendar", "Performance"] },
            { title: "Learn", links: ["Forex Basics", "Price Action", "SMC Concepts", "Risk Management", "Psychology"] },
            { title: "Company", links: ["About Us", "Privacy Policy", "Terms & Conditions", "Risk Disclosure", "Support"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}><a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© 2025 4xGem. All rights reserved.</span>
          <span>Risk Warning: Trading financial instruments carries a high level of risk.</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Auth Screen ───────────────────────────────────────────────────────────────

function AuthScreen({ authView, setAuthView, onAuthSuccess, onBack }: {
  authView: AuthView;
  setAuthView: (v: AuthView) => void;
  onAuthSuccess: () => void;
  onBack: () => void;
}) {
  const { login, isLoggingIn, loginError, twoFactorLogin, isVerifyingTwoFactor, twoFactorLoginError, register, isRegistering, registerError } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const [signinForm, setSigninForm] = useState({ email: "", password: "" });
  const [signinFieldError, setSigninFieldError] = useState<string | null>(null);

  const [twoFactorChallengeToken, setTwoFactorChallengeToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorFieldError, setTwoFactorFieldError] = useState<string | null>(null);

  const [signupForm, setSignupForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [signupFieldError, setSignupFieldError] = useState<string | null>(null);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setSigninFieldError(null);
    if (!signinForm.email || !signinForm.password) {
      setSigninFieldError("Please enter your email and password.");
      return;
    }
    try {
      const result = await login({ email: signinForm.email, password: signinForm.password });
      if (result.twoFactorRequired) {
        setTwoFactorChallengeToken(result.challengeToken);
      } else {
        onAuthSuccess();
      }
    } catch (err) {
      setSigninFieldError(getApiErrorMessage(err, "Unable to sign in."));
    }
  };

  const handleTwoFactorSubmit = async () => {
    setTwoFactorFieldError(null);
    if (!twoFactorChallengeToken) return;
    if (!twoFactorCode) {
      setTwoFactorFieldError("Enter the 6-digit code from your authenticator app, or a recovery code.");
      return;
    }
    try {
      await twoFactorLogin(twoFactorChallengeToken, twoFactorCode);
      onAuthSuccess();
    } catch (err) {
      setTwoFactorFieldError(getApiErrorMessage(err, "That code isn't valid."));
    }
  };

  const handleSignUp = async () => {
    setSignupFieldError(null);
    if (!signupForm.email || !signupForm.password) {
      setSignupFieldError("Please fill in your email and password.");
      return;
    }
    try {
      await register(signupForm);
      // Registration requires email verification before the session cookie
      // is issued, so we don't jump to the dashboard yet — prompt the user
      // to check their inbox, then drop them into the sign-in view.
      setSignupSuccessMessage("Account created! Check your email to verify your address, then sign in.");
      setSignupForm({ firstName: "", lastName: "", email: "", password: "" });
      setTimeout(() => {
        setSignupSuccessMessage(null);
        setAuthView("signin");
      }, 3500);
    } catch (err) {
      setSignupFieldError(getApiErrorMessage(err, "Unable to create account."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-blue-50/40 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 mb-6">
            <Logo size={42} />
           
          </button>
          <p className="text-[#6B7280] text-sm">Professional Trading Intelligence Platform</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl shadow-blue-50/80 p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {authView === "welcome" && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-bold text-[#111827] mb-1.5">Welcome to 4xGem</h2>
                <p className="text-[#6B7280] text-sm mb-7">Join thousands of professional traders getting real-time signals every day.</p>
                <div className="space-y-3">
                  <GoogleSignInButton
                    text="continue_with"
                    onSuccess={onAuthSuccess}
                    onTwoFactorRequired={(token) => { setAuthView("signin"); setTwoFactorChallengeToken(token); }}
                    onError={(msg) => { setAuthView("signin"); setSigninFieldError(msg); }}
                  />
                  <button onClick={() => setAuthView("signup")} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-blue-200">
                    Create Account
                  </button>
                  <button onClick={() => setAuthView("signin")} className="w-full border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] font-semibold py-3 rounded-2xl transition-all duration-200 text-sm">
                    Sign In
                  </button>
                </div>
                <p className="text-center text-xs text-[#6B7280] mt-6">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>
                </p>
              </motion.div>
            )}

            {authView === "signin" && (
              <motion.div key="signin" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                {twoFactorChallengeToken ? (
                  <>
                    <h2 className="text-2xl font-bold text-[#111827] mb-2">Two-Factor Verification</h2>
                    <p className="text-sm text-[#6B7280] mb-7">Enter the 6-digit code from your authenticator app, or one of your recovery codes.</p>
                    <div className="space-y-4">
                      {(twoFactorFieldError || twoFactorLoginError) && (
                        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{twoFactorFieldError ?? twoFactorLoginError}</span>
                        </div>
                      )}
                      <input
                        autoFocus
                        placeholder="123456 or XXXX-XXXX-XXXX"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTwoFactorSubmit()}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                      <button
                        onClick={handleTwoFactorSubmit}
                        disabled={isVerifyingTwoFactor}
                        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-blue-200"
                      >
                        {isVerifyingTwoFactor ? "Verifying..." : "Verify & Sign In"}
                      </button>
                    </div>
                    <button
                      onClick={() => { setTwoFactorChallengeToken(null); setTwoFactorCode(""); setTwoFactorFieldError(null); }}
                      className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] mx-auto mt-4 transition-colors"
                    >
                      ← Back to sign in
                    </button>
                  </>
                ) : (
                <>
                <h2 className="text-2xl font-bold text-[#111827] mb-5">Sign In</h2>
                <div className="mb-5">
                  <GoogleSignInButton
                    text="signin_with"
                    onSuccess={onAuthSuccess}
                    onTwoFactorRequired={(token) => setTwoFactorChallengeToken(token)}
                    onError={(msg) => setSigninFieldError(msg)}
                  />
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                    <span className="text-xs text-[#9CA3AF] font-medium">OR CONTINUE WITH EMAIL</span>
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                  </div>
                </div>
                <div className="space-y-4">
                  {(signinFieldError || loginError) && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{signinFieldError ?? loginError}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={signinForm.email}
                        onChange={(e) => setSigninForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={signinForm.password}
                        onChange={(e) => setSigninForm((f) => ({ ...f, password: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[#6B7280] cursor-pointer">
                      <input type="checkbox" className="rounded accent-[#2563EB]" /> Remember me
                    </label>
                    <a href="#" className="text-[#2563EB] hover:underline font-medium">Forgot password?</a>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-blue-200 mt-2"
                  >
                    {isLoggingIn ? "Signing in..." : "Sign In"}
                  </button>
                </div>
                <p className="text-center text-sm text-[#6B7280] mt-6">
                  {"Don't have an account? "}
                  <button onClick={() => setAuthView("signup")} className="text-[#2563EB] font-semibold hover:underline">Sign Up</button>
                </p>
                <button onClick={() => setAuthView("welcome")} className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] mx-auto mt-3 transition-colors">
                  ← Back
                </button>
                </>
                )}
              </motion.div>
            )}

            {authView === "signup" && (
              <motion.div key="signup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-bold text-[#111827] mb-5">Create Account</h2>
                <div className="mb-5">
                  <GoogleSignInButton
                    text="signup_with"
                    onSuccess={onAuthSuccess}
                    onTwoFactorRequired={(token) => { setAuthView("signin"); setTwoFactorChallengeToken(token); }}
                    onError={(msg) => setSignupFieldError(msg)}
                  />
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                    <span className="text-xs text-[#9CA3AF] font-medium">OR SIGN UP WITH EMAIL</span>
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                  </div>
                </div>
                <div className="space-y-4">
                  {signupSuccessMessage ? (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{signupSuccessMessage}</span>
                    </div>
                  ) : (
                    (signupFieldError || registerError) && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{signupFieldError ?? registerError}</span>
                      </div>
                    )
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-[#111827] mb-1.5">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={signupForm.firstName}
                        onChange={(e) => setSignupForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#111827] mb-1.5">Last Name</label>
                      <input
                        type="text"
                        placeholder="Smith"
                        value={signupForm.lastName}
                        onChange={(e) => setSignupForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min. 10 characters, 1 upper, 1 lower, 1 number"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSignUp}
                    disabled={isRegistering}
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-blue-200 mt-2"
                  >
                    {isRegistering ? "Creating account..." : "Create Account"}
                  </button>
                </div>
                <p className="text-center text-sm text-[#6B7280] mt-6">
                  Already have an account?{" "}
                  <button onClick={() => setAuthView("signin")} className="text-[#2563EB] font-semibold hover:underline">Sign In</button>
                </p>
                <button onClick={() => setAuthView("welcome")} className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111827] mx-auto mt-3 transition-colors">
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Terms Modal ──────────────────────────────────────────────────────────────

function TermsModal({ checked, setChecked, onAccept, onDecline }: {
  checked: boolean[];
  setChecked: (c: boolean[]) => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const allChecked = checked.every(Boolean);
  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#2563EB] to-[#6D28D9] p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Important Notice</h2>
              <p className="text-blue-100 text-sm mt-0.5">Please read carefully before accessing the dashboard</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <ul className="space-y-2">
              {[
                "Trading signals are provided strictly for educational and informational purposes.",
                "We are not financial advisors or licensed brokers.",
                "Trading Forex, Gold, Crypto, and CFDs involves substantial risk of loss.",
                "Past performance does not guarantee future results.",
                "You are fully responsible for your own trading decisions.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 mb-6">
            {[
              "I have read and accept the Terms & Conditions",
              "I understand the risks associated with trading",
              "I agree to receive trading signals for educational purposes",
            ].map((label, i) => (
              <label key={i} onClick={() => toggle(i)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${checked[i] ? "border-[#2563EB] bg-blue-50" : "border-[#E5E7EB] bg-white hover:border-gray-300"}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${checked[i] ? "bg-[#2563EB] border-[#2563EB]" : "border-gray-300 bg-white"}`}>
                  {checked[i] && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-[#111827] font-medium select-none">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onDecline} className="flex-1 py-3 rounded-2xl border border-[#E5E7EB] text-[#6B7280] font-semibold text-sm hover:bg-gray-50 transition-all">
              Decline
            </button>
            <button onClick={onAccept} disabled={!allChecked} className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${allChecked ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-blue-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Accept & Continue
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "signals", icon: Zap, label: "Live Signals" },
  { id: "history", icon: History, label: "Signal History" },
  { id: "news", icon: Newspaper, label: "Market News" },
  { id: "calendar", icon: CalendarDays, label: "Economic Calendar" },
  { id: "journal", icon: BookOpen, label: "Trading Journal" },
  { id: "performance", icon: BarChart2, label: "Performance" },
  { id: "education", icon: GraduationCap, label: "Education" },
  { id: "subscription", icon: CreditCard, label: "Subscription" },
  { id: "support", icon: Headphones, label: "Support" },
  { id: "profile", icon: User, label: "Profile" },
] as const;

const ADMIN_NAV_ITEM = { id: "admin", icon: ShieldCheck, label: "Admin" } as const;

function Sidebar({ section, setSection, open, setOpen, onLogout, isAdmin }: {
  section: DashSection;
  setSection: (s: DashSection) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLogout: () => void;
  isAdmin: boolean;
}) {
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  return (
    <aside
      className="flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col z-30 transition-all duration-300"
      style={{ width: open ? 256 : 72 }}
    >
      <div className="h-16 flex items-center px-4 border-b border-[#E5E7EB] gap-3 overflow-hidden">
        <Logo size={30} />
       
        <button onClick={() => setOpen(!open)} className="ml-auto p-1.5 rounded-lg text-[#6B7280] hover:bg-gray-100 transition-colors flex-shrink-0">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = section === id;
          return (
            <button key={id} onClick={() => setSection(id as DashSection)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${active ? "bg-gradient-to-r from-[#2563EB] to-[#6D28D9] text-white shadow-md shadow-blue-200/60" : "text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]"} ${!open ? "justify-center px-0" : ""}`}
              title={!open ? label : undefined}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {open && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E5E7EB]">
        <button onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all duration-200 whitespace-nowrap ${!open ? "justify-center px-0" : ""}`}
          title={!open ? "Logout" : undefined}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, preview = false }: { signal: UiSignal; preview?: boolean }) {
  const isBuy = signal.type === "BUY" || signal.type === "BUY LIMIT";

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
      <div className={`px-5 pt-4 pb-3 border-b border-[#F1F5F9] ${isBuy ? "bg-gradient-to-r from-emerald-50/80 to-white" : "bg-gradient-to-r from-red-50/60 to-white"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-[#6B7280] font-medium mb-0.5">{signal.name}</div>
            <div className="text-xl font-bold text-[#111827] font-mono">{signal.pair}</div>
            <div className="text-xs text-[#6B7280] mt-0.5 font-medium">{signal.category}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${signalTypeStyle(signal.type)}`}>{signal.type}</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${signalStatusBadge(signal.status)}`}>{signal.status}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 grid grid-cols-2 gap-2">
        <div className="bg-[#F8FAFC] rounded-xl px-3 py-2.5">
          <div className="text-xs text-[#6B7280] mb-0.5">Entry</div>
          <div className="text-sm font-semibold text-[#111827] font-mono">{signal.entry}</div>
        </div>
        <div className="bg-red-50 rounded-xl px-3 py-2.5">
          <div className="text-xs text-red-500 mb-0.5">Stop Loss</div>
          <div className="text-sm font-semibold text-red-600 font-mono">{signal.sl}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
          <div className="text-xs text-emerald-600 mb-0.5">TP 1</div>
          <div className="text-sm font-semibold text-emerald-700 font-mono">{signal.tp1}</div>
        </div>
        <div className="bg-emerald-50/70 rounded-xl px-3 py-2.5">
          <div className="text-xs text-emerald-600 mb-0.5">TP 2</div>
          <div className="text-sm font-semibold text-emerald-700 font-mono">{signal.tp2}</div>
        </div>
        {!preview && (
          <div className="col-span-2 bg-emerald-50/50 rounded-xl px-3 py-2.5">
            <div className="text-xs text-emerald-600 mb-0.5">TP 3</div>
            <div className="text-sm font-semibold text-emerald-700 font-mono">{signal.tp3}</div>
          </div>
        )}
      </div>

      <div className="px-5 py-2">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#6B7280] font-medium">Confidence</span>
          <span className="font-bold text-[#111827]">{signal.confidence}%</span>
        </div>
        <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#6D28D9] rounded-full transition-all duration-1000" style={{ width: `${signal.confidence}%` }} />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#F1F5F9] flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{signal.countdown}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${signal.riskLevel === "High" ? "bg-red-50 text-red-500" : signal.riskLevel === "Medium" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
            {signal.riskLevel} Risk
          </span>
        </div>
        {!preview && (
          <div className="text-right">
            <div className="text-xs text-[#6B7280] flex items-center justify-end gap-1">
              Float {signal.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live price" />}
            </div>
            <div className={`text-sm font-bold font-mono ${signal.floatingProfit.startsWith("+") ? "text-emerald-600" : signal.floatingProfit.startsWith("-") ? "text-red-500" : "text-[#6B7280]"}`}>{signal.floatingProfit}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Live Signals Dashboard ───────────────────────────────────────────────────

function LiveSignals() {
  const [filter, setFilter] = useState("All");
  const cats = ["All", "Forex", "Gold", "Crypto"];
  const { signals, isLoading, isError } = useSignals({ pageSize: 50 });
  const filtered = filter === "All" ? signals : signals.filter(s => s.category === filter);

  return (
    <div className="p-6 lg:p-8">
     
  <div className="mb-6">

  <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden mb-6">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Live Market Prices
        </h2>

        <p className="text-sm text-slate-500">
          Gold • Forex • Crypto
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-sm font-semibold text-emerald-700">
          LIVE
        </span>
      </div>
    </div>

    <div className="p-5 bg-slate-50">
      <MarketTicker />
    </div>
  </div>

  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-[#111827]">
        Live Market
      </h1>

      <p className="text-sm text-[#6B7280] mt-0.5">
        Real-time trading signals — updated every minute
      </p>
    </div>

    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {signals.length} Active
      </div>

      <NotificationsBell />
    </div>
  </div>

</div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open", value: signals.filter(s => s.status === "Open").length, color: "#6B7280" },
          { label: "Running", value: signals.filter(s => s.status === "Running").length, color: "#10B981" },
          { label: "Hit TP", value: signals.filter(s => s.status.startsWith("Hit")).length, color: "#F5B301" },
          { label: "Win Rate", value: "91%", color: "#2563EB" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 text-center shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#6B7280] font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${filter === cat ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm" : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300 hover:text-[#111827] bg-white"}`}>
            {cat}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load signals right now. Please try again shortly.</div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-72 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((signal, i) => (
            <motion.div key={signal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <SignalCard signal={signal} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Performance Dashboard ────────────────────────────────────────────────────

// ─── Market News ──────────────────────────────────────────────────────────────

function MarketNewsSection() {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Forex", "Gold", "Crypto"];
  const { news, isLoading, isError } = useNews();
  const filtered = activeTab === "All" ? news : news.filter(n => n.category === activeTab);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Market News</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Professional financial news and market analysis</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${activeTab === tab ? "bg-[#2563EB] text-white border-[#2563EB]" : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300 bg-white"}`}>
            {tab}
          </button>
        ))}
      </div>
      {isError ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load news right now. Please try again shortly.</div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">No news articles in this category yet.</div>
      ) : (
        <div className="space-y-4">
   {filtered.map((news, i) => (
  <motion.a
    key={news.id}
    href={news.url}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.08 }}
    className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 block"
  >
    <div className="md:flex">

      <img
        src={news.image}
        alt={news.title}
        className="w-full md:w-64 h-44 object-cover"
      />

      <div className="flex-1 p-5">

        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
            LIVE
          </span>

          <span className="text-xs text-gray-500">
            {news.source}
          </span>

          <span className="text-xs text-gray-400">
            • {news.time}
          </span>

        </div>

        <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600">
          {news.title}
        </h3>

        <p className="mt-3 text-gray-600 line-clamp-3">
          {news.summary}
        </p>

        <div className="mt-5 text-blue-600 font-semibold">
          Read Full Article →
        </div>

      </div>

    </div>
  </motion.a>
))}
        </div>
      )}
    </div>
  );
}

// ─── Economic Calendar ────────────────────────────────────────────────────────

function EconomicCalendarSection() {
  const [impactFilter, setImpactFilter] = useState("All");
  const { events, isLoading, isError } = useCalendar();
  const displayed = events.filter(e => impactFilter === "All" || e.impact === impactFilter);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Economic Calendar
      </h1>

      <div className="bg-white rounded-2xl shadow p-4">
        <TradingViewCalendar />
      </div>
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

function EducationSection() {
  const { topics, isLoading, isError, markStarted } = useEducation();
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Education</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Master trading from beginner to institutional level</p>
      </div>
      {isError ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load the education library right now. Please try again shortly.</div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map(i => <div key={i} className="h-40 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />)}
        </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-sm">
            <div className="text-3xl mb-3">{t.icon}</div>
            <h3 className="font-bold text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors">{t.title}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: `${t.color}15`, color: t.color }}>{t.levelDisplay}</span>
              <span className="text-xs text-[#6B7280]">{t.lessons} lessons</span>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-2.5">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.progress}%`, background: t.color }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">{t.progress}% complete</span>
              <button onClick={() => markStarted(t.id, t.progress)} className="text-xs font-bold text-[#2563EB] flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                {t.progress >= 100 ? "Review" : t.progress > 0 ? "Continue" : "Start"} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────

function SubscriptionSection() {
  const { plans, isLoading, isError } = usePlans();
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  const handleSubscribe = async (plan: { id: string; tier: string; name: string }) => {
    if (plan.tier === "FREE") {
      setNotice("You're already on the Free plan.");
      return;
    }
    setCheckoutPlanId(plan.id);
    setNotice(null);
    const result = await billingApi.startCheckout(plan.id);
    if (!result.ok) setNotice(result.message);
    setCheckoutPlanId(null);
  };

  const handleManageBilling = async () => {
    const result = await billingApi.openBillingPortal();
    if (!result.ok) setNotice(result.message);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Subscription Plans</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Choose the plan that fits your trading goals</p>
        </div>
        <button onClick={handleManageBilling} className="text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
          Manage billing →
        </button>
      </div>
      {notice && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">{notice}</div>
      )}
      {isError ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load plans right now. Please try again shortly.</div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-80 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border-2 ${plan.popular ? "border-[#6D28D9] shadow-xl shadow-purple-100" : "border-[#E5E7EB] shadow-sm"}`}
              style={{ background: plan.bg }}>
              {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6D28D9] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Most Popular</div>}
              <div className="mb-5">
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-[#111827]">{plan.price}</span>
                  <span className="text-sm text-[#6B7280] mb-1">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={checkoutPlanId === plan.id}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-md disabled:opacity-60" style={{ background: plan.color }}>
                {checkoutPlanId === plan.id ? "Redirecting to checkout..." : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const {
    error, success, updateProfile, isUpdatingProfile, uploadAvatar, isUploadingAvatar,
    preferences, isLoadingPreferences, updatePreferences,
    sessions, isLoadingSessions, revokeSession, revokeAllSessions,
  } = useProfileSettings();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const nameChanged = firstName !== (user?.firstName ?? "") || lastName !== (user?.lastName ?? "");

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Trader";
  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—";
  const roleLabel: Record<string, string> = {
    ADMIN: "Admin", EDITOR: "Editor", ANALYST: "Analyst", SUBSCRIBER: "Subscriber", USER: "Free Member",
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Profile</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage your account settings and preferences</p>
      </div>

      {(error || success) && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error ?? success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center shadow-sm">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D28D9] flex items-center justify-center text-white text-3xl font-bold">{initial}</div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
              <span className="text-xs">{isUploadingAvatar ? "…" : "📷"}</span>
            </label>
          </div>
          <h2 className="text-xl font-bold text-[#111827]">{fullName}</h2>
          <p className="text-sm text-[#6B7280] mb-2">{user?.email}</p>
          <div className="inline-flex items-center gap-1.5 bg-purple-50 text-[#6D28D9] text-xs font-bold px-3 py-1 rounded-full border border-purple-100 mt-1 mb-4">
            <Star className="w-3 h-3" /> {roleLabel[user?.role?.name ?? "USER"] ?? user?.role?.name}
          </div>
          <p className="text-xs text-[#6B7280]">Member since {memberSince}</p>
          {!user?.emailVerifiedAt && (
            <p className="text-xs text-amber-600 font-medium mt-2">⚠️ Email not verified</p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#111827] mb-4">Account Information</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
              <span className="text-sm text-[#6B7280]">Email: {user?.email ?? "—"} · Status: {user?.status ?? "—"}</span>
              <button
                onClick={() => updateProfile({ firstName: firstName || undefined, lastName: lastName || undefined })}
                disabled={!nameChanged || isUpdatingProfile}
                className="text-xs font-semibold text-white bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-[#1D4ED8]"
              >
                {isUpdatingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#111827] mb-4">Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]">
                <span className="text-sm text-[#6B7280]">Password: ••••••••</span>
              </div>
              <TwoFactorSettings isEnabled={Boolean(user?.twoFactorEnabled)} />
              {isLoadingSessions ? (
                <div className="h-16 rounded-xl bg-[#F8FAFC] animate-pulse" />
              ) : (
                <div className="py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#111827]">Active Sessions ({sessions.length})</span>
                    {sessions.length > 0 && (
                      <button onClick={() => revokeAllSessions()} className="text-xs font-semibold text-red-600 hover:underline">Log out everywhere</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {sessions.length === 0 ? (
                      <p className="text-xs text-[#6B7280]">No other active sessions.</p>
                    ) : (
                      sessions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-xs bg-[#F8FAFC] rounded-lg px-3 py-2">
                          <span className="text-[#6B7280]">{s.userAgent?.slice(0, 40) ?? "Unknown device"} · {s.ipAddress ?? "—"}</span>
                          <button onClick={() => revokeSession(s.id)} className="text-red-600 font-semibold hover:underline">Revoke</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#111827] mb-4">Notification Preferences</h3>
            {isLoadingPreferences || !preferences ? (
              <div className="h-24 rounded-xl bg-[#F8FAFC] animate-pulse" />
            ) : (
              <div className="space-y-3">
                {([
                  ["emailAlerts", "Email Alerts"],
                  ["pushAlerts", "Push Notifications"],
                  ["telegramAlerts", "Telegram Alerts"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-sm text-[#6B7280]">{label}</span>
                    <button
                      onClick={() => updatePreferences({ [key]: !preferences[key] })}
                      className={`w-10 h-6 rounded-full transition-colors relative ${preferences[key] ? "bg-[#2563EB]" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${preferences[key] ? "translate-x-4.5 left-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const ROLE_OPTIONS = ["USER", "SUBSCRIBER", "ANALYST", "EDITOR", "ADMIN"];
const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DEACTIVATED"];

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-50 text-emerald-700";
    case "SUSPENDED": return "bg-red-50 text-red-700";
    case "PENDING_VERIFICATION": return "bg-amber-50 text-amber-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function PublishSignalForm({ onDone }: { onDone: () => void }) {
  const { createSignal, isCreating, error, success, clearError } = useCreateSignal();
  const [form, setForm] = useState({
    pair: "", name: "", category: "FOREX" as const, direction: "BUY" as const,
    entry: "", stopLoss: "", takeProfit1: "", takeProfit2: "", takeProfit3: "",
    riskPercent: "1.0", confidence: "70", requiredTier: "FREE" as const,
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = () => {
    if (!form.pair || !form.name || !form.entry || !form.stopLoss || !form.takeProfit1) {
      return;
    }
    createSignal({
      pair: form.pair,
      name: form.name,
      category: form.category,
      direction: form.direction,
      entry: parseFloat(form.entry),
      stopLoss: parseFloat(form.stopLoss),
      takeProfit1: parseFloat(form.takeProfit1),
      takeProfit2: form.takeProfit2 ? parseFloat(form.takeProfit2) : undefined,
      takeProfit3: form.takeProfit3 ? parseFloat(form.takeProfit3) : undefined,
      riskPercent: parseFloat(form.riskPercent),
      confidence: parseInt(form.confidence, 10),
      requiredTier: form.requiredTier,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm overflow-hidden">
      <h3 className="font-bold text-[#111827] mb-4">Publish New Signal</h3>
      {success && <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Signal published.</div>}
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <input placeholder="Pair (e.g. XAUUSD)" {...field("pair")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Display name" {...field("name")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <select {...field("category")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["FOREX", "GOLD", "CRYPTO", "INDICES", "COMMODITIES"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select {...field("direction")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["BUY", "SELL", "BUY_LIMIT", "SELL_LIMIT"].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input placeholder="Entry" type="number" step="any" {...field("entry")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Stop Loss" type="number" step="any" {...field("stopLoss")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Take Profit 1" type="number" step="any" {...field("takeProfit1")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Take Profit 2 (optional)" type="number" step="any" {...field("takeProfit2")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Take Profit 3 (optional)" type="number" step="any" {...field("takeProfit3")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Risk %" type="number" step="0.1" {...field("riskPercent")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Confidence (0-100)" type="number" {...field("confidence")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <select {...field("requiredTier")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["FREE", "BASIC", "PREMIUM", "VIP"].map((t) => <option key={t} value={t}>{t} tier+</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} disabled={isCreating} className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60">
          {isCreating ? "Publishing..." : "Publish Signal"}
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

function PublishNewsForm({ onDone }: { onDone: () => void }) {
  const { createNews, isCreating, error, success, clearError } = useCreateNews();
  const [form, setForm] = useState({
    category: "FOREX" as const, impact: "MEDIUM" as const, title: "", summary: "",
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = () => {
    if (!form.title || !form.summary) return;
    createNews(form);
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm overflow-hidden">
      <h3 className="font-bold text-[#111827] mb-4">Publish News Article</h3>
      {success && <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Article published.</div>}
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select {...field("category")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["FOREX", "GOLD", "CRYPTO", "INDICES", "COMMODITIES"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select {...field("impact")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["LOW", "MEDIUM", "HIGH"].map((i) => <option key={i} value={i}>{i} impact</option>)}
        </select>
      </div>
      <input placeholder="Headline" {...field("title")} className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm mb-3" />
      <textarea placeholder="Summary" {...field("summary")} rows={3} className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm mb-3" />
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} disabled={isCreating} className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60">
          {isCreating ? "Publishing..." : "Publish Article"}
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-gray-50">Cancel</button>
      </div>
    </motion.div>
  );
}

function AddEventForm({ onDone }: { onDone: () => void }) {
  const { createEvent, isCreating, error, success, clearError } = useCreateEvent();
  const [form, setForm] = useState({
    eventTime: "", country: "", currency: "USD", title: "", impact: "MEDIUM" as const, previous: "", forecast: "",
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = () => {
    if (!form.eventTime || !form.country || !form.title) return;
    createEvent({ ...form, eventTime: new Date(form.eventTime).toISOString() });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm overflow-hidden">
      <h3 className="font-bold text-[#111827] mb-4">Add Economic Event</h3>
      {success && <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Event added.</div>}
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <input type="datetime-local" {...field("eventTime")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Country (e.g. United States)" {...field("country")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Currency (e.g. USD)" {...field("currency")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <select {...field("impact")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm">
          {["LOW", "MEDIUM", "HIGH"].map((i) => <option key={i} value={i}>{i} impact</option>)}
        </select>
        <input placeholder="Previous (optional)" {...field("previous")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
        <input placeholder="Forecast (optional)" {...field("forecast")} className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm" />
      </div>
      <input placeholder="Event title (e.g. Non-Farm Payrolls)" {...field("title")} className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm mb-3" />
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} disabled={isCreating} className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60">
          {isCreating ? "Adding..." : "Add Event"}
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-gray-50">Cancel</button>
      </div>
    </motion.div>
  );
}

function AdminSection() {
  const { summary, isLoading: summaryLoading } = useAdminSummary();
  const {
    users, isLoading, isError, setParams,
    actionError, clearActionError, updateUser, deactivateUser,
  } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState<"none" | "signal" | "news" | "event">("none");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Platform overview, user management, and content publishing</p>
        </div>
        <div className="flex items-center gap-2">
          {([
            ["signal", "+ Signal"],
            ["news", "+ News"],
            ["event", "+ Event"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveForm((v) => (v === id ? "none" : id))}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${activeForm === id ? "bg-[#1D4ED8] text-white" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeForm === "signal" && <PublishSignalForm onDone={() => setActiveForm("none")} />}
      {activeForm === "news" && <PublishNewsForm onDone={() => setActiveForm("none")} />}
      {activeForm === "event" && <AddEventForm onDone={() => setActiveForm("none")} />}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Users", value: summary?.totalUsers ?? "—", color: "#2563EB" },
          { label: "Active Subscriptions", value: summary?.activeSubscriptions ?? "—", color: "#6D28D9" },
          { label: "MRR", value: summary ? `$${summary.mrr.toFixed(0)}` : "—", color: "#10B981" },
          { label: "Open Signals", value: summary?.openSignals ?? "—", color: "#F5B301" },
          { label: "New Users (30d)", value: summary?.newUsersLast30Days ?? "—", color: "#D97706" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-[#6B7280] font-medium mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{summaryLoading ? "…" : kpi.value}</div>
          </div>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{actionError}</span>
          <button onClick={clearActionError} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setParams((p) => ({ ...p, search, page: 1 }))}
            placeholder="Search by name or email…"
            className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
          <select
            onChange={(e) => setParams((p) => ({ ...p, role: e.target.value || undefined, page: 1 }))}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#6B7280]"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#6B7280]"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isError ? (
          <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load users right now. Please try again shortly.</div>
        ) : isLoading ? (
          <div className="p-4 space-y-2">{[0,1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-[#F8FAFC] animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#F1F5F9] bg-[#F8FAFC]">
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#111827]">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</div>
                      <div className="text-xs text-[#6B7280]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role.name}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="px-2 py-1 rounded-lg border border-[#E5E7EB] text-xs font-medium"
                      >
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadge(u.status)}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {u.status !== "DEACTIVATED" && (
                        <button onClick={() => deactivateUser(u.id)} className="text-xs font-semibold text-red-600 hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
