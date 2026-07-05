import React, { useEffect, useState, useRef } from "react";
import { Experience, Project, SocialLink, Portfolio } from "../types";
import { 
  Briefcase, FolderGit2, Link2, ExternalLink, RefreshCw, 
  User, Compass, ServerCrash, FileDown, Printer, Check, 
  Brain, GraduationCap, Code, Sparkles, MonitorSmartphone, Rocket,
  ArrowLeft, Github, Linkedin, Mail, Twitter, Globe, BookOpen, Layers,
  ChevronDown, ChevronUp, Palette, FileText, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProjectCard from "./ProjectCard";

// helper utility to resolve standard social platform logins into official brand icons
const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase().trim();
  if (p.includes("github")) {
    return <Github className="w-5 h-5 stroke-[1.8]" />;
  }
  if (p.includes("linkedin")) {
    return <Linkedin className="w-5 h-5 stroke-[1.8]" />;
  }
  if (p.includes("twitter") || p.includes(" x ") || p === "x" || p.includes("x (") || p === "x (twitter)") {
    return <Twitter className="w-5 h-5 stroke-[1.8]" />;
  }
  if (p.includes("gmail") || p.includes("mail") || p.includes("email") || p.includes("outlook") || p.includes("yahoo")) {
    return <Mail className="w-5 h-5 stroke-[1.8]" />;
  }
  return <Globe className="w-5 h-5 stroke-[1.8]" />;
};

// helper utility to standardise platform naming on UI badges
const getSocialIconLabel = (platform: string) => {
  const p = platform.toLowerCase().trim();
  if (p.includes("github")) return "GitHub";
  if (p.includes("linkedin")) return "LinkedIn";
  if (p.includes("twitter") || p.includes(" x ") || p === "x" || p.includes("x (")) return "X / Twitter";
  if (p.includes("gmail") || p.includes("mail") || p.includes("email")) return "Gmail / Email";
  return platform;
};

interface LivePortfolioProps {
  key?: string | number;
  usernameParam: string;
  loggedInUsername?: string;
  hideGallery?: boolean;
}

// Visual layout definition for premium templates
export interface TemplateConfig {
  id: string;
  name: string;
  desc: string;
  colors: string[]; // for cute live-updating color preview thumbnails
  fontClass: string;
  bgClass: string;
  cardClass: string;
  textMuted: string;
  textPrimary: string;
  tagClass: string;
  titleClass: string;
  accentText: string;
  accentBg: string;
  borderClass: string;
  buttonClass: string;
  layoutType: "standard" | "two-column" | "asymmetric" | "cyber";
}

