import React from "react";
import { TemplateConfig } from "./LivePortfolio";

interface MiniTemplateMockupProps {
  template: TemplateConfig;
  isActive: boolean;
  userDisplayName?: string;
  userTagline?: string;
  userPhotoURL?: string;
  userBio?: string;
  userSkills?: string;
  userExperiences?: any[];
  userProjects?: any[];
  userSocialLinks?: any[];
}

// Map each layout style to a unique fallback profile of a candidate to maintain gorgeous full layouts
const MOCK_RESUMES: Record<string, { name: string; subtitle: string; hasAvatar: boolean; avatarBg: string; seedLetters: string }> = {
  antique_newsprint: { name: "OLIVIA SANCHEZ", subtitle: "ADVERTISING COPYWRITER", hasAvatar: false, avatarBg: "#2C2925", seedLetters: "OS" },
  field_notes: { name: "DREW FEIG", subtitle: "ENVIRONMENT ARCHITECT", hasAvatar: true, avatarBg: "#8D6E63", seedLetters: "DF" },
  matte_studio: { name: "LORNA ALVARADO", subtitle: "CREATIVE STRATEGIST", hasAvatar: true, avatarBg: "#495057", seedLetters: "LA" },
  museum_exhibition: { name: "ISABEL MERCADO", subtitle: "MUSEUM COLLECTIONS", hasAvatar: false, avatarBg: "#020617", seedLetters: "IM" },
  light: { name: "JULIANA SILVA", subtitle: "SALES CONSULTANT", hasAvatar: true, avatarBg: "#4f46e5", seedLetters: "JS" },
  dark: { name: "DANI MARTINEZ", subtitle: "FULL-STACK ENGINEER", hasAvatar: true, avatarBg: "#0ea5e9", seedLetters: "DM" },
  sunset: { name: "SAMIRA HADID", subtitle: "UX/UI DESIGNER", hasAvatar: false, avatarBg: "#fb7185", seedLetters: "SH" },
  cyber: { name: "CORE_TERMINAL", subtitle: "LINUX SECURITY ADMIN", hasAvatar: false, avatarBg: "#10b981", seedLetters: "CT" },
  slate: { name: "MAXIME DUPONT", subtitle: "GEOMETRIC DESIGN HEAD", hasAvatar: false, avatarBg: "#1e293b", seedLetters: "MD" },
  academic_serif: { name: "DR. EMILY CLARKE", subtitle: "LITERATURE PROFESSOR", hasAvatar: false, avatarBg: "#7c2d12", seedLetters: "EC" },
  creative_editorial: { name: "JONATHAN PATTERSON", subtitle: "DIGITAL MARKETING DIRECT", hasAvatar: true, avatarBg: "#9a3412", seedLetters: "JP" },
  neon_nights: { name: "VIOLET WAVE", subtitle: "AUDIO LOGIC SYNTH", hasAvatar: false, avatarBg: "#d946ef", seedLetters: "VW" },
  glassmorphism: { name: "CELESTIAL GLASS", subtitle: "AEROSPACE ENTHUSIAST", hasAvatar: true, avatarBg: "#06b6d4", seedLetters: "CG" },
  corporate_suite: { name: "ELEANOR FITZGERALD", subtitle: "CHIEF OPERATIONS OFFICER", hasAvatar: false, avatarBg: "#1e3a8a", seedLetters: "EF" },
  minty_forest: { name: "SAGE LOGAN", subtitle: "LANDSCAPE GRAPHICIAN", hasAvatar: true, avatarBg: "#047857", seedLetters: "SL" },
  royal_gold: { name: "AURELIA ROYALE", subtitle: "FINE ART CURATOR", hasAvatar: false, avatarBg: "#f59e0b", seedLetters: "AR" },
  cyberpunk: { name: "V_RUNNER", subtitle: "NETRUNNER OPERATOR", hasAvatar: false, avatarBg: "#fdee0a", seedLetters: "VR" },
  oceanic_breeze: { name: "KAI SEABREEZE", subtitle: "OCEAN CONSERVATIONIST", hasAvatar: true, avatarBg: "#0ea5e9", seedLetters: "KS" },
  warm_terracotta: { name: "CLAY CERAMICS", subtitle: "STUDIO ART DIRECTOR", hasAvatar: true, avatarBg: "#c2410c", seedLetters: "CC" },
  midnight_slate: { name: "NOX CHRONICLE", subtitle: "INVESTIGATIVE JOURNALIST", hasAvatar: false, avatarBg: "#6366f1", seedLetters: "NC" },
  clinical_science: { name: "DR. ARIA CHEN", subtitle: "CARDIOLOGY RESEARCH LEAD", hasAvatar: true, avatarBg: "#0D9488", seedLetters: "AC" },
  finance_executive: { name: "WARREN VANCE", subtitle: "QUANTITATIVE RISK ANALYST", hasAvatar: false, avatarBg: "#0F172A", seedLetters: "WV" },
  creative_gallery: { name: "SOPHIE KOVACH", subtitle: "UX RESEARCHER & CERAMIST", hasAvatar: true, avatarBg: "#EA580C", seedLetters: "SK" },
  biotech_research: { name: "DR. MARCUS VANCE", subtitle: "BIOINFORMATICS SCHOLAR", hasAvatar: false, avatarBg: "#16A34A", seedLetters: "MV" }
};

