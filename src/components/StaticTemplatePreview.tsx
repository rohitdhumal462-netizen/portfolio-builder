import React, { useState } from "react";
import { motion } from "motion/react";
import { Experience, Project, SocialLink, Portfolio } from "../types";
import { 
  Briefcase, FolderGit2, Code, Mail, Github, Linkedin, Twitter, Globe, Sparkles, ExternalLink, Printer
} from "lucide-react";
import { TemplateConfig } from "./LivePortfolio";

interface StaticTemplatePreviewProps {
  template: TemplateConfig;
  portfolio: Portfolio;
  loggedInUsername?: string;
  focusedField?: string | null;
  onSectionClick?: (tabId: string) => void;
}

const DEMO_DEVELOPER = {
  displayName: "Alex Rivera",
  tagline: "Lead Full-Stack Architect · Open Source Contributor",
  bio: "Designing high-performance distributed systems, accessible user interfaces, and open-source bundlers trusted by millions of developers globally. Focused on terminal latency, serverless architectures, and pristine interface craftsmanship.",
  photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  skills: "TypeScript, React, Next.js, Rust, Go, WebAssembly, Docker, PostgreSQL, Tailwind CSS",
  experiences: [
    {
      id: "demo-e1",
      role: "Lead Full-Stack Architect",
      company: "Vercel",
      startDate: "2024",
      endDate: "Present",
      description: "Crafting optimized performance primitives and next-generation hot bundlers. Leading design system standardizations across global edges.",
      order: 1
    },
    {
      id: "demo-e2",
      role: "Senior UI Engineer",
      company: "Stripe",
      startDate: "2021",
      endDate: "2024",
      description: "Spearheaded modular checkout sheet architectures, reducing load overhead by 28% and modernizing multi-currency localizations.",
      order: 2
    }
  ] as Experience[],
  projects: [
    {
      id: "demo-p1",
      title: "Solstice Compiler",
      description: "Ultra-fast Next-Gen reactivity compiler library written in Rust and WebAssembly, hot-refreshing files in under 3 milliseconds.",
      techStack: "WebAssembly, Rust, TypeScript",
      link: "https://github.com",
      imageURL: "",
      order: 1
    },
    {
      id: "demo-p2",
      title: "Vivid Analytics",
      description: "Exquisite visual dashboard engine processing telemetry streams of 200,000+ events per second with zero browser hitching.",
      techStack: "React, ClickHouse, Tailwind CSS",
      link: "https://github.com",
      imageURL: "",
      order: 2
    }
  ] as Project[],
  socialLinks: [
    { id: "demo-s1", platform: "GitHub", url: "https://github.com", order: 1 },
    { id: "demo-s2", platform: "LinkedIn", url: "https://linkedin.com", order: 2 },
    { id: "demo-s3", platform: "Twitter", url: "https://twitter.com", order: 3 },
    { id: "demo-s4", platform: "Email", url: "mailto:alex@example.com", order: 4 }
  ] as SocialLink[]
};