export const PREMIUM_TEMPLATES: TemplateConfig[] = [
  {
    id: "antique_newsprint",
    name: "Traditional Newsprint",
    desc: "A rich, double-lined ink press column layout matching vintage newsprint formats.",
    colors: ["#F5F2EA", "#1E1E1C", "#5C5A55"],
    fontClass: "font-serif",
    bgClass: "bg-[#F5F2EA] text-[#1D1B18] bg-newsprint-tint pb-12",
    cardClass: "bg-[#FCFBF8] border-t-2 border-b border-[#2C2925] py-8 px-4 rounded-none hover:bg-[#F2ECE0] transition-all duration-300 shadow-[2px_2px_12px_rgba(40,30,20,0.04)]",
    textMuted: "text-stone-700/80",
    textPrimary: "text-[#1D1B18]",
    tagClass: "border border-stone-850 text-stone-900 bg-transparent hover:bg-stone-900 hover:text-white transition-all py-1 px-3.5 rounded-none text-xs font-serif uppercase tracking-wider",
    titleClass: "font-serif font-black uppercase text-[#1D1B18] text-base md:text-md border-b-4 border-double border-stone-800 pb-2 flex items-center justify-between",
    accentText: "text-stone-900 font-bold underline decoration-stone-900 decoration-double",
    accentBg: "bg-stone-300/30 text-stone-900 border border-stone-800/30",
    borderClass: "border-stone-800",
    buttonClass: "bg-stone-900 hover:bg-stone-850 text-[#F5F2EA] font-bold uppercase rounded-none tracking-widest",
    layoutType: "two-column"
  },
  {
    id: "field_notes",
    name: "Vintage Field Notes",
    desc: "Warm pocket diary look with cardboard binder rings and dot fabric paper textures.",
    colors: ["#FAF6F0", "#3E2723", "#8D6E63"],
    fontClass: "font-mono",
    bgClass: "bg-[#FAF6F0] text-[#3E2723] bg-notebook-dots pb-12",
    cardClass: "bg-white/95 border-l-8 border-[#8D6E63] border-y border-r border-[#E0D5C3] card-notebook-shadow rounded-xl p-6 md:p-8 hover:translate-y-[-2px] transition-all duration-300",
    textMuted: "text-amber-950/75",
    textPrimary: "text-[#3E2723]",
    tagClass: "bg-[#EFEBE9] text-[#5D4037] border border-[#D7CCC8]/70 hover:bg-[#5D4037] hover:text-white transition-all py-1 px-3 rounded-lg text-[10px] font-bold font-mono",
    titleClass: "font-mono font-bold tracking-tight text-[#4E342E] border-b border-dashed border-[#8D6E63] pb-2.5 flex items-center gap-2",
    accentText: "text-[#8D6E63] font-bold",
    accentBg: "bg-[#EFEBE9] text-[#5D4037]",
    borderClass: "border-[#E0D5C3]",
    buttonClass: "bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold rounded-lg",
    layoutType: "standard"
  },
  {
    id: "matte_studio",
    name: "Thick Silk Cardstock",
    desc: "A premium physical business print theme with elegant stacked paper leaf shadows.",
    colors: ["#F8F9FA", "#1A1B1F", "#495057"],
    fontClass: "font-outfit",
    bgClass: "bg-[#EEF1F5] text-[#1A1B1F] pb-12",
    cardClass: "bg-white border border-[#E2E8F0] card-stack-shadow rounded-lg p-6 md:p-8 hover:translate-y-[-2px] transition-all duration-300",
    textMuted: "text-[#495057]",
    textPrimary: "text-[#1A1B1F]",
    tagClass: "bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all py-1.5 px-3 rounded-md text-xs font-bold leading-none",
    titleClass: "font-display font-medium text-[#1A1B1F] border-b border-[#E2E8F0] pb-2 flex items-center gap-2 text-md",
    accentText: "text-slate-950 font-bold",
    accentBg: "bg-slate-50 text-slate-800",
    borderClass: "border-[#F1F3F5]",
    buttonClass: "bg-[#1A1B1F] hover:bg-black text-white font-bold rounded-md px-4 py-2 text-xs",
    layoutType: "standard"
  },
  {
    id: "museum_exhibition",
    name: "Archival Exhibit Label",
    desc: "Typewriter museum catalogue style with custom stamp borders and precise metadata notes.",
    colors: ["#FFFFFF", "#020617", "#64748B"],
    fontClass: "font-mono",
    bgClass: "bg-[#E5E5E5] text-[#020617] pb-12",
    cardClass: "bg-white border border-slate-900 shadow-[4px_4px_0px_#020617] p-6 md:p-8 rounded-none transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#020617] relative",
    textMuted: "text-slate-650",
    textPrimary: "text-slate-950",
    tagClass: "border border-slate-950 text-slate-950 font-bold bg-transparent px-2.5 py-1 text-[10px] hover:bg-slate-950 hover:text-white transition-all rounded-none select-none font-mono",
    titleClass: "font-mono font-bold tracking-widest text-slate-950 uppercase border-b-2 border-slate-950 pb-2 flex items-center gap-2 text-xs",
    accentText: "text-slate-600 underline decoration-slate-950 decoration-1",
    accentBg: "bg-transparent text-slate-950 border border-dashed border-slate-950/40",
    borderClass: "border-slate-300",
    buttonClass: "bg-slate-950 hover:bg-slate-900 text-white font-bold px-4 py-2 text-xs rounded-none border border-slate-950",
    layoutType: "asymmetric"
  },
  {
    id: "light",
    name: "Minimalist Light",
    desc: "Sleek slate-and-ivory aesthetic with indigo interactive touches.",
    colors: ["#f8fafc", "#4f46e5", "#0f172a"],
    fontClass: "font-sans",
    bgClass: "bg-radial from-slate-50 to-orange-50/20 text-[#0f172a]",
    cardClass: "bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.02)] rounded-2xl p-6 md:p-8 hover:shadow-[0_16px_48px_rgba(0,0,0,0.04)] hover:border-indigo-500/10 transition-all duration-300",
    textMuted: "text-slate-600",
    textPrimary: "text-slate-900",
    tagClass: "bg-slate-100 text-slate-800 border border-slate-200/50 hover:bg-slate-905 hover:text-white hover:border-slate-900 transition-all duration-300 py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-display font-black tracking-tight text-slate-950 text-base md:text-lg border-b border-slate-150 pb-2 flex items-center gap-2",
    accentText: "text-indigo-600",
    accentBg: "bg-indigo-50 text-indigo-600",
    borderClass: "border-slate-100",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    layoutType: "standard"
  },
  {
    id: "dark",
    name: "Cosmic Dark",
    desc: "Futuristic dark canvas illuminated by indigo and cosmic sky glows.",
    colors: ["#030712", "#0ea5e9", "#f1f5f9"],
    fontClass: "font-sans",
    bgClass: "bg-radial from-slate-950 via-slate-900 to-black text-[#f1f5f9] dark",
    cardClass: "bg-slate-950/40 backdrop-blur-lg border border-slate-800/80 shadow-[0_15px_45px_rgba(30,27,75,0.25)] rounded-2xl p-6 md:p-8 hover:border-sky-500/20 hover:shadow-[0_20px_50px_rgba(56,189,248,0.08)] transition-all duration-350",
    textMuted: "text-slate-400",
    textPrimary: "text-[#f1f5f9]",
    tagClass: "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-sky-400 hover:text-slate-950 hover:border-sky-450 transition-all duration-300 py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-display font-medium tracking-tight text-white text-base md:text-lg border-b border-slate-800 pb-2 flex items-center gap-2",
    accentText: "text-sky-400",
    accentBg: "bg-sky-500/10 text-sky-400",
    borderClass: "border-slate-800",
    buttonClass: "bg-sky-500 hover:bg-sky-600 text-white",
    layoutType: "standard"
  },
  {
    id: "sunset",
    name: "Sunset Rose",
    desc: "Warm glowing aubergine shades infused with rich terracotta.",
    colors: ["#1e1111", "#fb7185", "#fdf6f0"],
    fontClass: "font-sans",
    bgClass: "bg-radial from-[#1e1111] via-[#0d0707] to-black text-[#fdf6f0] dark",
    cardClass: "bg-[#180e0e]/80 backdrop-blur-lg border border-rose-500/15 shadow-[0_12px_40px_rgba(251,113,133,0.05)] rounded-2xl p-6 md:p-8 hover:border-amber-400/30 hover:shadow-[0_16px_48px_rgba(245,158,11,0.08)] transition-all duration-300",
    textMuted: "text-rose-250/60",
    textPrimary: "text-[#fdf6f0]",
    tagClass: "bg-[#271515]/60 text-amber-200 border border-rose-500/20 hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300 py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-display font-bold tracking-tight text-[#fdf6f0] text-base md:text-lg border-b border-rose-500/15 pb-2 flex items-center gap-2",
    accentText: "text-amber-400",
    accentBg: "bg-rose-500/10 text-rose-350 border border-rose-500/20",
    borderClass: "border-rose-950/20",
    buttonClass: "bg-rose-500 hover:bg-rose-450 text-[#0d0707] font-bold",
    layoutType: "standard"
  },
  {
    id: "cyber",
    name: "Matrix Cyber",
    desc: "Stark terminal monospaced console with retro phosphor elements.",
    colors: ["#000000", "#10b981", "#ffffff"],
    fontClass: "font-mono",
    bgClass: "bg-black text-emerald-400 font-mono",
    cardClass: "bg-zinc-950/90 border border-emerald-500/60 shadow-[4px_4px_0px_rgba(16,185,129,0.3)] p-6 md:p-8 rounded-none hover:border-emerald-450 hover:shadow-[6px_6px_0px_rgba(16,185,129,0.5)] transition-all duration-200",
    textMuted: "text-emerald-500/80",
    textPrimary: "text-emerald-400",
    tagClass: "bg-[#090d16] text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all py-1.5 px-3 rounded-none text-xs font-bold select-none",
    titleClass: "font-mono font-bold tracking-widest uppercase text-white text-sm md:text-md border-b-2 border-emerald-500 pb-2 flex items-center gap-2",
    accentText: "text-yellow-400",
    accentBg: "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30",
    borderClass: "border-emerald-500/30",
    buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-black font-bold",
    layoutType: "cyber"
  },
  {
    id: "slate",
    name: "Swiss Slate",
    desc: "High-contrast block geometry matching classic Swiss typography.",
    colors: ["#f1f5f9", "#000000", "#ffffff"],
    fontClass: "font-sans",
    bgClass: "bg-slate-150 text-black",
    cardClass: "bg-white border-2 border-black shadow-[8px_8px_0px_#000000] p-6 md:p-8 rounded-none transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_#000000]",
    textMuted: "text-zinc-650",
    textPrimary: "text-black",
    tagClass: "bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-200 py-1.5 px-3 rounded-none text-xs font-black select-none",
    titleClass: "font-display font-extrabold uppercase text-black tracking-tight text-sm md:text-md border-b-2 border-black pb-2 flex items-center gap-2",
    accentText: "text-black underline decoration-2 decoration-black",
    accentBg: "bg-slate-200 text-black border border-black",
    borderClass: "border-black",
    buttonClass: "bg-black hover:bg-zinc-800 text-white",
    layoutType: "standard"
  },
  {
    id: "academic_serif",
    name: "Elegant Book",
    desc: "Refined editorial layout with traditional serif fonts.",
    colors: ["#FAF9F6", "#7c2d12", "#1c1917"],
    fontClass: "font-serif",
    bgClass: "bg-[#fcfbf9] text-stone-900 font-serif",
    cardClass: "bg-transparent border-b border-stone-200/80 py-8 px-1 rounded-none hover:bg-stone-50/40 transition-colors",
    textMuted: "text-stone-650",
    textPrimary: "text-stone-900",
    tagClass: "bg-stone-100 text-stone-850 border border-stone-300 hover:bg-stone-900 hover:text-stone-100 transition-all py-1.5 px-3.5 rounded-md text-xs font-medium select-none",
    titleClass: "font-serif italic font-bold text-stone-950 border-b border-stone-800/80 pb-2.5 flex items-center gap-2 text-md md:text-lg",
    accentText: "text-stone-800 underline decoration-stone-400 decoration-1",
    accentBg: "bg-stone-100 text-stone-800 border border-stone-200",
    borderClass: "border-stone-200",
    buttonClass: "bg-stone-900 hover:bg-stone-800 text-white",
    layoutType: "two-column"
  },
  {
    id: "creative_editorial",
    name: "Bold Bricolage",
    desc: "Asymmetric grid frames and retro display typography highlights.",
    colors: ["#faf7f0", "#9a3412", "#450a0a"],
    fontClass: "font-bricolage",
    bgClass: "bg-[#faf8f2] text-stone-800",
    cardClass: "bg-white border border-[#eae2d0] shadow-sm rounded-3xl p-6 md:p-8 hover:shadow-md transition-all duration-300",
    textMuted: "text-stone-600",
    textPrimary: "text-stone-900",
    tagClass: "bg-[#fef3c7] text-[#9a3412] hover:bg-[#9a3412] hover:text-white transition-all py-1.5 px-4 rounded-full text-xs font-bold select-none",
    titleClass: "font-bricolage font-extrabold text-[#7c2d12] border-b border-stone-200 pb-2 flex items-center gap-2",
    accentText: "text-[#9a3412]",
    accentBg: "bg-[#fffbeb] text-[#9a3412]",
    borderClass: "border-[#f1eadb]",
    buttonClass: "bg-[#9a3412] hover:bg-[#7c2d12] text-white",
    layoutType: "asymmetric"
  },
  {
    id: "neon_nights",
    name: "Neon Nights",
    desc: "Vibrant electric violet lines framed in obsidian darkness.",
    colors: ["#020204", "#d946ef", "#a855f7"],
    fontClass: "font-sans",
    bgClass: "bg-black text-[#f1f5f9] dark",
    cardClass: "bg-zinc-950/60 border border-purple-500/20 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:border-[#ec4899] hover:shadow-[0_0_20px_rgba(236,72,153,0.25)] transition-all duration-300",
    textMuted: "text-purple-300/80",
    textPrimary: "text-white",
    tagClass: "bg-purple-950/40 text-pink-300 border border-pink-500/30 hover:bg-pink-500 hover:text-black transition-all py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-display font-semibold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 border-b border-purple-900 pb-2.5 flex items-center gap-2",
    accentText: "text-pink-400 font-bold",
    accentBg: "bg-purple-950/60 text-pink-300 border border-pink-500/20",
    borderClass: "border-zinc-900",
    buttonClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold",
    layoutType: "standard"
  },
  {
    id: "glassmorphism",
    name: "Celestial Glass",
    desc: "Aura gradient layers coupled with frosted glass panes.",
    colors: ["#312e81", "#06b6d4", "#e0f2fe"],
    fontClass: "font-outfit",
    bgClass: "bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-indigo-950 text-slate-100 dark",
    cardClass: "bg-white/5 dark:bg-slate-950/20 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-6 md:p-8 hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300",
    textMuted: "text-slate-300/90",
    textPrimary: "text-white",
    tagClass: "bg-white/10 text-white border border-white/10 hover:bg-white hover:text-slate-950 transition-all py-1.5 px-4 rounded-full text-xs font-semibold select-none",
    titleClass: "font-outfit font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-300 pb-2 border-b border-white/10 flex items-center gap-2",
    accentText: "text-cyan-300",
    accentBg: "bg-white/5 text-cyan-300 border border-white/10",
    borderClass: "border-white/5",
    buttonClass: "bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold",
    layoutType: "standard"
  },
  {
    id: "corporate_suite",
    name: "Corporate Executive",
    desc: "Double-line navy dividers tailored for enterprise operations.",
    colors: ["#f8fafc", "#1e3a8a", "#0f172a"],
    fontClass: "font-sans",
    bgClass: "bg-[#f8fafc] text-slate-800",
    cardClass: "bg-white border-l-4 border-[#1e40af] p-6 md:p-8 shadow-xs rounded-r-xl border-y border-r border-slate-200/50 hover:shadow-md transition-all duration-300",
    textMuted: "text-slate-550",
    textPrimary: "text-slate-900",
    tagClass: "bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe] hover:bg-[#1e40af] hover:text-white transition-all py-1.5 px-3.5 rounded-lg text-xs font-semibold select-none",
    titleClass: "font-sans font-bold tracking-tight text-[#1e3a8a] border-b-2 border-[#1e3a8a]/25 pb-1 flex items-center gap-2 text-md md:text-lg",
    accentText: "text-[#1d4ed8] font-bold",
    accentBg: "bg-[#eff6ff] text-[#1d4ed8]",
    borderClass: "border-slate-200",
    buttonClass: "bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold",
    layoutType: "two-column"
  },
  {
    id: "minty_forest",
    name: "Nordic Forest",
    desc: "Comforting organic balance utilizing cool sage highlights.",
    colors: ["#f4f7f6", "#047857", "#1d2d25"],
    fontClass: "font-outfit",
    bgClass: "bg-[#f4f7f6] text-[#2c3e35]",
    cardClass: "bg-white border border-[#e2e8e5] shadow-xs rounded-2xl p-6 md:p-8 hover:border-[#10b981]/30 hover:shadow-sm transition-all duration-300",
    textMuted: "text-[#50685c]",
    textPrimary: "text-[#1d2d25]",
    tagClass: "bg-[#ecfdf5] text-[#047857] border border-[#d1fae5] hover:bg-[#047857] hover:text-white transition-all py-1.5 px-3.5 rounded-lg text-xs font-medium select-none",
    titleClass: "font-outfit font-bold text-[#065f46] border-b border-[#e2e8e5] pb-2 flex items-center gap-2",
    accentText: "text-[#059669]",
    accentBg: "bg-[#ecfdf5] text-[#047857]",
    borderClass: "border-[#e2e8e5]",
    buttonClass: "bg-[#047857] hover:bg-[#065f46] text-white font-semibold",
    layoutType: "standard"
  },
  {
    id: "royal_gold",
    name: "Royal Purple",
    desc: "Exquisite visual luxury carrying gold borders and text.",
    colors: ["#0f0a18", "#f59e0b", "#fae8ff"],
    fontClass: "font-serif",
    bgClass: "bg-gradient-to-b from-[#110c1a] to-[#0a0510] text-[#f5f0fa] dark",
    cardClass: "bg-[#1d162a]/90 border border-[#fbbf24]/20 shadow-[0_12px_40px_rgba(251,191,36,0.03)] rounded-2xl p-6 md:p-8 hover:border-amber-400/50 hover:shadow-[0_12px_36px_rgba(251,191,36,0.06)] transition-all duration-300",
    textMuted: "text-purple-300/80",
    textPrimary: "text-purple-50",
    tagClass: "bg-amber-500/10 text-amber-300 border border-amber-400/25 hover:bg-amber-400 hover:text-black transition-all py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-serif italic text-amber-300 border-b border-amber-400/20 pb-2.5 flex items-center gap-2 text-md md:text-lg",
    accentText: "text-amber-300 font-semibold",
    accentBg: "bg-amber-500/5 text-amber-300 border border-amber-500/15",
    borderClass: "border-[#fbbf24]/10",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-black font-extrabold",
    layoutType: "asymmetric"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    desc: "Bold tech-yellow frames, military neon lines, flat shapes.",
    colors: ["#111113", "#fdee0a", "#ffffff"],
    fontClass: "font-mono",
    bgClass: "bg-[#121214] text-[#ececed] font-mono",
    cardClass: "bg-black border-2 border-[#fdee0a] shadow-[4px_4px_0px_#fdee0a] p-6 md:p-8 rounded-none hover:border-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#fdee0a] transition-all",
    textMuted: "text-[#a3a3a3]",
    textPrimary: "text-white",
    tagClass: "bg-zinc-900 text-[#fdee0a] border border-[#fdee0a]/30 hover:bg-[#fdee0a] hover:text-black transition-all py-1.5 px-3 rounded-none text-xs font-bold select-none",
    titleClass: "font-mono font-bold tracking-widest text-[#fdee0a] border-b-2 border-[#fdee0a] pb-2 flex items-center gap-2",
    accentText: "text-[#fdee0a] font-black",
    accentBg: "bg-zinc-900 border border-[#fdee0a]/20 text-[#fdee0a]",
    borderClass: "border-[#fdee0a]/30",
    buttonClass: "bg-[#fdee0a] hover:bg-[#b0a505] text-black font-black uppercase text-xs rounded-none",
    layoutType: "cyber"
  },
  {
    id: "oceanic_breeze",
    name: "Ocean Breeze",
    desc: "Calming sea foam palette, deep teal and airy cyan accents.",
    colors: ["#f0f9ff", "#0ea5e9", "#0c4a6e"],
    fontClass: "font-outfit",
    bgClass: "bg-[#f0f9ff] text-[#0f3443]",
    cardClass: "bg-white border border-[#e0f1fc] shadow-xs rounded-2xl p-6 md:p-8 hover:border-cyan-400 hover:shadow-xs transition-all duration-300",
    textMuted: "text-[#3a5d6a]",
    textPrimary: "text-[#0c2f3c]",
    tagClass: "bg-[#ecfeff] text-[#0891b2] border border-[#cffafe] hover:bg-[#0891b2] hover:text-white transition-all py-1.5 px-3.5 rounded-full text-xs font-medium select-none",
    titleClass: "font-outfit font-extrabold text-[#0e7490] border-b border-[#cffafe] pb-2 flex items-center gap-2",
    accentText: "text-[#0891b2]",
    accentBg: "bg-[#ecfeff] text-[#0891b2]",
    borderClass: "border-[#e0f1fc]",
    buttonClass: "bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold",
    layoutType: "standard"
  },
  {
    id: "warm_terracotta",
    name: "Earthy Terracotta",
    desc: "Warm clay tones, linen organic backgrounds, stylish serif headers.",
    colors: ["#faf5f0", "#c2410c", "#292524"],
    fontClass: "font-serif",
    bgClass: "bg-[#FAF5F0] text-stone-800 font-serif",
    cardClass: "bg-white/70 border border-[#eddcd0] rounded-2xl p-6 md:p-8 hover:border-[#c2410c]/30 hover:bg-white transition-all duration-300",
    textMuted: "text-stone-600",
    textPrimary: "text-stone-900",
    tagClass: "bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5] hover:bg-[#c2410c] hover:text-[#fff7ed] transition-all py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-serif italic text-stone-900 border-b border-[#eeddd0] pb-2 flex items-center gap-2 text-md md:text-lg",
    accentText: "text-[#c2410c] underline decoration-[#ffedd5]",
    accentBg: "bg-[#fff7ed] text-[#c2410c]",
    borderClass: "border-[#eddcd0]",
    buttonClass: "bg-[#c2410c] hover:bg-[#9a3412] text-white font-semibold",
    layoutType: "two-column"
  },
  {
    id: "midnight_slate",
    name: "Midnight Luxury",
    desc: "Charcoal carbon palette with satin lines, premium clean borders.",
    colors: ["#0b0f19", "#6366f1", "#f8fafc"],
    fontClass: "font-sans",
    bgClass: "bg-[#0b0f19] text-[#f1f5f9] dark",
    cardClass: "bg-[#151c2d]/85 border border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 hover:border-[#6366f1]/35 transition-all duration-300",
    textMuted: "text-slate-400",
    textPrimary: "text-white",
    tagClass: "bg-slate-900 text-slate-350 border border-slate-800 hover:bg-[#6366f1] hover:text-white transition-all py-1.5 px-3.5 rounded-xl text-xs font-semibold select-none",
    titleClass: "font-display font-black tracking-tight text-white border-b border-[#1e293b] pb-2.5 flex items-center gap-2",
    accentText: "text-[#818cf8]",
    accentBg: "bg-slate-900 text-[#818cf8] border border-slate-800",
    borderClass: "border-slate-850",
    buttonClass: "bg-indigo-650 hover:bg-indigo-700 text-white font-bold",
    layoutType: "standard"
  },
  {
    id: "clinical_science",
    name: "Clinical Scholar",
    desc: "A clean, calming clinical design with rounded cards and teal borders, ideal for healthcare & doctors.",
    colors: ["#F0FDFA", "#0D9488", "#111827"],
    fontClass: "font-sans",
    bgClass: "bg-[#F0FDFA] text-[#111827] pb-12",
    cardClass: "bg-white border border-[#CCFBF1] shadow-[0_4px_20px_rgba(13,148,136,0.03)] rounded-3xl p-6 md:p-8 hover:border-[#0D9488]/30 hover:shadow-md transition-all duration-300",
    textMuted: "text-[#4B5563]",
    textPrimary: "text-[#111827]",
    tagClass: "bg-[#E6FDF9] text-[#0D9488] border border-[#99F6E4]/70 hover:bg-[#0D9488] hover:text-white transition-all py-1.5 px-3.5 rounded-full text-xs font-semibold select-none",
    titleClass: "font-sans font-bold tracking-tight text-[#0F766E] border-b border-[#CCFBF1] pb-2 flex items-center gap-2 text-md",
    accentText: "text-[#0D9488] font-bold",
    accentBg: "bg-[#E6FDF9] text-[#0D9488]",
    borderClass: "border-[#E6FDF9]",
    buttonClass: "bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl",
    layoutType: "standard"
  },
  {
    id: "finance_executive",
    name: "Executive Gold",
    desc: "Sophisticated dark-slate ink paired with rich amber-gold borders, tailored for management consulting & finance experts.",
    colors: ["#FAF5F0", "#0F172A", "#B45309"],
    fontClass: "font-serif",
    bgClass: "bg-[#FAF5F0] text-[#0F172A] pb-12",
    cardClass: "bg-white border-t-4 border-[#B45309] border-x border-b border-stone-200 shadow-md p-6 md:p-8 hover:shadow-lg transition-all duration-300 rounded-b-xl",
    textMuted: "text-stone-600",
    textPrimary: "text-[#0F172A]",
    tagClass: "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#B45309] hover:text-white transition-all py-1.5 px-3 rounded text-xs font-semibold uppercase tracking-wider font-mono select-none",
    titleClass: "font-display font-black uppercase text-[#1E293B] border-b-2 border-stone-300 pb-2.5 flex items-center gap-2 text-sm",
    accentText: "text-[#B45309] font-bold",
    accentBg: "bg-[#FEF3C7] text-[#B45309]",
    borderClass: "border-stone-200",
    buttonClass: "bg-[#0F172A] hover:bg-neutral-800 text-[#FEF3C7] rounded-none tracking-widest font-bold uppercase",
    layoutType: "two-column"
  },
  {
    id: "creative_gallery",
    name: "Studio Portfolio",
    desc: "A bold, high-contrast flat layout featuring bright peach canvases and raw solid borders, designed for UX, design, and architecture.",
    colors: ["#FFF7ED", "#EA580C", "#1A1A1A"],
    fontClass: "font-bricolage",
    bgClass: "bg-[#FFF7ED] text-[#1A1A1A] pb-12",
    cardClass: "bg-white border-2 border-black shadow-[4px_4px_0px_#000000] rounded-none p-6 md:p-8 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#000000] transition-all duration-200",
    textMuted: "text-[#525252]",
    textPrimary: "text-black",
    tagClass: "bg-[#FEF2F2] text-[#991B1B] border-2 border-black hover:bg-black hover:text-white transition-all py-1 px-3 rounded-none text-xs font-bold uppercase tracking-tight select-none",
    titleClass: "font-bricolage font-black uppercase tracking-tight text-black border-b-2 border-black pb-2 flex items-center gap-2 text-sm",
    accentText: "text-[#EA580C] font-black italic",
    accentBg: "bg-[#FFF7ED] border border-black text-black",
    borderClass: "border-black",
    buttonClass: "bg-[#EA580C] hover:bg-black hover:text-white border-2 border-black text-white font-extrabold rounded-none px-4 py-2 text-xs transition-colors",
    layoutType: "asymmetric"
  },
  {
    id: "biotech_research",
    name: "Bioinfomatics Lab",
    desc: "High-density scientific journal theme with structured micro-tables and cool emerald borders for academics / researchers.",
    colors: ["#F4FBF7", "#16A34A", "#1E293B"],
    fontClass: "font-mono",
    bgClass: "bg-[#F4FBF7] text-[#1E293B] pb-12",
    cardClass: "bg-white border border-[#D1FAE5] card-stack-shadow p-6 md:p-8 rounded-lg hover:border-[#16A34A]/40 transition-all duration-300",
    textMuted: "text-[#4B5563]",
    textPrimary: "text-[#1E293B]",
    tagClass: "bg-emerald-50 text-emerald-850 border border-emerald-200/50 hover:bg-emerald-800 hover:text-white transition-all py-1 px-2.5 rounded text-[10px] uppercase font-mono font-bold select-none",
    titleClass: "font-mono font-bold text-emerald-900 border-b border-dashed border-emerald-250 pb-2 flex items-center gap-2 text-xs",
    accentText: "text-emerald-700 font-bold font-mono",
    accentBg: "bg-emerald-50 text-emerald-700",
    borderClass: "border-emerald-100",
    buttonClass: "bg-emerald-900 hover:bg-emerald-950 text-white font-mono px-4 py-2 text-xs rounded",
    layoutType: "standard"
  }
];

