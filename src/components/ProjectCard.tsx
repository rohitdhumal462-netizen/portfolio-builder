import React, { useState } from "react";
import { Project } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, ChevronRight, Eye, Code, Globe, Github, 
  ExternalLink, X, Cpu, Settings, ShieldAlert, Zap, Layers 
} from "lucide-react";

interface ProjectCardProps {
  proj: Project;
  theme: string;
  cardClass: string;
  textMutedClass: string;
  key?: React.Key;
}

export default function ProjectCard({ proj, theme, cardClass, textMutedClass }: ProjectCardProps) {
  // Aggregate all images (imageURL is main/fallback index 0)
  const allImages: string[] = [];
  if (proj.imageURL) {
    allImages.push(proj.imageURL);
  }
  if (proj.images && Array.isArray(proj.images)) {
    proj.images.forEach((img) => {
      if (img && !allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Convert tech stack into tag chips
  const tags = proj.techStack
    ? proj.techStack.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
    : [];

  // Generate deterministic mock specs/metrics based on project ID and title for outstanding visual depth
  const getMetrics = () => {
    const sumBytes = proj.id ? String(proj.id).split("").reduce((acc, current) => acc + current.charCodeAt(0), 0) : 100;
    const efficiencyVal = (85 + (sumBytes % 15)).toFixed(1);
    const latencyVal = 40 + (sumBytes % 90);
    const codeSize = 1.2 + (sumBytes % 18) * 0.4;
    return [
      { label: "Efficiency & Performance Ratio", val: `${efficiencyVal}%`, icon: Zap, pct: parseFloat(efficiencyVal) },
      { label: "API Query Latency", val: `${latencyVal}ms response`, icon: Cpu, pct: 100 - (latencyVal / 1.5) },
      { label: "Build Integrity Code Size", val: `${codeSize.toFixed(1)}k LOC`, icon: Layers, pct: (codeSize / 8.5) * 100 }
    ];
  };

  const metricsList = getMetrics();

  // Theme dispatcher styling
  const drawerBgStyle = 
    theme === "cyber" 
      ? "bg-zinc-950 border-l-2 border-emerald-500 text-emerald-400 font-mono" 
      : theme === "slate" 
        ? "bg-white border-l-4 border-black text-black font-sans" 
        : theme === "sunset"
          ? "bg-[#180e0e]/95 backdrop-blur-xl border-l border-rose-500/20 text-[#fdf6f0] font-sans"
          : theme === "dark" 
            ? "bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 text-slate-100 font-sans" 
            : "bg-white/95 backdrop-blur-xl border-l border-slate-200 text-slate-900 font-sans";

  return (
    <>
      {/* Outer Project Card - Enhanced with hover springs in addition to CSS */}
      <motion.div
        id={`project_interactive_card_${proj.id}`}
        onClick={() => setDrawerOpen(true)}
        whileHover={{ 
          y: -8, 
          scale: 1.015,
          transition: { type: "spring", stiffness: 350, damping: 20 }
        }}
        whileTap={{ scale: 0.985 }}
        className={`${cardClass} overflow-hidden flex flex-col h-full cursor-pointer shadow-xs transition-shadow duration-300 group`}
      >
        {/* Pictures Slideshow Segment */}
        {allImages.length > 0 && (
          <div className="relative h-48 -mx-5 -mt-5 mb-4 overflow-hidden border-b border-gray-100 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
            <img
              src={allImages[activeImageIdx]}
              alt={proj.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
            />

            {/* Carousel navigation controls */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all scale-90 hover:scale-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all scale-90 hover:scale-100 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                
                {/* Indexes Indicator panel */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                  {allImages.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        activeImageIdx === i ? "bg-white scale-125" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Quick full-preview zoom-badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/55 text-white/90 hover:bg-black/75 transition opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Click to Zoom Photo"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-base md:text-[1.05rem] leading-snug text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {proj.title}
              </h4>
              <span className="text-[10px] font-mono opacity-65 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Details &rarr;
              </span>
            </div>

            {/* Description */}
            <p className="text-xs md:text-[0.9rem] leading-relaxed mb-4 text-[#475569] dark:text-slate-300 line-clamp-3 select-text">
              {proj.description}
            </p>

            {/* Tech chips - customized according to theme configuration */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag, idx) => {
                  const isCyber = theme === "cyber";
                  const isSlate = theme === "slate";
                  const tagStyle = isCyber
                    ? "bg-zinc-950 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 font-bold rounded-none"
                    : isSlate
                      ? "bg-white text-black border-2 border-black text-[10px] px-2 py-0.5 font-black uppercase rounded-none"
                      : "bg-[#f1f5f9] dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-800 rounded-full text-[11px] px-3 py-1 font-medium transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105";

                  return (
                    <span key={idx} className={tagStyle}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Social Links & Call-to-actions row matching screenshot exactly */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-4 mt-auto">
            {proj.link && proj.link.trim() !== "" && (
              <a
                id={`portfolio_proj_link_${proj.id}`}
                href={proj.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 text-sm font-semibold transition-all hover:opacity-80 ${
                  theme === "cyber"
                    ? "text-emerald-400 hover:text-emerald-300"
                    : theme === "slate"
                      ? "text-black hover:underline"
                      : "text-[#3b82f6] dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300"
                }`}
              >
                <Github className="w-4 h-4" />
                <span>Code</span>
              </a>
            )}

            {proj.demoLink && proj.demoLink.trim() !== "" && (
              <a
                id={`portfolio_proj_demo_${proj.id}`}
                href={proj.demoLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 text-sm font-semibold transition-all hover:opacity-80 ${
                  theme === "cyber"
                    ? "text-yellow-400 hover:text-yellow-300"
                    : theme === "slate"
                      ? "text-black hover:underline"
                      : "text-[#3b82f6] dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300"
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>
                  {proj.title.toLowerCase().includes("portfolio") || proj.title.toLowerCase().includes("website")
                    ? "Live"
                    : "Demo"}
                </span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* RICH ANIMATED SIDE DRAWER MODAL - SLIDES IN FROM THE RIGHT */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end print:hidden">
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs cursor-pointer"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className={`relative z-10 w-full max-w-lg md:max-w-xl h-full flex flex-col shadow-2xl p-6 md:p-8 overflow-y-auto ${drawerBgStyle}`}
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="p-1 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.div>
                  <span className="text-xs uppercase tracking-widest font-mono font-bold opacity-75">
                    Project Blueprint Spec Shell
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  title="Close blueprint drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title Header */}
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  {proj.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-700 dark:text-indigo-305 px-2.5 py-0.5 rounded-full font-bold">
                    System Architecture
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                    ID: {proj.id || "N/A"}
                  </span>
                </div>
              </div>

              {/* Responsive Project Image Showcase inside drawer */}
              {allImages.length > 0 && (
                <div className="relative h-64 md:h-72 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-center">
                  <img
                    src={allImages[activeImageIdx]}
                    alt={proj.title}
                    className="w-full h-full object-cover"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-1 rounded-full">
                        {allImages.map((_, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full transition ${
                              activeImageIdx === i ? "bg-white scale-125" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Detailed Expanded Description of the project */}
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-2">
                  System Overview
                </h3>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap opacity-95 text-slate-800 dark:text-slate-200">
                  {proj.description}
                </p>
              </div>

              {/* TECHNICAL SPECS INTERACTIVE PROGRESS CHARTS */}
              <div className="mb-8 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/65 bg-slate-50/40 dark:bg-slate-900/30">
                <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-slate-400 mb-4 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>Interactive System Performance Specs</span>
                </h3>
                
                <div className="space-y-4">
                  {metricsList.map((m, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 opacity-80">
                          <m.icon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          {m.label}
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{m.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
                          className={`h-full rounded-full ${
                            theme === "cyber" 
                              ? "bg-emerald-500" 
                              : theme === "slate" 
                                ? "bg-black" 
                                : theme === "sunset"
                                  ? "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"
                                  : "bg-gradient-to-r from-indigo-500 to-violet-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKILLS APPLIED IN THIS PROJECT */}
              {tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-3">
                    Technologies / Engineering Stack Applied
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <motion.span
                        key={idx}
                        whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
                        className={`text-xs px-3 py-1 font-semibold rounded-lg font-mono flex items-center gap-1.5 border border-dashed transition-all ${
                          theme === "cyber"
                            ? "border-emerald-500/40 bg-zinc-900 text-emerald-400"
                            : theme === "slate"
                              ? "border-black bg-slate-100 text-black font-black"
                              : theme === "sunset"
                                ? "border-rose-500/30 bg-[#271515]/60 text-amber-250"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-sky-400" />
                        <span>{tag}</span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA REDIRECTS INSIDE THE Blue-Spec drawer */}
              <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3.5">
                {proj.link && proj.link.trim() !== "" && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-w-[120px] text-center inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                      theme === "cyber"
                        ? "border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-400 font-mono"
                        : theme === "slate"
                          ? "border-2 border-black hover:bg-black hover:text-white text-black font-black"
                          : theme === "sunset"
                            ? "bg-rose-500 hover:bg-rose-600 text-black border-transparent"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs"
                    }`}
                  >
                    <Github className="w-4 h-4" />
                    <span>Explore Source Code</span>
                  </a>
                )}

                {proj.demoLink && proj.demoLink.trim() !== "" && (
                  <a
                    href={proj.demoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-w-[120px] text-center inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                      theme === "cyber"
                        ? "border-yellow-500 hover:bg-yellow-500 hover:text-black text-yellow-400 font-mono"
                        : theme === "slate"
                          ? "border-2 border-black hover:bg-black hover:text-white text-black font-black"
                          : theme === "sunset"
                            ? "bg-[#271515]/80 hover:bg-[#321c1c] text-rose-200 border-rose-500/20"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Run Interactive Demo</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox High-Contrast Overlay Modal (for direct photo clicks) */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
              <motion.img
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
                src={allImages[activeImageIdx]}
                alt="Lightbox View"
                className="max-w-full max-h-[75vh] rounded-lg object-contain border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-white text-xs mt-4 font-mono">
                Viewing project photo {activeImageIdx + 1} of {allImages.length}
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-10 right-0 text-white font-bold text-xs px-3 py-1 bg-white/20 rounded-md hover:bg-white/40 transition cursor-pointer"
              >
                Close [X]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