export default function StaticTemplatePreview({ 
  template, 
  portfolio, 
  loggedInUsername,
  focusedField = null,
  onSectionClick
}: StaticTemplatePreviewProps) {
  const [viewSource, setViewSource] = useState<"demo" | "mine">("mine");
  const scale: number = 55; // Lock at an elegant, compact, and fixed 55% scale

  const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

  // Determine active profile content
  const activeProfile = viewSource === "mine" ? portfolio : {
    username: "alexrivera",
    displayName: DEMO_DEVELOPER.displayName,
    bio: DEMO_DEVELOPER.bio,
    photoURL: DEMO_DEVELOPER.photoURL,
    theme: template.id,
    sectionsOrder: ["experiences", "projects"],
    ownerId: "demo-owner",
    cvUrl: "",
    tagline: DEMO_DEVELOPER.tagline,
    skills: DEMO_DEVELOPER.skills,
    experiences: DEMO_DEVELOPER.experiences,
    projects: DEMO_DEVELOPER.projects,
    socialLinks: DEMO_DEVELOPER.socialLinks
  };

  const skillsList = activeProfile.skills
    ? activeProfile.skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
    : [];

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase().trim();
    if (p.includes("github")) return <Github className="w-4 h-4" />;
    if (p.includes("linkedin")) return <Linkedin className="w-4 h-4" />;
    if (p.includes("twitter") || p.includes("x")) return <Twitter className="w-4 h-4" />;
    if (p.includes("mail") || p.includes("email") || p.includes("gmail")) return <Mail className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  // Helper styles for interactive linkings and highlight feedback
  const getClickableProps = (targetTab: string) => {
    if (!onSectionClick) return {};
    return {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onSectionClick(targetTab);
      },
      title: `Click to edit ${targetTab} in editor`
    };
  };

  const clickableClass = (targetTab: string) => {
    if (!onSectionClick) return "";
    return "cursor-pointer group/clickable hover:ring-2 hover:ring-indigo-500/40 hover:scale-[1.005] hover:shadow-md transition-all duration-300 relative";
  };

  const renderEditIndicator = () => {
    if (!onSectionClick) return null;
    return (
      <div className="absolute top-2 right-2 opacity-0 group-hover/clickable:opacity-100 transition-all duration-250 bg-indigo-600 text-white rounded-full p-1 shadow-sm pointer-events-none z-20 hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      </div>
    );
  };

  const getHighlightClass = (fieldName: string) => {
    if (focusedField === fieldName) {
      return "ring-3 ring-indigo-500 ring-offset-2 scale-[1.01] shadow-lg animate-pulse transition-all duration-300 rounded-lg";
    }
    return "transition-all duration-300";
  };

  // Helper renderer: Skills
  const renderSkills = () => (
    <div 
      {...getClickableProps("profile")}
      className={`${template.cardClass} ${clickableClass("profile")} ${getHighlightClass("skills")}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`p-1.5 rounded-lg ${template.accentBg}`}>
          <Code className="w-4 h-4" />
        </div>
        <h3 className={template.titleClass}>Technical Expertise</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {skillsList.map((skill, idx) => (
          <span key={idx} className={template.tagClass}>
            {skill}
          </span>
        ))}
        {skillsList.length === 0 && (
          <p className="text-xs italic select-none opacity-50">No technical skills added yet.</p>
        )}
      </div>
      {renderEditIndicator()}
    </div>
  );

  // Helper renderer: Experience Timeline
  const renderExperiences = () => (
    <div 
      {...getClickableProps("experiences")}
      className={`${template.cardClass} ${clickableClass("experiences")} ${getHighlightClass("experiences")}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`p-1.5 rounded-lg ${template.accentBg}`}>
          <Briefcase className="w-4 h-4" />
        </div>
        <h3 className={template.titleClass}>Professional History</h3>
      </div>
      <div className="space-y-6 relative pl-3 border-l border-slate-200/50">
        {activeProfile.experiences.map((exp, idx) => (
          <div key={exp.id || idx} className="relative group">
            {/* Timeline bullet handle */}
            <span className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${template.accentBg}`} />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <span className={`text-[11px] uppercase tracking-wider font-extrabold ${template.accentText}`}>{exp.company}</span>
                <h4 className={`text-sm font-bold leading-tight ${template.textPrimary}`}>{exp.role}</h4>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${template.accentBg} shrink-0 w-max`}>
                {exp.startDate} {exp.endDate ? ` - ${exp.endDate}` : " - Present"}
              </span>
            </div>
            <p className={`text-xs mt-2 leading-relaxed ${template.textMuted}`}>{exp.description}</p>
          </div>
        ))}
        {activeProfile.experiences.length === 0 && (
          <p className="text-xs italic opacity-50 pl-2 select-none">No professional history recorded.</p>
        )}
      </div>
      {renderEditIndicator()}
    </div>
  );

  // Helper renderer: Projects Grid
  const renderProjects = () => (
    <div 
      {...getClickableProps("projects")}
      className={`space-y-4 ${clickableClass("projects")} ${getHighlightClass("projects")} p-2 rounded-xl`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${template.accentBg}`}>
          <FolderGit2 className="w-4 h-4" />
        </div>
        <h3 className={`font-display font-bold uppercase tracking-wide text-xs ${template.accentText}`}>Showcase Projects</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeProfile.projects.map((proj, idx) => (
          <div key={proj.id || idx} className={template.cardClass}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`text-sm font-bold tracking-tight ${template.textPrimary}`}>{proj.title}</h4>
              {proj.link && (
                <span className={`p-1 rounded-md ${template.accentBg}`}>
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className={`text-[11px] leading-relaxed mb-3 ${template.textMuted}`}>{proj.description}</p>
            {proj.techStack && (
              <div className="flex flex-wrap gap-1">
                {proj.techStack.split(",").map((tech, tIdx) => (
                  <span key={tIdx} className="text-[9px] font-mono opacity-80 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded">
                    {tech.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {activeProfile.projects.length === 0 && (
          <div className={`col-span-full ${template.cardClass} py-6 text-center select-none opacity-50 italic text-xs`}>
            No showcase projects uploaded.
          </div>
        )}
      </div>
      {renderEditIndicator()}
    </div>
  );

  // Helper renderer: Social Connect footer
  const renderSocials = () => (
    <div 
      {...getClickableProps("social")}
      className={`flex flex-wrap justify-center gap-3 mt-4 ${clickableClass("social")} ${getHighlightClass("socialLinks")} p-2.5 rounded-xl`}
    >
      {activeProfile.socialLinks.map((link, idx) => (
        <a
          key={link.id || idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full transition-all border shrink-0 border-transparent hover:scale-103 ${template.buttonClass}`}
        >
          {getPlatformIcon(link.platform)}
          <span className="font-medium">{link.platform}</span>
        </a>
      ))}
      {renderEditIndicator()}
    </div>
  );

  // Interactive core geometric layouts mapped to the template selection
  const renderTemplateGeometry = () => {
    if (template.layoutType === "two-column") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-5">
            <div 
              {...getClickableProps("profile")}
              className={`flex flex-col items-center text-center p-5 rounded-2xl border ${template.borderClass} ${template.cardClass} ${clickableClass("profile")} ${getHighlightClass("displayName")} ${getHighlightClass("tagline")} ${getHighlightClass("photoURL")}`}
            >
              {activeProfile.photoURL ? (
                <img src={activeProfile.photoURL} alt={activeProfile.displayName} className="w-16 h-16 rounded-full object-cover mb-3 shadow-xs border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-lg mb-3">
                  {activeProfile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className={`font-bold text-sm ${template.textPrimary}`}>{activeProfile.displayName}</h2>
              <p className={`text-[10px] font-medium tracking-wide uppercase mt-1 ${template.accentText}`}>{activeProfile.tagline}</p>
              {renderEditIndicator()}
            </div>
            
            {/* Bio / About */}
            <div 
              {...getClickableProps("profile")}
              className={`${template.cardClass} ${clickableClass("profile")} ${getHighlightClass("bio")}`}
            >
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${template.accentText}`}>About Me</h4>
              <p className={`text-xs leading-relaxed ${template.textMuted}`}>{activeProfile.bio}</p>
              {renderEditIndicator()}
            </div>
            
            {renderSkills()}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 space-y-5">
            {renderExperiences()}
            {renderProjects()}
          </div>
        </div>
      );
    }

    if (template.layoutType === "asymmetric") {
      return (
        <div className="space-y-6">
          <div 
            {...getClickableProps("profile")}
            className={`flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4 border-slate-200/40 relative ${clickableClass("profile")} ${getHighlightClass("displayName")} ${getHighlightClass("tagline")} ${getHighlightClass("photoURL")}`}
          >
            <div className="space-y-1 text-center md:text-left">
              <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${template.accentBg}`}>{template.name} Viewport</span>
              <h1 className={`text-2xl font-black tracking-tight ${template.textPrimary}`}>{activeProfile.displayName}</h1>
              <p className={`text-xs font-medium uppercase font-mono ${template.textMuted}`}>{activeProfile.tagline}</p>
            </div>
            {activeProfile.photoURL && (
              <img src={activeProfile.photoURL} alt={activeProfile.displayName} className="w-16 h-16 rounded-2xl rotate-2 hover:rotate-0 transition-transform object-cover shadow-sm border shrink-0" />
            )}
            {renderEditIndicator()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              <div 
                {...getClickableProps("profile")}
                className={`${template.cardClass} ${clickableClass("profile")} ${getHighlightClass("bio")}`}
              >
                <p className={`text-xs leading-relaxed ${template.textMuted}`}>{activeProfile.bio}</p>
                {renderEditIndicator()}
              </div>
              {renderExperiences()}
            </div>
            <div className="space-y-5">
              {renderSkills()}
              {renderProjects()}
            </div>
          </div>
        </div>
      );
    }

    // Default: continuous block vertical flow "standard" or "cyber"
    return (
      <div className="space-y-6">
        {/* Header Hero card */}
        <div 
          {...getClickableProps("profile")}
          className={`text-center py-4 flex flex-col items-center relative ${clickableClass("profile")} ${getHighlightClass("displayName")} ${getHighlightClass("tagline")} ${getHighlightClass("photoURL")} ${getHighlightClass("bio")}`}
        >
          {activeProfile.photoURL ? (
            <div className={`w-20 h-20 overflow-hidden mb-3.5 border-2 transition-transform shadow-sm ${template.id.startsWith("cyber") ? "border-emerald-500 rounded-none" : "border-indigo-600 rounded-full"}`}>
              <img src={activeProfile.photoURL} alt={activeProfile.displayName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-800 font-bold text-xl flex items-center justify-center mb-3.5 uppercase">
              {activeProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className={`text-xl md:text-2xl font-extrabold tracking-tight ${template.textPrimary}`}>{activeProfile.displayName}</h1>
          <p className={`text-[10px] font-mono uppercase tracking-widest mt-1 font-bold ${template.accentText}`}>{activeProfile.tagline || "Professional Candidate"}</p>
          <p className={`text-xs max-w-lg mt-3 mx-auto leading-relaxed px-4 ${template.textMuted}`}>{activeProfile.bio}</p>
          {renderEditIndicator()}
        </div>

        {renderSkills()}
        {renderExperiences()}
        {renderProjects()}
      </div>
    );
  };
  return (
    <div className="space-y-3">      {/* Visual Controls frame */}
      <div className="flex items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">Preview:</span>
          <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
            {template.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Elegant Print / PDF export prompt */}
          <button
            type="button"
            onClick={() => window.print()}
            title="Saves this responsive template directly as an elegant physical PDF resume file"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-200/70 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-all shrink-0 cursor-pointer border border-slate-300/30"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="hidden sm:inline">Export to PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Toggle switch for data source */}
          <div className="flex items-center bg-slate-200 p-0.5 rounded-md shrink-0 text-[10px]">
            <button
              type="button"
              onClick={() => setViewSource("demo")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewSource === "demo" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Demo Profile
            </button>
            <button
              type="button"
              onClick={() => setViewSource("mine")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                viewSource === "mine" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Profile
            </button>
          </div>
        </div>
      </div>
 
      {/* Styled sandbox frame with restricted container height and nested scrolling */}
      <div 
        className="w-full relative overflow-y-auto overflow-x-hidden rounded-xl border border-stone-200/50 bg-stone-100/30 p-1 select-none scrollbar-thin shadow-inner preview-container"
        style={{
          maxHeight: "380px",
          minHeight: "260px",
        }}
      >
        <motion.div 
          key={template.id}
          initial={{ opacity: 0.15, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={
            isFirefox 
              ? {
                  transform: `scale(${scale / 100})`,
                  transformOrigin: "top center",
                  width: scale !== 100 ? `${100 / (scale / 100)}%` : "100%",
                  marginBottom: scale !== 100 ? `-${100 - scale}%` : undefined
                }
              : {
                  zoom: scale / 100,
                  width: "100%"
                }
          }
          className={`p-4 sm:p-5 rounded-lg relative shadow-xs border-2 ${template.borderClass} ${template.bgClass} ${template.fontClass} preview-scale-wrapper`}
        >
          
          {/* Elegant top tab branding mockup element */}
          <div className="absolute top-2 right-3 font-mono text-[8px] opacity-45 select-none uppercase tracking-widest pointer-events-none">
            {template.id} preview
          </div>
 
          {/* Dynamic content rendering according to selected layout geometries */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-4 text-left">
            {renderTemplateGeometry()}
            
            {/* Footnotes Social connect matching template style */}
            <div className="pt-4 border-t border-slate-200/20 text-center space-y-2">
              <span className={`text-[9px] uppercase tracking-wider font-extrabold ${template.accentText}`}>Let's Connect</span>
              {renderSocials()}
            </div>
          </div>
 
          {/* Subtle decorative glowing background bubbles for glassmorphic style */}
          {template.id === "dark" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg select-none z-0">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/10 blur-xl rounded-full" />
              <div className="absolute bottom-10 right-10 w-28 h-28 bg-indigo-500/10 blur-xl rounded-full" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