export default function LivePortfolio({ usernameParam, loggedInUsername, hideGallery = true }: LivePortfolioProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>("clean_academic");
  
  // Custom states matching requirements
  const [viewMode, setViewMode] = useState<"a4" | "web">("web");
  const [containerWidth, setContainerWidth] = useState<number>(850);
  const [showGallery, setShowGallery] = useState<boolean>(!hideGallery);
  const [savingTheme, setSavingTheme] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // References
  const paperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch(`/api/portfolios/${usernameParam}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("PORTFOLIO_NOT_FOUND");
        }
        throw new Error(`API returned standard error status: ${response.status}`);
      }
      const data = await response.json();
      setPortfolio(data);
      if (data.theme) {
        setActiveTheme(data.theme);
      } else {
        setActiveTheme("light");
      }
    } catch (err: any) {
      console.error("Fetch portfolio error:", err);
      if (err.message === "PORTFOLIO_NOT_FOUND") {
        setErrorText("NOT_FOUND");
      } else {
        setErrorText("CRASH");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usernameParam) {
      fetchPortfolio();
    }
  }, [usernameParam]);

  // Handle resizing for A4 paper responsive scale factor
  useEffect(() => {
    if (viewMode === "a4") {
      const handleResize = () => {
        const el = document.getElementById("a4-measurement-wrapper");
        if (el) {
          setContainerWidth(el.getBoundingClientRect().width);
        } else if (containerRef.current) {
          setContainerWidth(containerRef.current.getBoundingClientRect().width);
        }
      };
      
      // Delay slightly to allow transitions/dom layouts to settle
      const timeout = setTimeout(handleResize, 100);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(timeout);
      };
    }
  }, [viewMode, showGallery]);

  const handlePrint = () => {
    window.print();
  };

  // If the owner switches a template, persist it directly to the dashboard's backend instantly as the publication standard!
  const isOwner = !!(loggedInUsername && loggedInUsername.trim().toLowerCase() === usernameParam.trim().toLowerCase());

  const handleTemplateSelect = async (templateId: string) => {
    setActiveTheme(templateId);
    if (isOwner) {
      setSavingTheme(true);
      setSaveSuccess(null);
      try {
        const res = await fetch("/api/portfolio", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${loggedInUsername}`
          },
          body: JSON.stringify({
            ...portfolio,
            theme: templateId
          })
        });
        if (res.ok) {
          setSaveSuccess("Changes published live!");
          setTimeout(() => setSaveSuccess(null), 3000);
          // Update local state
          if (portfolio) {
            setPortfolio({ ...portfolio, theme: templateId });
          }
        }
      } catch (err) {
        console.warn("Could not save theme preference on backend:", err);
      } finally {
        setSavingTheme(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center gap-3">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm animate-pulse">Loading elegant candidate portfolio...</p>
      </div>
    );
  }

  if (errorText === "NOT_FOUND") {
    return (
      <div className="max-w-md mx-auto my-12 border border-slate-200 bg-white rounded-2xl shadow-xs p-8 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="font-display font-bold text-slate-800 text-xl mb-2">Portfolio Not Found</h2>
        <p className="text-slate-500 text-xs leading-relaxed mb-6">
          The username <strong className="text-slate-900 font-semibold font-mono">@{usernameParam}</strong> is currently available! Sign in to the developer console to claim this username and publish your live website page.
        </p>
        <div className="flex flex-col gap-3">
          <a
            id="register_now_404_btn"
            href="#/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl block transition-all shadow-xs"
          >
            Claim Username Now
          </a>
          <a
            id="back_home_404_btn"
            href="#/"
            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:bg-slate-50 py-2 rounded-xl transition-all"
          >
            Go Back to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (errorText === "CRASH" || !portfolio) {
    return (
      <div className="max-w-md mx-auto my-12 border border-rose-100 bg-rose-50/20 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-rose-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ServerCrash className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="font-display font-bold text-rose-900 text-lg mb-2">Connection Issues</h2>
        <p className="text-rose-700/80 text-xs mb-6 leading-relaxed">
          The backend API could not be reached to stream this profile. Ensure your local server is running and active.
        </p>
        <div className="flex flex-col gap-3">
          <button
            id="retry_fetch_param_btn"
            onClick={fetchPortfolio}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer border-0"
          >
            Check and Retry Fetch
          </button>
          <a
            id="back_home_crash_btn"
            href="#/"
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold hover:bg-rose-50 py-2 rounded-xl transition-all"
          >
            Go Back to Homepage Directory
          </a>
        </div>
      </div>
    );
  }

  // Retrieve active template configuration (falls back to minimalist light)
  const cur: TemplateConfig = PREMIUM_TEMPLATES.find((t) => t.id === activeTheme) || PREMIUM_TEMPLATES[0];

  const sectionsOrder = portfolio.sectionsOrder || ["experiences", "projects", "socialLinks"];

  // Helper parsing to aggregate tech stack into general tags
  const getTechSkills = () => {
    if (portfolio.skills && portfolio.skills.trim().length > 0) {
      return portfolio.skills
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    const extracted = (portfolio.projects || [])
      .map((p) => p.techStack)
      .filter((t): t is string => !!t)
      .flatMap((t) => t.split(","))
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    
    const unique = Array.from(new Set(extracted));
    if (unique.length > 0) {
      return unique;
    }
    return ["Python", "Pandas", "NumPy", "Scikit‑learn", "TensorFlow", "PyTorch", "SQL", "BigQuery", "Tableau", "Flask", "Docker", "Git", "AWS", "Spark"];
  };

  const interactiveSkills = getTechSkills();

  // Color matching generator for interactive skills tag indicators
  const getTagColorIndicator = (index: number) => {
    const list = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-teal-500", "bg-violet-500", "bg-cyan-500"];
    return list[index % list.length];
  };

  // Helper renders
  const renderAbout = () => (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`${cur.cardClass} relative overflow-hidden`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${cur.accentBg}`}>
          <User className="w-4.5 h-4.5" />
        </div>
        <h2 className={cur.titleClass}>About</h2>
      </div>
      <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans opacity-95 ${cur.textMuted}`}>
        {portfolio.bio || "I'm a Data Scientist with 4+ years of experience turning messy data into actionable insights."}
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-dashed border-slate-200/50 dark:border-slate-800/80 print:hidden justify-between w-full">
        {portfolio.cvUrl ? (
          <a
            id="live_download_cv_action"
            href={portfolio.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all transform hover:scale-102 cursor-pointer ${cur.buttonClass}`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download CV (PDF)</span>
          </a>
        ) : (
          <span className="text-slate-400 text-[11px] font-mono font-bold">No external CV registered.</span>
        )}

        <button
          id="live_print_resume_action"
          onClick={handlePrint}
          type="button"
          className="inline-flex items-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-705"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Spec Blueprint</span>
        </button>

        {isOwner ? (
          <a
            href="#/dashboard"
            className="text-[11px] font-bold flex items-center gap-1 opacity-80 hover:opacity-100 underline print:hidden bg-indigo-505/10 text-indigo-600 dark:text-indigo-400 font-mono"
          >
            <span>Edit Mode Panel &larr;</span>
          </a>
        ) : (
          <a
            id="create_own_portfolio_btn_bottom"
            href="#/"
            className="text-[11px] font-bold underline print:hidden font-mono"
          >
            <span>Claim Handle &rarr;</span>
          </a>
        )}
      </div>
    </motion.section>
  );

  const renderExperiences = () => {
    const list = portfolio.experiences || [];
    if (list.length === 0) return null;

    return (
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        id="portfolio_experiences_section" 
        className={cur.cardClass}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${cur.accentBg}`}>
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <h2 className={cur.titleClass}>Professional Experience</h2>
        </div>
        
        <div className="relative pl-5 border-l border-slate-200 dark:border-slate-800 ml-1.5 space-y-7">
          {list.map((exp, idx) => (
            <div 
              id={`portfolio_exp_card_${exp.id}`} 
              key={exp.id} 
              className="relative group cursor-default"
            >
              <span className={`absolute -left-[26px] top-1.5 w-2 h-2 rounded-full transition-all duration-300 ${
                activeTheme === 'cyber' || activeTheme === 'cyberpunk'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                  : activeTheme === 'slate'
                    ? 'bg-black' 
                    : activeTheme === 'dark' 
                      ? 'bg-sky-400' 
                      : 'bg-indigo-650'
              }`} />
              
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1 mb-1">
                <div>
                  <h3 className={`font-semibold text-xs md:text-sm ${cur.textPrimary}`}>{exp.role}</h3>
                  <div className={`text-[11px] font-bold ${cur.accentText}`}>
                    {exp.company}
                  </div>
                </div>
                <div className={`text-[10px] uppercase tracking-wide font-mono ${cur.textMuted}`}>
                  {exp.startDate} &mdash; {exp.endDate || "Present"}
                </div>
              </div>
              
              <p className={`text-xs leading-relaxed mt-2 whitespace-pre-wrap font-sans opacity-90 ${cur.textMuted}`}>
                {exp.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
    );
  };

  const renderProjects = () => {
    const list = portfolio.projects || [];
    if (list.length === 0) return null;

    return (
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        id="portfolio_projects_section" 
        className={cur.cardClass}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${cur.accentBg}`}>
            <Rocket className="w-4.5 h-4.5 transform rotate-45" />
          </div>
          <h2 className={cur.titleClass}>Projects & Accomplishments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((proj) => (
            <ProjectCard
              key={proj.id}
              proj={proj}
              theme={activeTheme}
              cardClass={
                activeTheme === "cyber" || activeTheme === "cyberpunk" || activeTheme === "slate"
                  ? "bg-black/30 border-2 border-current p-4 rounded-none h-full transition-all"
                  : "p-4 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-205/50 dark:border-slate-800 rounded-xl h-full transition-all hover:border-current"
              }
              textMutedClass="text-xs opacity-80"
            />
          ))}
        </div>
      </motion.section>
    );
  };

  const renderSocialLinks = () => {
    const list = portfolio.socialLinks || [];
    if (list.length === 0) return null;

    return (
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        id="portfolio_social_section" 
        className={cur.cardClass}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${cur.accentBg}`}>
            <Link2 className="w-4.5 h-4.5" />
          </div>
          <h2 className={cur.titleClass}>Social Channels & Networks</h2>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {list.map((soc) => (
            <a
              id={`portfolio_soc_pill_${soc.id}`}
              key={soc.id}
              href={soc.url}
              target={soc.url && soc.url.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border rounded-xl transition-all hover:scale-103 ${
                activeTheme === 'cyber' || activeTheme === 'cyberpunk'
                  ? 'border-emerald-500/50 bg-[#090d16] text-emerald-400 hover:bg-emerald-500 hover:text-black' 
                  : activeTheme === 'slate' 
                    ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white' 
                    : activeTheme === 'dark'
                      ? 'border-slate-800 bg-slate-905 text-slate-300 hover:text-sky-400'
                      : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
              }`}
            >
              <div className="shrink-0 text-current">{getSocialIcon(soc.platform)}</div>
              <span className="font-mono text-[11px]">{getSocialIconLabel(soc.platform)}</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </a>
          ))}
        </div>
      </motion.section>
    );
  };

  const renderSkills = () => (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cur.cardClass}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${cur.accentBg}`}>
          <Code className="w-4.5 h-4.5" />
        </div>
        <h2 className={cur.titleClass}>Technical Skills Catalog</h2>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {interactiveSkills.map((tag, i) => (
          <span
            key={i}
            className={`${cur.tagClass} inline-flex items-center gap-1.5`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getTagColorIndicator(i)}`} />
            <span>{tag}</span>
          </span>
        ))}
      </div>
    </motion.section>
  );

  const renderEducation = () => (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cur.cardClass}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${cur.accentBg}`}>
          <GraduationCap className="w-4.5 h-4.5" />
        </div>
        <h2 className={cur.titleClass}>Education Background</h2>
      </div>
      <div className="space-y-4">
        <div className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-800">
          <h4 className={`font-semibold text-xs md:text-sm ${cur.textPrimary}`}>
            M.Sc. in Data Science
          </h4>
          <p className={`text-[11px] font-medium opacity-85 mt-0.5 ${cur.accentText}`}>
            Indian Institute of Technology, Bombay · 2018 – 2020 · CGPA 8.7
          </p>
        </div>
        <div className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-800">
          <h4 className={`font-semibold text-xs md:text-sm ${cur.textPrimary}`}>
            B.E. in Computer Science
          </h4>
          <p className={`text-[11px] font-medium opacity-85 mt-0.5 ${cur.accentText}`}>
            Delhi University · 2014 – 2018 · CGPA 8.2
          </p>
        </div>
      </div>
    </motion.section>
  );

  const renderSectionDispatcher = (secName: string) => {
    switch (secName) {
      case "experiences":
        return <React.Fragment key="experiences">{renderExperiences()}</React.Fragment>;
      case "projects":
        return <React.Fragment key="projects">{renderProjects()}</React.Fragment>;
      case "socialLinks":
        return <React.Fragment key="socialLinks">{renderSocialLinks()}</React.Fragment>;
      default:
        return null;
    }
  };

  // Master layout rendering options:
  const renderMasterLayoutContent = () => {
    if (cur.layoutType === "two-column") {
      // Split Academic / Terracotta Layout
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column / Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex flex-col items-center text-center bg-slate-500/5 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              {portfolio.photoURL ? (
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-slate-300">
                  <img src={portfolio.photoURL} alt={portfolio.displayName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-250 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold mb-4">
                  {portfolio.displayName?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className={`font-bold text-base ${cur.textPrimary}`}>{portfolio.displayName}</h2>
              <p className={`text-[11px] opacity-75 uppercase tracking-wide font-medium ${cur.accentText}`}>{portfolio.tagline}</p>
            </div>
            
            {renderAbout()}
            {renderSkills()}
            {renderSocialLinks()}
          </div>

          {/* Right Column / Narrative chronological list */}
          <div className="lg:col-span-8 space-y-6">
            {renderExperiences()}
            {renderProjects()}
            {renderEducation()}
          </div>
        </div>
      );
    }

    if (cur.layoutType === "asymmetric") {
      // Modern creative staggered frames
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4">
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-stone-100 text-stone-700 font-bold ${cur.accentText}`}>Candidate Profile Blueprint</span>
              <h1 className={`text-4xl font-extrabold tracking-tighter ${cur.textPrimary}`}>{portfolio.displayName}</h1>
              <p className={`text-xs md:text-sm font-semibold opacity-75 leading-relaxed ${cur.textMuted}`}>{portfolio.tagline || portfolio.bio?.split(".")[0]}</p>
            </div>
            <div className="md:col-span-4 flex justify-center">
              {portfolio.photoURL && (
                <img src={portfolio.photoURL} alt={portfolio.displayName} className="w-28 h-28 rounded-3xl rotate-2 hover:rotate-0 transition-transform object-cover shadow-sm border" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {renderAbout()}
              {renderExperiences()}
            </div>
            <div className="space-y-6">
              {renderSkills()}
              {renderEducation()}
              {renderSocialLinks()}
            </div>
          </div>
          {renderProjects()}
        </div>
      );
    }

    // Default continuous column flow "standard" or "cyber"
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Visual Hero unit */}
        <div className="text-center py-6 flex flex-col items-center">
          {portfolio.photoURL ? (
            <div className={`w-28 h-28 rounded-full overflow-hidden mb-5 border-4 transition-transform shadow-xl ${activeTheme === 'cyber' || activeTheme === 'cyberpunk' ? 'border-emerald-500 rounded-none' : 'border-indigo-600'}`}>
              <img src={portfolio.photoURL} alt={portfolio.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-indigo-50 text-indigo-700 font-bold text-3xl flex items-center justify-center mb-5 uppercase">
              {portfolio.displayName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight mb-1 ${cur.textPrimary}`}>{portfolio.displayName}</h1>
          <p className={`text-xs font-mono tracking-wide uppercase opacity-75 font-bold ${cur.accentText}`}>{portfolio.tagline || "Professional Candidate"}</p>
        </div>

        {renderAbout()}
        {sectionsOrder.map((name) => renderSectionDispatcher(name))}
        {renderSkills()}
        {renderEducation()}
      </div>
    );
  };

  // Sizing standard ratios for printing A4 (210mm x 297mm)
  const a4BaseWidth = 794; 
  const currentScale = Math.min((containerWidth - 32) / a4BaseWidth, 1.0);

  return (
    <div className={`min-h-screen ${cur.bgClass} ${cur.fontClass} pb-20 relative transition-colors duration-400 select-none`}>
      
      {/* Dynamic Ambient Blobs for Glassmorphism & Sunset styles */}
      {activeTheme === "glassmorphism" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-sky-500/20 blur-[130px] rounded-full" />
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/20 blur-[140px] rounded-full" />
        </div>
      )}
      {activeTheme === "sunset" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] left-[5%] w-[450px] h-[450px] bg-amber-500/10 blur-[130px] rounded-full" />
        </div>
      )}

      {/* Floating Interactive Recruitment Workspace Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-205 dark:border-slate-800 py-3 px-4 print:hidden shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center justify-between md:justify-start gap-4">
            <a
              id="back_to_directory_top_bar"
              href="#/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-705 border transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog Directory</span>
            </a>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode("web")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "web"
                    ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <MonitorSmartphone className="inline w-3.5 h-3.5 mr-1" />
                Adaptive Web View
              </button>
              <button
                onClick={() => setViewMode("a4")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "a4"
                    ? "bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="inline w-3.5 h-3.5 mr-1" />
                Paper A4 View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            {!hideGallery && (
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center gap-1"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>{showGallery ? "Hide Style Gallery" : "Browse 15 Premium Templates"}</span>
                {showGallery ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {isOwner && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                ✓ OWNER LIVE STREAMING
              </span>
            )}
          </div>

        </div>
      </div>

      {/* RENDER DYNAMIC EXPANDABLE TEMPLATE GALLERY */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 dark:bg-zinc-950 dark:border-slate-800/80 py-6 px-4 print:hidden overflow-hidden"
          >
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-450 dark:text-slate-500 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Selected Skin: {cur.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click any template to live-rebuild layout structures, typography pairings, and responsive styling patterns immediately.</p>
                </div>
                {saveSuccess && (
                  <div className="bg-emerald-550 text-emerald-800 px-3 py-1 rounded-xl text-[10px] font-bold animate-pulse flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{saveSuccess}</span>
                  </div>
                )}
              </div>

              {/* Template grid with light options */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-8 gap-3">
                {PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id)).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all hover:scale-103 cursor-pointer ${
                      activeTheme === t.id
                        ? "bg-white dark:bg-zinc-900 border-indigo-600 dark:border-sky-500 ring-2 ring-indigo-600/10"
                        : "bg-white/50 dark:bg-zinc-900/50 border-slate-200/60 hover:bg-white"
                    }`}
                  >
                    {/* Visual representative pill colors */}
                    <div className="flex gap-1 mb-2">
                      {t.colors.map((c, idx) => (
                        <div key={idx} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5 font-mono">{t.layoutType} layout</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER STREAM */}
      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 relative z-10" ref={containerRef}>
        
        {/* VIEW 1: FULL ADAPTIVE WEB VIEW */}
        {viewMode === "web" && (
          <motion.div
            key="web-root-stream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-8 animate-fade-in"
          >
            {renderMasterLayoutContent()}
          </motion.div>
        )}

        {/* VIEW 2: HIGH-FIDELITY CENTERED A4 SIZE PAPER VIEW */}
        {viewMode === "a4" && (
          <div className="flex flex-col items-center">
            
            {/* Action Leaflet */}
            <div className="max-w-3xl text-center mb-6 space-y-1.5 print:hidden">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-bold">
                <Printer className="w-3.5 h-3.5" />
                A4 Printable Simulator Mode Active
              </span>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                This physical page mockup scales dynamically to maintain a standard 210mm × 297mm print aspect ratio on screen. Perfect for reviewing PDF layouts and resume line boundaries before printing!
              </p>
            </div>

            {/* A4 responsive outer canvas with grid dots */}
            <div 
              id="a4-measurement-wrapper"
              className="w-full max-w-4xl bg-slate-500/5 dark:bg-zinc-950/20 rounded-3xl p-6 md:p-12 border border-[#e2e8f0]/40 backdrop-blur-md flex justify-center items-start overflow-hidden relative"
              style={{
                minHeight: "1150px"
              }}
            >
              {/* Scaled resume page parent container */}
              <div 
                className="transition-all duration-300 relative shadow-2xl bg-white border border-slate-200 dark:border-zinc-800 text-slate-900 rounded-none bg-inherit text-inherit"
                style={{
                  width: `${a4BaseWidth}px`,
                  minHeight: "1123px",
                  transform: `scale(${currentScale})`,
                  transformOrigin: "top center",
                }}
              >
                {/* Embedded paper-padding container designed for beautiful prints */}
                <div ref={paperRef} className="p-8 md:p-12 text-left bg-transparent text-inherit">
                  {renderMasterLayoutContent()}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