function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function MiniTemplateMockup({ 
  template, 
  isActive, 
  userDisplayName, 
  userTagline, 
  userPhotoURL,
  userBio,
  userSkills,
  userExperiences,
  userProjects,
  userSocialLinks 
}: MiniTemplateMockupProps) {
  // Extract template colors
  const [bg, primaryColor, accentColor] = template.colors;
  
  // Find mockup metadata or fall back to standard defaults if undefined
  const mockProfile = MOCK_RESUMES[template.id] || { 
    name: "JANE PROTAGONIST", 
    subtitle: "PORTFOLIO DESIGNER", 
    hasAvatar: true, 
    avatarBg: primaryColor || "#4f46e5",
    seedLetters: "JP"
  };

  // Resolve active display fields based on user input or preset portfolio values
  const finalName = userDisplayName?.trim() ? userDisplayName.toUpperCase() : mockProfile.name;
  const finalSubtitle = userTagline?.trim() ? userTagline.toUpperCase() : mockProfile.subtitle;
  const seedLetters = userDisplayName?.trim() ? getInitials(userDisplayName) : mockProfile.seedLetters;
  const hasAvatar = !!userPhotoURL || mockProfile.hasAvatar;

  // Parse user skills
  const resolvedSkills = userSkills?.trim() 
    ? userSkills.split(",").map(s => s.trim()).filter(Boolean)
    : ["TypeScript", "React", "Node.js", "Tailwind CSS", "Firebase"];

  // Parse user experiences
  const resolvedExperiences = userExperiences && userExperiences.length > 0
    ? userExperiences.map(e => ({
        role: e.role || "Lead Engineer",
        company: e.company || "Creative Tech Inc",
        period: e.period || "2023 - Present",
        desc: e.description || "Designed dynamic components and backend system layouts."
      }))
    : [
        { role: "Developer Advocate", company: "Elite Studio Workspace", period: "2024 - 2026", desc: "Crafted stunning user profiles and modern template frameworks." }
      ];

  // Parse user projects
  const resolvedProjects = userProjects && userProjects.length > 0
    ? userProjects.map(p => ({
        title: p.title || "Verve Platform",
        role: p.developmentStack || "React / Vite / TS",
        desc: p.description || "High-performance digital resumes and automatic handle namespaces."
      }))
    : [
        { title: "Dynamic Builder Core", role: "Vite / Next.js", desc: "Dynamic builder syncing design previews and downloadable credentials." }
      ];

  // Determine fonts based on template
  const isSerif = template.fontClass?.includes("serif") || template.fontClass?.includes("bricolage") || template.id === "antique_newsprint" || template.id === "warm_terracotta" || template.id === "academic_serif";
  const isMono = template.fontClass?.includes("mono") || template.id === "cyber" || template.id === "cyberpunk" || template.id === "field_notes" || template.id === "museum_exhibition";

  const fontStyleClass = isSerif ? "font-serif" : isMono ? "font-mono" : "font-sans";

  return (
    <div 
      id={`mockup_container_${template.id}`}
      className={`w-full aspect-[210/297] rounded-xl relative overflow-hidden transition-colors duration-200 border-2 select-none ${
        isActive 
          ? "border-transparent bg-[#efede8]/95 ring-1 ring-slate-400 p-2 shadow-md" 
          : "border-slate-100 bg-[#f8fafc] p-1.5 shadow-xs"
      }`}
    >
      {/* 3D Physical Sheet of Paper (representing Canva Style printed design structure) */}
      <div 
        id={`sheet_${template.id}`}
        style={{ backgroundColor: bg || "#ffffff" }}
        className={`w-full h-full relative rounded-md overflow-hidden flex flex-col justify-between py-3 px-2 sm:px-[11px] border border-black/5 shadow-[0.5px_1px_4px_rgba(0,0,0,0.06)] ${
          template.id === "field_notes" ? "bg-notebook-dots" : ""
        } ${
          template.id === "antique_newsprint" ? "bg-newsprint-tint" : ""
        }`}
      >
        {/* Binder spirals on left side for Field Notes theme to look incredibly physical */}
        {template.id === "field_notes" && (
          <div className="absolute left-[2px] top-6 bottom-6 flex flex-col justify-between w-1 pointer-events-none z-10 opacity-70">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="w-1.5 h-1 bg-[#4E342E] rounded-full border-r border-[#FAF6F0] shadow-xs" />
            ))}
          </div>
        )}

        {/* Vintage postal stamp watermark for exhibition / museum layout */}
        {template.id === "museum_exhibition" && (
          <div className="absolute right-1 top-10 w-5 h-5 border border-dashed border-red-500/20 text-red-500/20 font-mono text-[4px] uppercase flex items-center justify-center rounded-none rotate-12">
            ARCHIVE
          </div>
        )}

        {/* Header Section: Letterhead Banner */}
        <div className="space-y-1.5 shrink-0">
          
          {/* Main Title layout styled exactly like simulated resumes */}
          {template.layoutType === "two-column" ? (
            /* Left/Right compact flow for double columns */
            <div className={`flex items-start justify-between gap-1 pb-1.5 border-b ${template.borderClass || "border-stone-200"}`}>
              <div className="space-y-0.5 max-w-[70%]">
                <h4 
                  style={{ color: primaryColor || "#0f172a" }} 
                  className={`text-[8px] leading-tight font-black tracking-tight uppercase truncate ${fontStyleClass}`}
                >
                  {finalName}
                </h4>
                <p 
                  style={{ color: accentColor || primaryColor || "#64748b" }} 
                  className="text-[4px] leading-none font-semibold uppercase tracking-wider scale-95 origin-left truncate block w-full"
                >
                  {finalSubtitle}
                </p>
              </div>

              {hasAvatar ? (
                /* Colored badge representing mini rounded avatar profile photo */
                <div 
                  style={{ borderColor: accentColor || primaryColor }}
                  className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 scale-90 overflow-hidden text-[4.5px] font-bold text-white shadow-2xs"
                >
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div 
                      style={{ backgroundColor: mockProfile.avatarBg }} 
                      className="w-full h-full flex items-center justify-center"
                    >
                      {seedLetters}
                    </div>
                  )}
                </div>
              ) : (
                /* Monogram logo stamp */
                <span 
                  style={{ color: primaryColor, borderColor: primaryColor }}
                  className="text-[4px] font-mono border px-0.8 py-0.2 scale-90 leading-none shrink-0"
                >
                  {seedLetters}
                </span>
              )}
            </div>
          ) : (
            /* Centered full block design with matching elements */
            <div className="text-center space-y-1 pb-2">
              <div className="flex items-center justify-center gap-1.5">
                {hasAvatar && (
                  <div 
                    style={{ borderColor: accentColor || "transparent" }} 
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[4px] text-white shrink-0 scale-95 border font-extrabold overflow-hidden"
                  >
                    {userPhotoURL ? (
                      <img src={userPhotoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div 
                        style={{ backgroundColor: mockProfile.avatarBg }} 
                        className="w-full h-full flex items-center justify-center"
                      >
                        {seedLetters}
                      </div>
                    )}
                  </div>
                )}
                <h4 
                  style={{ color: primaryColor || "#0f172a" }} 
                  className={`text-[8.5px] font-black uppercase tracking-tight leading-none truncate max-w-[85%] ${fontStyleClass}`}
                >
                  {finalName}
                </h4>
              </div>
              
              <p 
                style={{ color: accentColor || primaryColor || "#64748b" }} 
                className="text-[4px] font-bold uppercase tracking-widest leading-none block scale-90 truncate max-w-full"
              >
                {finalSubtitle}
              </p>

              {/* Classic Double-Line rule divider for traditional editorial feel */}
              {template.id === "antique_newsprint" && (
                <div className="border-t-2 border-stone-850 border-double mt-1.5 h-0.5 w-full" />
              )}
            </div>
          )}

        </div>

        {/* Content Section representing simulated paragraph blocks */}
        <div className="flex-1 my-1.5 overflow-hidden flex flex-col gap-2 justify-center">
          
          {/* Summary Mini Block */}
          <div className="space-y-0.5 shrink-0 block">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[3.5px] font-extrabold uppercase tracking-wide" style={{ color: accentColor || primaryColor || "#10b981" }}>ABOUT ME</span>
            </div>
            <p className="text-[3px] leading-[3.6px] font-medium text-slate-500 line-clamp-2 max-w-full font-sans break-words overflow-hidden" style={{ color: `${primaryColor}cc` }}>
              {userBio?.trim() ? userBio : "Dynamic design professional dedicated to delivering elite, high-performance web components and gorgeous, fully bespoke systems."}
            </p>
          </div>

          {/* Dynamic Grid Column structures representing section details */}
          {template.layoutType === "two-column" ? (
            <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
              {/* Sidebar Column */}
              <div className="col-span-1 border-r border-black/5 pr-1 space-y-1.5 flex flex-col justify-start">
                {/* Skill List Simulation */}
                <div className="space-y-1">
                  <div className="text-[3.5px] font-extrabold uppercase opacity-80" style={{ color: primaryColor }}>SKILLS</div>
                  <div className="flex flex-wrap gap-0.5 max-h-[20px] overflow-hidden">
                    {resolvedSkills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="text-[2.2px] px-0.6 py-0.2 rounded-xs scale-90 origin-left border whitespace-nowrap leading-none" style={{ borderColor: `${primaryColor}22`, color: primaryColor, backgroundColor: `${primaryColor}06` }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Column */}
              <div className="col-span-2 pl-1 space-y-1.5 flex flex-col justify-start min-h-0">
                {/* Work Experience Item Simulation */}
                <div className="space-y-0.5 min-h-0 leading-none">
                  <div className="text-[3.5px] font-extrabold uppercase opacity-80" style={{ color: primaryColor }}>EXPERIENCE</div>
                  <div className="space-y-0.5 leading-none">
                    <div className="flex justify-between items-center text-[2.8px] font-bold" style={{ color: primaryColor }}>
                      <span className="truncate max-w-[65%]">{resolvedExperiences[0].role}</span>
                      <span className="text-[2.2px] opacity-60 shrink-0">{resolvedExperiences[0].period}</span>
                    </div>
                    <p className="text-[2.5px] font-semibold opacity-80 truncate" style={{ color: accentColor || primaryColor }}>{resolvedExperiences[0].company}</p>
                    <p className="text-[2.2px] opacity-50 line-clamp-1 leading-tight">{resolvedExperiences[0].desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : template.layoutType === "asymmetric" ? (
            /* Dynamic staggered asymmetrical block panels */
            <div className="flex-1 flex flex-col gap-1.5 justify-start min-h-0">
              <div className="grid grid-cols-2 gap-1.5 min-h-0">
                <div 
                  className="rounded p-1 flex flex-col justify-between"
                  style={{ backgroundColor: `${accentColor || primaryColor}12`, borderLeft: `1.5px solid ${accentColor || primaryColor}` }}
                >
                  <div className="text-[3.5px] font-bold" style={{ color: primaryColor }}>RECENT EXPERIENCES</div>
                  <div className="text-[3px] font-extrabold truncate" style={{ color: primaryColor }}>{resolvedExperiences[0].role}</div>
                  <div className="text-[2.2px] opacity-70 truncate" style={{ color: primaryColor }}>{resolvedExperiences[0].company}</div>
                </div>
                <div 
                  className="rounded p-1 flex flex-col justify-between"
                  style={{ backgroundColor: `${primaryColor}08` }}
                >
                  <div className="text-[3.5px] font-bold" style={{ color: primaryColor }}>ACTIVE BUILDS</div>
                  <div className="text-[3px] font-extrabold truncate" style={{ color: accentColor || primaryColor }}>{resolvedProjects[0].title}</div>
                  <div className="text-[2.2px] opacity-70 truncate" style={{ color: primaryColor }}>{resolvedProjects[0].role}</div>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[3.5px] font-extrabold uppercase opacity-85" style={{ color: primaryColor }}>MAIN FOCUS</div>
                <p className="text-[2.5px] opacity-65 leading-none line-clamp-1 truncate">{resolvedProjects[0].desc}</p>
              </div>
            </div>
          ) : template.layoutType === "cyber" ? (
            /* Cyber terminal matrix visual line graphs */
            <div className="flex-1 flex flex-col gap-1 justify-start font-mono text-[2.8px] select-none min-h-0 leading-none">
              <div className="border border-[#10b981]/20 bg-black/60 p-1 space-y-1 rounded-sm leading-none">
                <div className="flex justify-between text-emerald-400 font-bold scale-95 origin-left">
                  <span>[&gt;_ CONSOLE_ACTIVE]</span>
                  <span className="text-[2.2px] text-emerald-500">SYS_OK</span>
                </div>
                <div className="h-[1px] bg-emerald-500/20 w-full" />
                <div className="space-y-0.5 font-mono text-emerald-300">
                  <div className="truncate"><span className="text-yellow-400">DESIGN:</span> {finalSubtitle || "CONSULTANT"}</div>
                  <div className="truncate"><span className="text-yellow-400">COMPANY:</span> {resolvedExperiences[0].company}</div>
                  <div className="truncate"><span className="text-yellow-400">STACK:</span> {resolvedSkills.slice(0, 3).join(", ")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[2.8px] text-yellow-500 font-bold opacity-75">
                <span>⚡</span>
                <span className="truncate">BUILD: {resolvedProjects[0].title}</span>
              </div>
            </div>
          ) : (
            /* Standard continuous layout flow */
            <div className="flex-1 space-y-1.5 flex flex-col justify-start min-h-0 leading-none">
              {/* Section 1: Experience */}
              <div className="space-y-0.5 leading-none">
                <div className="text-[3.5px] font-extrabold uppercase tracking-wide opacity-80" style={{ color: primaryColor }}>EXPERIENCES</div>
                <div className="flex justify-between text-[3px] font-bold" style={{ color: primaryColor }}>
                  <span className="truncate max-w-[70%]">{resolvedExperiences[0].role}</span>
                  <span className="text-[2.2px] opacity-55">{resolvedExperiences[0].period}</span>
                </div>
                <p className="text-[2.5px] opacity-75 truncate" style={{ color: accentColor || primaryColor }}>{resolvedExperiences[0].company}</p>
              </div>
              {/* Section 2: Latest Project */}
              <div className="space-y-0.5 leading-none pt-0.5 border-t border-black/[0.04]">
                <div className="text-[3.5px] font-extrabold uppercase tracking-wide opacity-80" style={{ color: primaryColor }}>FEATURED PROJECT</div>
                <div className="flex justify-between text-[3px] font-bold" style={{ color: primaryColor }}>
                  <span className="truncate font-semibold" style={{ color: accentColor || primaryColor }}>{resolvedProjects[0].title}</span>
                  <span className="text-[2.2px] opacity-55 font-mono">{resolvedProjects[0].role}</span>
                </div>
                <p className="text-[2.5px] opacity-65 leading-tight line-clamp-1">{resolvedProjects[0].desc}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer block: Signature elements & custom accent tag bubbles */}
        <div className="shrink-0 flex items-center justify-between text-[4px] tracking-wide font-mono pt-1 border-t border-black/5">
          <span 
            className="uppercase font-extrabold select-none tracking-wider scale-95 opacity-50" 
            style={{ color: primaryColor || "#000000" }}
          >
            {template.layoutType} format
          </span>
          <div className="flex gap-0.5 scale-90 origin-right">
            {template.colors.map((color, idx) => (
              <span 
                key={idx} 
                className="w-[5px] h-[5px] rounded-full border border-black/5" 
                style={{ backgroundColor: color }} 
              />
            ))}
          </div>
        </div>

      </div>

      {/* Subtle paper highlight effect */}
      <div className="absolute inset-0 border border-black/[0.03] rounded-xl pointer-events-none" />
    </div>
  );
}
