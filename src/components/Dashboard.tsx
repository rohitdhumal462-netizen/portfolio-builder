import React, { useState, useEffect } from "react";
import { Experience, Project, SocialLink, Portfolio } from "../types";
import { 
  User, Briefcase, FolderGit2, Link2, ArrowUp, ArrowDown, Sparkles, 
  Trash2, Plus, Edit2, Check, RefreshCw, AlertCircle, ExternalLink, KeyRound, X,
  Palette, Eye, UploadCloud, FileText, Copy, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LivePortfolio, { PREMIUM_TEMPLATES } from "./LivePortfolio";
import StaticTemplatePreview from "./StaticTemplatePreview";
import MiniTemplateMockup from "./MiniTemplateMockup";
import ImageCropperModal from "./ImageCropperModal";
import LottieTaskAssigning from "./LottieTaskAssigning";

interface DashboardProps {
  bearerToken: string;
  setBearerToken: (tok: string) => void;
  uid: string;
  setUid: (uid: string) => void;
  username: string;
  setUsername: (uname: string) => void;
}

export default function Dashboard({ bearerToken, setBearerToken, uid, setUid, username, setUsername }: DashboardProps) {
  // Navigation tabs: "profile" | "experiences" | "projects" | "social" | "sequence"
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // UI States
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Granular Saving & Success feedback states for form buttons
  const [isProfileSaving, setIsProfileSaving] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [isExperienceSaving, setIsExperienceSaving] = useState<boolean>(false);
  const [experienceSaveSuccess, setExperienceSaveSuccess] = useState<boolean>(false);
  const [isProjectSaving, setIsProjectSaving] = useState<boolean>(false);
  const [projectSaveSuccess, setProjectSaveSuccess] = useState<boolean>(false);
  const [isSocialSaving, setIsSocialSaving] = useState<boolean>(false);
  const [socialSaveSuccess, setSocialSaveSuccess] = useState<boolean>(false);

  // Form Fields - Profile Metadata
  const [displayName, setDisplayName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [theme, setTheme] = useState<string>("dark");
  const [tempUsername, setTempUsername] = useState<string>("");
  const [cvUrl, setCvUrl] = useState<string>("");
  const [isCvLocalUpload, setIsCvLocalUpload] = useState<boolean>(false);
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [tagline, setTagline] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [department, setDepartment] = useState<string>("it");

  // Interactive Skills Grid States
  const [skillInput, setSkillInput] = useState<string>("");
  const [showSkillSuggestions, setShowSkillSuggestions] = useState<boolean>(false);

  const ALL_PRESET_SKILLS = [
    // Languages
    "Python", "JavaScript", "TypeScript", "Go", "Rust", "C++", "C#", "C", "Java", "Kotlin", "Swift", "PHP", "Ruby", "R", "Scala", "Dart", "Haskell", "Julia", "Shell Scripting", "Bash",
    // Frontend
    "React", "HTML5", "CSS3", "Tailwind CSS", "Next.js", "Vue.js", "Svelte", "Angular", "SolidJS", "Nuxt.js", "Gatsby", "Qwik", "Redux", "Zustand", "Recoil", "Chakra UI", "Material UI", "Shadcn UI", "Sass", "WebAssembly",
    // Backend & APIs
    "Node.js", "Express.js", "NestJS", "FastAPI", "Flask", "Django", "Spring Boot", "Laravel", "Ruby on Rails", "ASP.NET Core", "GraphQL", "gRPC", "REST API", "WebSockets", "Apollo Server", "Prisma", "Drizzle ORM", "Mongoose",
    // Databases & Caching
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Neo4j", "DynamoDB", "MariaDB", "Supabase", "Firebase Firestore", "Snowflake", "BigQuery", "ClickHouse",
    // Cloud & DevOps
    "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "ArgoCD", "Ansible", "Nginx", "Linux", "Prometheus", "Grafana", "ELK Stack",
    // Data Science & AI
    "Machine Learning", "Deep Learning", "Data Engineering", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-learn", "Keras", "Hugging Face", "OpenCV", "Airflow", "Apache Spark", "Apache Kafka", "LangChain", "Vector Databases", "Pinecone",
    // Mobile & Desktop
    "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Electron", "Tauri", "Ionic",
    // Design & Product
    "Figma", "UI/UX Design", "Adobe XD", "Photoshop", "Illustrator",
    // Testing & Quality
    "Jest", "Cypress", "Playwright", "Selenium", "Mocha", "Chai", "Storybook", "JUnit",
    // Other / Tools
    "Git", "Postman", "Swagger", "Jira", "Confluence", "Web3", "Solidity", "D3.js", "Recharts"
  ];

  const getDotColor = (skillName: string) => {
    const colors = [
      "bg-emerald-500", "bg-sky-500", "bg-indigo-500", 
      "bg-amber-500", "bg-rose-500", "bg-violet-500", 
      "bg-teal-500", "bg-pink-500"
    ];
    let hash = 0;
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    
    // Parse current skills
    const currentList = skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    
    // Check if duplicate case-insensitive
    if (currentList.some((s: string) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      setShowSkillSuggestions(false);
      return;
    }
    
    const updatedList = [...currentList, trimmed];
    setSkills(updatedList.join(", "));
    setSkillInput("");
    setShowSkillSuggestions(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentList = skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const updatedList = currentList.filter((s: string) => s.toLowerCase() !== skillToRemove.toLowerCase());
    setSkills(updatedList.join(", "));
  };

  // Form Fields - Add/Edit Experience
  const [expId, setExpId] = useState<string | null>(null); // Null means ADD, otherwise EDIT
  const [expRole, setExpRole] = useState<string>("");
  const [expCompany, setExpCompany] = useState<string>("");
  const [expStart, setExpStart] = useState<string>("");
  const [expEnd, setExpEnd] = useState<string>("");
  const [expDesc, setExpDesc] = useState<string>("");
  const [aiGeneratingExp, setAiGeneratingExp] = useState<boolean>(false);

  // Form Fields - Add/Edit Project
  const [projId, setProjId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState<string>("");
  const [projDesc, setProjDesc] = useState<string>("");
  const [projLink, setProjLink] = useState<string>("");
  const [projDemoLink, setProjDemoLink] = useState<string>("");
  const [projImage, setProjImage] = useState<string>("");
  const [projImages, setProjImages] = useState<string[]>([]);
  const [projTechStack, setProjTechStack] = useState<string>("");
  const [aiGeneratingProj, setAiGeneratingProj] = useState<boolean>(false);

  // Image Crop States
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [cropperSrc, setCropperSrc] = useState<string>("");
  const [cropperMode, setCropperMode] = useState<"avatar" | "project_cover" | "project_gallery" | null>(null);

  const handleCroppedPhoto = (croppedBase64: string) => {
    if (cropperMode === "avatar") {
      setPhotoURL(croppedBase64);
    } else if (cropperMode === "project_cover") {
      setProjImage(croppedBase64);
    } else if (cropperMode === "project_gallery") {
      setProjImages([...projImages, croppedBase64]);
    }
  };

  // Form Fields - Add/Edit Social Link
  const [socId, setSocId] = useState<string | null>(null);
  const [socPlatform, setSocPlatform] = useState<string>("GitHub");
  const [socUrl, setSocUrl] = useState<string>("");

  // Sections Sequence layout order state
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(["experiences", "projects", "socialLinks"]);

  // Fetch logged in user portfolio profile
  const loadUserPortfolio = async () => {
    if (!bearerToken) return;
    setLoading(true);
    setErrorStatus(null);
    try {
      // Since we don't know the username yet, we try to fetch via a list or we can fetch directly using the bearerToken's user claims.
      // Wait, our backend endpoint `/api/portfolios/:username` queries by username. If we have been signed in, wait! 
      // How does the dashboard find their username first?
      // Let's call `/api/portfolio` (with GET or let the authentication return their profile). Wait, let's request the full list or try to fetch 'john-doe' initially if they logged in as mock.
      // Even better! We can call a PUT or POST to `/api/portfolio` to create/lookup.
      // Wait, let's do a simple lookup! If they have a username saved in state (e.g. username), fetch it.
      // If we don't have username yet, we can check if they are "john-doe" or we can trigger check.
      const lookupUser = username || "john-doe";
      const response = await fetch(`/api/portfolios/${lookupUser}`);
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
        // Prepopulate form fields
        setTempUsername(data.username);
        setDisplayName(data.displayName);
        setBio(data.bio);
        setPhotoURL(data.photoURL);
        setTheme(data.theme);
        setCvUrl(data.cvUrl || "");
        setIsCvLocalUpload(!!data.cvUrl && (data.cvUrl.startsWith("data:") || data.cvUrl.includes("/cv") || data.cvUrl.startsWith("/api/")));
        setTagline(data.tagline || "");
        setSkills(data.skills || "");
        setDepartment(data.department || "it");
        setSectionsOrder(data.sectionsOrder || ["experiences", "projects", "socialLinks"]);
        setUsername(data.username);
      } else {
        // If portfolio not found, we will guide them to initialize a new one!
        setPortfolio(null);
        if (username) {
          setTempUsername(username);
          setDisplayName(username.split(/[_\-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
          setBio("I am a passionate software developer building elegant applications and interactive digital products.");
          setTagline("Software Engineer & Creator");
          setSkills("React, TypeScript, Node.js, Tailwind CSS");
        }
      }
    } catch (err: any) {
      console.warn("Could not find previous portfolio, guiding user to create a new one.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bearerToken) {
      loadUserPortfolio();
    }
  }, [bearerToken]);

  // Handle template selection & publication updates
  const handleSelectTemplate = async (templateId: string) => {
    if (!portfolio || !bearerToken) return;
    setTheme(templateId);
    setSaveStatus("saving");
    setErrorStatus(null);

    const payload = {
      username: portfolio.username,
      displayName,
      bio,
      photoURL,
      theme: templateId,
      sectionsOrder,
      cvUrl,
      tagline,
      skills,
      department
    };

    try {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("The server response could not be parsed.");
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to update visual identity theme");
      }

      setPortfolio(data);
      setTheme(data.theme);
      const templateName = PREMIUM_TEMPLATES.find(p => p.id === templateId)?.name || templateId;
      setSaveStatus("Success! Portfolio theme switched to " + templateName);
      setToastMessage(`Theme switched to "${templateName}" successfully!`);
      setTimeout(() => setSaveStatus(null), 3000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to update visual identity template.");
      setSaveStatus(null);
    }
  };

  // Save or Create Portfolio Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerToken) return;
    setSaveStatus("saving");
    setIsProfileSaving(true);
    setProfileSaveSuccess(false);
    setErrorStatus(null);

    const isCreativeInit = !portfolio;
    const url = "/api/portfolio";
    const method = isCreativeInit ? "POST" : "PUT";

    const payload = {
      username: tempUsername,
      displayName,
      bio,
      photoURL,
      theme,
      sectionsOrder,
      cvUrl,
      tagline,
      skills,
      department
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("The server response could not be parsed. The server may be undergoing maintenance or restarting.");
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile record");
      }

      setPortfolio(data);
      setUsername(data.username);
      if (data.cvUrl) {
        setCvUrl(data.cvUrl);
      }
      setSaveStatus("success");
      setIsProfileSaving(false);
      setProfileSaveSuccess(true);
      setToastMessage("Your profile information and style mapping have been saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      console.error(error);
      setErrorStatus(error.message);
      setSaveStatus(null);
      setIsProfileSaving(false);
      setProfileSaveSuccess(false);
    }
  };

  // --- Experiences CRUD Actions ---

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerToken) return;
    setSaveStatus("saving");
    setIsExperienceSaving(true);
    setExperienceSaveSuccess(false);

    const isEditing = !!expId;
    const url = isEditing ? `/api/portfolio/experiences/${expId}` : "/api/portfolio/experiences";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify({
          role: expRole,
          company: expCompany,
          startDate: expStart,
          endDate: expEnd || null,
          description: expDesc,
          order: 1
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("The server response could not be parsed. The server may be undergoing maintenance or restarting.");
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to save experience");
      }

      // Reload profile
      await loadUserPortfolio();
      
      // Clear experience fields
      setExpId(null);
      setExpRole("");
      setExpCompany("");
      setExpStart("");
      setExpEnd("");
      setExpDesc("");
      
      setSaveStatus("success");
      setIsExperienceSaving(false);
      setExperienceSaveSuccess(true);
      setToastMessage(isEditing ? "Work experience record updated successfully!" : "New work experience added successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      setTimeout(() => setExperienceSaveSuccess(false), 3000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message);
      setSaveStatus(null);
      setIsExperienceSaving(false);
      setExperienceSaveSuccess(false);
    }
  };

  const handleEditExpClick = (exp: Experience) => {
    setExpId(exp.id);
    setExpRole(exp.role);
    setExpCompany(exp.company);
    setExpStart(exp.startDate);
    setExpEnd(exp.endDate || "");
    setExpDesc(exp.description);
  };

  const handleDeleteExperience = async (id: string) => {
    if (!bearerToken || !window.confirm("Are you sure you want to delete this experience record?")) return;
    setErrorStatus(null);
    try {
      const response = await fetch(`/api/portfolio/experiences/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${bearerToken}`
        }
      });
      if (response.ok) {
        await loadUserPortfolio();
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorStatus(errData.error || `Failed to delete experience (Status ${response.status})`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to delete experience due to networking errors.");
    }
  };

  // --- Projects CRUD Actions ---

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerToken) return;
    setSaveStatus("saving");
    setIsProjectSaving(true);
    setProjectSaveSuccess(false);

    const isEditing = !!projId;
    const url = isEditing ? `/api/portfolio/projects/${projId}` : "/api/portfolio/projects";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify({
          title: projTitle,
          description: projDesc,
          link: projLink,
          demoLink: projDemoLink,
          imageURL: projImage,
          images: projImages,
          techStack: projTechStack,
          order: 1
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("The server response could not be parsed. The server may be undergoing maintenance or restarting.");
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to save project");
      }

      await loadUserPortfolio();
      
      setProjId(null);
      setProjTitle("");
      setProjDesc("");
      setProjLink("");
      setProjDemoLink("");
      setProjImage("");
      setProjImages([]);
      setProjTechStack("");
      
      setSaveStatus("success");
      setIsProjectSaving(false);
      setProjectSaveSuccess(true);
      setToastMessage(isEditing ? "Project showcase record updated successfully!" : "New showcase project added successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      setTimeout(() => setProjectSaveSuccess(false), 3000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message);
      setSaveStatus(null);
      setIsProjectSaving(false);
      setProjectSaveSuccess(false);
    }
  };

  const handleEditProjClick = (p: Project) => {
    setProjId(p.id);
    setProjTitle(p.title);
    setProjDesc(p.description);
    setProjLink(p.link);
    setProjDemoLink(p.demoLink || "");
    setProjImage(p.imageURL || "");
    setProjImages(p.images || []);
    setProjTechStack(p.techStack || "");
  };

  const handleDeleteProject = async (id: string) => {
    if (!bearerToken || !window.confirm("Are you sure you want to delete this project showcase?")) return;
    try {
      const response = await fetch(`/api/portfolio/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${bearerToken}`
        }
      });
      if (response.ok) {
        await loadUserPortfolio();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Social Links CRUD Actions ---

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerToken) return;
    setSaveStatus("saving");
    setIsSocialSaving(true);
    setSocialSaveSuccess(false);

    const isEditing = !!socId;
    const url = isEditing ? `/api/portfolio/social/${socId}` : "/api/portfolio/social";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify({
          platform: socPlatform,
          url: socUrl,
          order: 1
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save social channel link");
      }

      await loadUserPortfolio();
      
      setSocId(null);
      setSocPlatform("GitHub");
      setSocUrl("");
      
      setSaveStatus("success");
      setIsSocialSaving(false);
      setSocialSaveSuccess(true);
      setToastMessage(isEditing ? "Social link updated successfully!" : "Social link added successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      setTimeout(() => setSocialSaveSuccess(false), 3000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message);
      setSaveStatus(null);
      setIsSocialSaving(false);
      setSocialSaveSuccess(false);
    }
  };

  const handleEditSocClick = (s: SocialLink) => {
    setSocId(s.id);
    setSocPlatform(s.platform);
    setSocUrl(s.url);
  };

  const handleDeleteSocial = async (id: string) => {
    if (!bearerToken || !window.confirm("Delete this social link?")) return;
    try {
      const response = await fetch(`/api/portfolio/social/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${bearerToken}`
        }
      });
      if (response.ok) {
        await loadUserPortfolio();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Section Sequencing Ordering ---

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (!bearerToken) return;
    const newOrder = [...sectionsOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    // Swap values
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setSectionsOrder(newOrder);

    // Dynamic save re-ordering
    try {
      await fetch("/api/portfolio/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearerToken}`
        },
        body: JSON.stringify({ sectionsOrder: newOrder })
      });
      
      if (portfolio) {
        setPortfolio({ ...portfolio, sectionsOrder: newOrder });
      }
    } catch (err) {
      console.error("Failed to re-order sections on server", err);
    }
  };

  // --- AI Copilot Generation via Gemini ---

  const handleGenerateAI = async (type: "bio" | "experience" | "project") => {
    setSaveStatus(null);
    setErrorStatus(null);

    let promptText = "";
    let role = "";
    let company = "";

    if (type === "bio") {
      if (!bio) {
        setErrorStatus("Please write a few words or keywords in the Bio input, and I will expand it!");
        return;
      }
      promptText = bio;
    } else if (type === "experience") {
      if (!expDesc) {
        setErrorStatus("Please write rough bullets/keywords in the Description, and I will polish them!");
        return;
      }
      promptText = expDesc;
      role = expRole;
      company = expCompany;
      setAiGeneratingExp(true);
    } else if (type === "project") {
      if (!projDesc) {
        setErrorStatus("Please write rough descriptors of the project, and I will polish them!");
        return;
      }
      promptText = projDesc;
      setAiGeneratingProj(true);
    }

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type, promptText, role, company })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("The AI suggestion service returned an unparsable response. Please verify key settings or try again.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Gemini suggestions had a loading error.");
      }

      const generated = data.result;
      if (type === "bio") {
        setBio(generated);
      } else if (type === "experience") {
        setExpDesc(generated);
      } else if (type === "project") {
        setProjDesc(generated);
      }
      
      if (data.isFallback) {
        if (data.isQuotaError) {
          setSaveStatus("💡 Local smart suggestion loaded! (Gemini API key is out of credits, showing local fallback).");
        } else {
          setSaveStatus("💡 Local smart suggestion loaded! (Showing resilient offline fallback).");
        }
      } else {
        setSaveStatus("AI refinement generated successfully!");
      }
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Could not reach Gemini API. Is your GEMINI_API_KEY set up?");
    } finally {
      setAiGeneratingExp(false);
      setAiGeneratingProj(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Save Status / Error Notification popups */}
      {saveStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span>{saveStatus === "saving" ? "Updating cloud data..." : saveStatus === "success" ? "All changes synced & saved successfully!" : saveStatus}</span>
          </div>
        </div>
      )}

      {errorStatus && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorStatus}</span>
        </div>
      )}

      {/* Dashboard Top Identity card */}
      <div className="bg-white border border-gray-150/80 rounded-xl p-6 text-gray-950 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
            {photoURL ? (
              <img src={photoURL} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="font-sans font-bold text-gray-900 text-sm tracking-wider uppercase">Sandbox Developer Panel</h2>
            <p className="text-xs text-gray-500 mt-1">
              Active Session Token: <code className="bg-gray-100 font-bold px-2 py-0.5 rounded font-mono text-xs text-black/80 select-all">{uid}</code>
            </p>
          </div>
        </div>

        {portfolio ? (
          <div className="flex items-center gap-2.5">
            <button
              id="dash_copy_live_link_btn"
              type="button"
              onClick={() => {
                const shareUrl = `${window.location.origin}/#/${portfolio.username}`;
                navigator.clipboard.writeText(shareUrl);
                setSaveStatus("Portfolio public link copied to clipboard: " + shareUrl);
                setTimeout(() => setSaveStatus(null), 3500);
              }}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              title="Copy portfolio link to clipboard"
            >
              <span>Copy Public URL</span>
            </button>
            <a
              id="dash_view_live_top_btn"
              href={`#/${portfolio.username || "john-doe"}`}
              className="bg-black hover:bg-gray-800 text-xs text-white font-semibold tracking-wide uppercase px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Live Website</span>
            </a>
          </div>
        ) : (
          <span className="text-[11px] font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg uppercase">
            ⚠️ Configure and map your initial profile handle below
          </span>
        )}
      </div>

      {/* Dashboard central navigation tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
        <button
          id="btn_tab_templates"
          onClick={() => { setActiveTab("templates"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "templates" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Templates & Live Preview</span>
        </button>

        <button
          id="btn_tab_profile"
          onClick={() => { setActiveTab("profile"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "profile" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Theme</span>
        </button>

        <button
          id="btn_tab_experiences"
          onClick={() => { setActiveTab("experiences"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "experiences" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
          disabled={!portfolio}
          title={!portfolio ? "Create profile mapping first" : ""}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Work Experiences</span>
        </button>

        <button
          id="btn_tab_projects"
          onClick={() => { setActiveTab("projects"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "projects" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
          disabled={!portfolio}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Showcase Projects</span>
        </button>

        <button
          id="btn_tab_social"
          onClick={() => { setActiveTab("social"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "social" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
          disabled={!portfolio}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Channels & Networks</span>
        </button>

        <button
          id="btn_tab_sequence"
          onClick={() => { setActiveTab("sequence"); setErrorStatus(null); }}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "sequence" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black cursor-pointer"
          }`}
          disabled={!portfolio}
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Section Sequence</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focused Editors */}
        <div 
          id="editor_left_column" 
          className="lg:col-span-7 space-y-6"
          onFocusCapture={(e) => {
            const id = (e.currentTarget.id === e.target.id) ? "" : (e.target as HTMLElement).id;
            if (id) {
              if (id.startsWith("profile_input_")) {
                const subStr = id.replace("profile_input_", "");
                if (subStr.startsWith("skills")) {
                  setFocusedField("skills");
                } else if (subStr === "username" || subStr === "theme") {
                  setFocusedField(null);
                } else {
                  setFocusedField(subStr); // displayName, tagline, bio, photoURL
                }
              } else if (id.includes("exp_")) {
                setFocusedField("experiences");
              } else if (id.includes("proj_")) {
                setFocusedField("projects");
              } else if (id.includes("soc_")) {
                setFocusedField("socialLinks");
              }
            }
          }}
          onBlurCapture={() => {
            setFocusedField(null);
          }}
        >

          <AnimatePresence mode="wait">
          {/* TAB 1: PROFILE SETUP / METADATA */}
          {activeTab === "profile" && (
        <motion.form
          onSubmit={handleSaveProfile}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
          key="profile"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <h3 className="font-display font-bold text-slate-800 text-md">Configure Metadata & Bio Card</h3>
            <span className="text-xs text-indigo-600 font-medium font-mono">POST/PUT /api/portfolio</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Choice Username Handle (Unique URL)</label>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center text-slate-400 text-xs font-mono">@</span>
                <input
                  id="profile_input_username"
                  type="text"
                  required
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ""))}
                  className="w-full border border-slate-200 rounded-lg text-xs font-mono pl-7 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="johndoe"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Live link will become: <code className="bg-slate-100 font-mono text-[9px] px-1 rounded">/#/username</code></span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Official Display Name</label>
              <input
                id="profile_input_display"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Department / Industry Category</label>
              <select
                id="profile_input_department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="it">💻 IT & Software Engineering</option>
                <option value="mechanical">⚙️ Mechanical & Civil Engineering</option>
                <option value="other">🎨 Other / Management / Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Professional Tagline / Job Title</label>
              <input
                id="profile_input_tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                placeholder="Data Scientist & ML Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Avatar / Profile Photo</label>
              <div className="flex gap-2">
                <input
                  id="profile_input_photo"
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="Image URL or local file upload"
                />
                <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-indigo-100 transition shrink-0 flex items-center justify-center">
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCropperSrc(reader.result as string);
                          setCropperMode("avatar");
                          setCropperOpen(true);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Visual Identity Theme</label>
              <select
                id="profile_select_theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="light">Crisp Warm Minimalist (light)</option>
                <option value="dark">Deep Ambient Space-Tech (dark)</option>
                <option value="sunset">Sunset Rose & Warm Amber Decó (sunset)</option>
                <option value="cyber">Cyberpunk High-Contrast Brutalist (cyber)</option>
                <option value="slate">Modern Architecture Swiss-Neo (slate)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Recruiter CV / Resume Document</label>
              
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60 max-w-xs mb-3">
                <button
                  type="button"
                  onClick={() => setIsCvLocalUpload(false)}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-md transition cursor-pointer text-center ${
                    !isCvLocalUpload 
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Enter Document URL
                </button>
                <button
                  type="button"
                  onClick={() => setIsCvLocalUpload(true)}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-md transition cursor-pointer text-center ${
                    isCvLocalUpload 
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Upload Local File
                </button>
              </div>

              {isCvLocalUpload ? (
                <div className="space-y-2 animate-fade-in">
                  {cvUrl && (cvUrl.startsWith("data:") || cvUrl.includes("/cv") || cvUrl.startsWith("/api/")) ? (
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2.5 bg-emerald-500 text-white rounded-lg">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-emerald-950">CV &amp; Resume Saved</p>
                          <p className="text-[10px] text-emerald-700/80 font-mono">
                            {cvUrl.startsWith("data:") 
                              ? `Type: Encoded Local Asset (~${Math.round(cvUrl.length / 1024)} KB)` 
                              : "Type: Secure Cloud Database Asset (Highly Optimized)"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCvUrl("");
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-full transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                      <UploadCloud className="w-8 h-8 text-indigo-500 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-slate-800">Click to upload CV / Resume from device</span>
                      <span className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, JPG &amp; Word Docs (Max 600KB to ensure robust cloud storage and database synchronization)</span>
                      <input
                        id="local_cv_file_uploader_input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 600 * 1024) {
                              alert("File is too large! Please upload a PDF or document under 600KB to ensure robust cloud storage and database sync.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCvUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <input
                    id="profile_input_cv"
                    type="url"
                    value={(cvUrl.startsWith("data:") || cvUrl.includes("/cv") || cvUrl.startsWith("/api/")) ? "" : cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono bg-indigo-50/10 placeholder-gray-400"
                    placeholder="https://drive.google.com/file/d/... or any hosted CV URL"
                    disabled={cvUrl.startsWith("data:") || cvUrl.includes("/cv") || cvUrl.startsWith("/api/")}
                  />
                  {(cvUrl.startsWith("data:") || cvUrl.includes("/cv") || cvUrl.startsWith("/api/")) && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                      ⚠️ Note: You currently have a secure database resume asset uploaded. Clear it on the Local File tab to remove/replace it.
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-[10px] text-slate-400 leading-normal font-sans pt-1">
                Provide either an online link or direct device document. This automatically activates the recruiter &quot;Download CV (PDF)&quot; download actions inside your selected print layouts.
              </p>
            </div>

             <div className="md:col-span-2 relative">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Technical Skills & Competencies</label>
               
               {/* Clean, modern display tags */}
               <div className="flex flex-wrap gap-2 mb-3">
                 {(skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : []).length > 0 ? (
                   (skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : []).map((tag, idx) => (
                     <div 
                       key={idx}
                       className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium rounded-full border border-slate-200 transition"
                     >
                       <span className={`w-2 h-2 rounded-full ${getDotColor(tag)}`} />
                       <span>{tag}</span>
                       <button
                         type="button"
                         onClick={() => handleRemoveSkill(tag)}
                         className="text-slate-400 hover:text-red-500 hover:scale-110 ml-0.5 p-0.5 cursor-pointer rounded-full transition"
                         title={`Remove ${tag}`}
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))
                 ) : (
                   <span className="text-[11px] text-slate-400 italic">No skills added yet. Type below to search or add your skills!</span>
                 )}
               </div>

               {/* Search/input autocomplete box */}
               <div className="relative z-50">
                 <input
                   id="profile_input_skills_search"
                   type="text"
                   value={skillInput}
                   onChange={(e) => {
                     setSkillInput(e.target.value);
                     setShowSkillSuggestions(true);
                   }}
                   onFocus={() => setShowSkillSuggestions(true)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter") {
                       e.preventDefault();
                       if (skillInput.trim()) {
                         handleAddSkill(skillInput.trim());
                       }
                     }
                   }}
                   className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 font-sans"
                   placeholder="Search skills (e.g. Python, React, SQL) or type custom and click Enter..."
                 />

                 {/* Autocomplete dropdown / suggestions */}
                 {showSkillSuggestions && skillInput.trim().length > 0 && (
                   <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                     {(() => {
                       const currentSkillsArray = skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : [];
                       const filteredObj = ALL_PRESET_SKILLS.filter(
                         (preset) =>
                           preset.toLowerCase().includes(skillInput.toLowerCase()) &&
                           !currentSkillsArray.some((s) => s.toLowerCase() === preset.toLowerCase())
                       );
                       if (filteredObj.length > 0) {
                         return filteredObj.map((suggestion, idx) => (
                           <button
                             key={idx}
                             type="button"
                             onClick={() => handleAddSkill(suggestion)}
                             className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 text-slate-700 cursor-pointer flex items-center gap-2 border-b border-slate-50 last:border-0"
                           >
                             <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(suggestion)}`} />
                             {suggestion}
                           </button>
                         ));
                       } else {
                         return (
                           <button
                             type="button"
                             onClick={() => handleAddSkill(skillInput)}
                             className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-indigo-600 font-semibold cursor-pointer flex items-center gap-1"
                           >
                             <Plus className="w-3 h-3" /> Add Custom Skill &apos;{skillInput}&apos;
                           </button>
                         );
                       }
                     })()}
                   </div>
                 )}
               </div>

               {/* Dropdown background click controller to close suggestions list */}
               {showSkillSuggestions && (
                 <div 
                   className="fixed inset-0 z-40 bg-transparent" 
                   onClick={() => setShowSkillSuggestions(false)} 
                 />
               )}

               <p className="text-[10px] text-slate-400 mt-1.5">
                 Click on matching dropdown suggestions, or press Enter to register any custom technologies. These appear in an animated, interactive badge cloud in your public view.
               </p>
             </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Interactive Professional Biography</label>
              <button
                type="button"
                onClick={() => handleGenerateAI("bio")}
                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                title="Polish draft using Google Gemini SDK"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Refine Bio with Gemini AI</span>
              </button>
            </div>
            <textarea
              id="profile_input_bio"
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              placeholder="Write a rough draft of your technical bio or experience. Click the button to the right to let Gemini AI polish it into a masterpiece..."
            />
          </div>

          <div className="flex justify-end">
            <button
              id="profile_submit_btn"
              type="submit"
              disabled={isProfileSaving}
              className={`font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                profileSaveSuccess 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600" 
                  : isProfileSaving
                  ? "bg-slate-750 text-slate-300 cursor-wait border border-slate-600"
                  : "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white"
              }`}
            >
              {isProfileSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
                  <span>Synchronizing...</span>
                </>
              ) : profileSaveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>Profile Saved Successfully!</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{!portfolio ? "Bootstrap Initial Portfolio profile" : "Overwrite Profile & Theme Mapping"}</span>
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}

      {/* TAB 2: WORK EXPERIENCES */}
      {activeTab === "experiences" && portfolio && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          key="experiences"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          
          {/* Add / Edit Experience Form panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-max">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 text-sm">
                {expId ? "Edit Experience Entry" : "Register Work History"}
              </h3>
              <span className="text-[10px] font-mono text-indigo-500">POST/PUT experiences</span>
            </div>

            <form onSubmit={handleSaveExperience} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Company/Entity</label>
                <input
                  id="exp_input_company"
                  type="text"
                  required
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Professional Role/Title</label>
                <input
                  id="exp_input_role"
                  type="text"
                  required
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Data Scientist"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1 font-mono">Start Date</label>
                  <input
                    id="exp_input_start"
                    type="text"
                    required
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="2023-01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1 font-mono">End Date</label>
                  <input
                    id="exp_input_end"
                    type="text"
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="Present or 2026-06"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-500 font-medium">Achievements Summary</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAI("experience")}
                    disabled={aiGeneratingExp}
                    className="text-[9px] bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    {aiGeneratingExp ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                        <span>AI Polish</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="exp_input_desc"
                  rows={4}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  placeholder="Design machine learning workflows..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {expId && (
                  <button
                    id="exp_cancel_btn"
                    type="button"
                    onClick={() => {
                      setExpId(null);
                      setExpRole("");
                      setExpCompany("");
                      setExpStart("");
                      setExpEnd("");
                      setExpDesc("");
                    }}
                    className="text-slate-500 hover:text-slate-700 text-xs font-semibold"
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  id="exp_submit_btn"
                  type="submit"
                  disabled={isExperienceSaving}
                  className={`font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2 ml-auto ${
                    experienceSaveSuccess 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600" 
                      : isExperienceSaving
                      ? "bg-slate-700 text-slate-300 cursor-wait border border-slate-600"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isExperienceSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : experienceSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>{expId ? "Record Overwritten!" : "Experience Added!"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{expId ? "Overwrite Record" : "Add Experience"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* List display panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-medium text-slate-800 text-sm mb-4">Saved Experiences</h3>
            
            {(!portfolio.experiences || portfolio.experiences.length === 0) ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <Briefcase className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No experience records registered registered.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {portfolio.experiences.map((exp: Experience, idx: number) => (
                  <div id={`exp_item_${exp.id}`} key={exp.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs md:text-sm text-slate-800 truncate">{exp.role}</h4>
                        <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm shrink-0">ID: {exp.id}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{exp.company}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-1">{exp.startDate} — {exp.endDate || "Present"}</p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-3 select-none">{exp.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`exp_edit_btn_${exp.id}`}
                        onClick={() => handleEditExpClick(exp)}
                        className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                        title="Edit parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`exp_delete_btn_${exp.id}`}
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="p-1.5 hover:bg-white text-slate-600 hover:text-red-600 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 3: SHOWCASE PROJECTS */}
      {activeTab === "projects" && portfolio && (
        <motion.div
          className="space-y-6"
          key="projects"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          
          {/* Add / Edit Project Form panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto w-full">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 text-sm">
                {projId ? "Edit Project Details" : "Register Project Showcase"}
              </h3>
              <span className="text-[10px] font-mono text-indigo-500">POST/PUT projects</span>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Title</label>
                <input
                  id="proj_input_title"
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Neural Search Pipeline"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Description</label>
                <textarea
                  id="proj_input_description"
                  required
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Summarize key features, results, metrics, or backend deployments of this project..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Repository Link</label>
                  <input
                    id="proj_input_link"
                    type="url"
                    value={projLink}
                    onChange={(e) => setProjLink(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">Live Demo / Website Link</label>
                  <input
                    id="proj_input_demolink"
                    type="url"
                    value={projDemoLink}
                    onChange={(e) => setProjDemoLink(e.target.value)}
                    className="w-full border border-indigo-200 bg-indigo-50/10 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="https://myproject.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Technologies/Stack (Comma separated)</label>
                <input
                  id="proj_input_techstack"
                  type="text"
                  value={projTechStack}
                  onChange={(e) => setProjTechStack(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="TypeScript, React, Tailwind, Express"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cover / Main Project Image</label>
                <div className="flex gap-2">
                  <input
                    id="proj_input_image"
                    type="text"
                    value={projImage}
                    onChange={(e) => setProjImage(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="URL or Upload Image File"
                  />
                  <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-indigo-100 transition shrink-0 flex items-center justify-center">
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropperSrc(reader.result as string);
                            setCropperMode("project_cover");
                            setCropperOpen(true);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Gallery Showcase Images ({projImages.length}/4)</label>
                
                {projImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {projImages.map((img, index) => (
                      <div key={index} className="relative border border-slate-100 rounded-lg p-2 bg-slate-50 flex flex-col justify-between">
                        <div className="h-16 w-full rounded overflow-hidden mb-1 bg-white flex items-center justify-center">
                          {img ? (
                            <img src={img} alt="Screenshot" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-slate-400">Empty URL/Photo</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={img}
                            onChange={(e) => {
                              const updated = [...projImages];
                              updated[index] = e.target.value;
                              setProjImages(updated);
                            }}
                            className="flex-1 text-[9px] border border-slate-200 rounded px-1 py-0.5 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProjImages(projImages.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 font-bold"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {projImages.length < 4 && (
                  <div className="flex gap-2">
                    <label className="flex-1 bg-slate-50 border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 font-semibold px-3 py-2 rounded-lg text-xs cursor-pointer text-center hover:bg-slate-100 transition flex items-center justify-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Upload Gallery Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCropperSrc(reader.result as string);
                              setCropperMode("project_gallery");
                              setCropperOpen(true);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Project Description</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAI("project")}
                    disabled={aiGeneratingProj}
                    className="text-[9px] bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    {aiGeneratingProj ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                        <span>AI Polish</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="proj_input_desc"
                  required
                  rows={4}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  placeholder="Describe your technical architecture..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {projId && (
                  <button
                    id="proj_cancel_btn"
                    type="button"
                    onClick={() => {
                      setProjId(null);
                      setProjTitle("");
                      setProjDesc("");
                      setProjLink("");
                      setProjDemoLink("");
                      setProjImage("");
                      setProjImages([]);
                      setProjTechStack("");
                    }}
                    className="text-slate-500 hover:text-slate-700 text-xs font-semibold"
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  id="proj_submit_btn"
                  type="submit"
                  disabled={isProjectSaving}
                  className={`font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2 ml-auto ${
                    projectSaveSuccess 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600" 
                      : isProjectSaving
                      ? "bg-slate-700 text-slate-300 cursor-wait border border-slate-600"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isProjectSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : projectSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>{projId ? "Showcase Overwritten!" : "Project Added!"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{projId ? "Overwrite Showcase" : "Add Project Showcase"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Projects lists display */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-medium text-slate-800 text-sm mb-4">Showcased Projects</h3>
            
            {(!portfolio.projects || portfolio.projects.length === 0) ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <FolderGit2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No project showcases registered registered.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.projects.map((proj: Project) => (
                  <div id={`proj_item_${proj.id}`} key={proj.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3 relative overflow-hidden shadow-xs">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-mono text-[8px] bg-amber-50 border border-amber-300/40 text-amber-700 px-1 rounded">ID: {proj.id}</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            id={`proj_edit_btn_${proj.id}`}
                            onClick={() => handleEditProjClick(proj)}
                            className="p-1 hover:bg-white text-slate-700 hover:text-indigo-600 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            id={`proj_delete_btn_${proj.id}`}
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1 hover:bg-white text-slate-700 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-display font-semibold text-xs text-slate-800 truncate">{proj.title}</h4>
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-3 leading-relaxed select-none">{proj.description}</p>
                    </div>

                    {proj.link && (
                      <a
                        id={`proj_link_sub_${proj.id}`}
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 font-semibold inline-flex items-center gap-1 mt-1 shrink-0 hover:underline"
                      >
                        <span>View Repository</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 4: SOCIAL CHANNELS */}
      {activeTab === "social" && portfolio && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          key="social"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-max">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 text-sm">
                {socId ? "Edit Network Handle" : "Register Social Handle"}
              </h3>
              <span className="text-[10px] font-mono text-indigo-500">POST/PUT social</span>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Platform Network</label>
                <select
                  id="soc_select_platform"
                  value={socPlatform}
                  onChange={(e) => setSocPlatform(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="GitHub">GitHub</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="X (Twitter)">X / Twitter</option>
                  <option value="Gmail">Gmail / Email</option>
                  <option value="Personal Website">Personal Website</option>
                  <option value="Medium / Blog">Medium / Blog</option>
                  <option value="HackerNews">HackerNews</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Direct URL Address</label>
                <input
                  id="soc_input_url"
                  type="text"
                  required
                  value={socUrl}
                  onChange={(e) => setSocUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="https://github.com/johndoe or mailto:your@email.com"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {socId && (
                  <button
                    id="soc_cancel_btn"
                    type="button"
                    onClick={() => {
                      setSocId(null);
                      setSocPlatform("GitHub");
                      setSocUrl("");
                    }}
                    className="text-slate-500 hover:text-slate-700 text-xs font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  id="soc_submit_btn"
                  type="submit"
                  disabled={isSocialSaving}
                  className={`font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2 ml-auto ${
                    socialSaveSuccess 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600" 
                      : isSocialSaving
                      ? "bg-slate-700 text-slate-300 cursor-wait border border-slate-600"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isSocialSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : socialSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>{socId ? "Channel Saved!" : "Channel Registered!"}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{socId ? "Change Link" : "Register Channel"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-medium text-slate-800 text-sm mb-4">Linked Social Networks</h3>
            
            {(!portfolio.socialLinks || portfolio.socialLinks.length === 0) ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <Link2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No social networks connected, connected.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {portfolio.socialLinks.map((soc: SocialLink) => (
                  <div id={`soc_item_${soc.id}`} key={soc.id} className="border border-slate-100 rounded-xl px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded mr-2 inline-block shrink-0">{soc.platform}</span>
                      <a href={soc.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline truncate select-all">{soc.url}</a>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        id={`soc_edit_btn_${soc.id}`}
                        onClick={() => handleEditSocClick(soc)}
                        className="p-1 hover:bg-white text-slate-500 rounded border border-transparent hover:border-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`soc_delete_btn_${soc.id}`}
                        onClick={() => handleDeleteSocial(soc.id)}
                        className="p-1 hover:bg-white text-slate-500 rounded border border-transparent hover:border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 5: SECTION SEQUENCING (REORDER) */}
      {activeTab === "sequence" && portfolio && (
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6"
          key="sequence"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-md">Section Sequence Order</h3>
              <p className="text-xs text-slate-500 mt-0.5">Determine the vertical stack sequence of components on your live portfolio.</p>
            </div>
            <span className="text-xs text-indigo-600 font-medium font-mono">POST /api/portfolio/order</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Interactive sequencing controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-3">
                {sectionsOrder.map((section, idx) => {
                  let labelName = "Experiences Section";
                  if (section === "projects") labelName = "Projects Showcase";
                  if (section === "socialLinks") labelName = "Social Handles & Links";

                  return (
                    <div
                      id={`ordering_element_${section}`}
                      key={section}
                      className="flex items-center justify-between p-4 border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 font-display font-semibold text-xs md:text-sm text-slate-800 rounded-xl shadow-xs transition-all animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs shadow-xs">
                          {idx + 1}
                        </span>
                        <span>{labelName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`order_up_${section}`}
                          type="button"
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-2 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`order_down_${section}`}
                          type="button"
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sectionsOrder.length - 1}
                          className="p-2 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Orchestrator Animation panel */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center select-none relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
              <div className="w-40 h-40 md:w-52 md:h-52 relative z-10">
                <LottieTaskAssigning />
              </div>
              <h4 className="font-sans font-bold text-slate-900 text-sm mt-3 relative z-10">Layout Orchestration</h4>
              <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed max-w-xs relative z-10">
                Arrange and stack your profile sections in whatever sequence you desire. Changes apply instantly to your public template!
              </p>
            </div>

          </div>

          <p className="text-center text-[10px] text-slate-400 select-none pt-2">
            🔀 Rearranging items immediately triggers the security-verified sequence API endpoint `/api/portfolio/order` in the backend.
          </p>
        </motion.div>
      )}

      {/* TAB 6: TEMPLATES GALLERY */}
      {activeTab === "templates" && (
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5"
          key="templates"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">Choose Live Portfolio Template</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any visual skin below to watch your layout systems, typography pairings, and element styles transform live on screen instantly.</p>
            </div>
            <div>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Active Theme: {PREMIUM_TEMPLATES.find(t => t.id === theme)?.name || theme}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Grid: All 15 Templates */}
            <div className="bg-slate-50 border border-slate-200/60 p-3 sm:p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Resume Theme ({PREMIUM_TEMPLATES.length} Styles)</span>
                </h4>
              </div>

              {/* Canva-Style Category Filter Dropdown */}
              <div className="bg-slate-50 border border-slate-205 rounded-xl p-3.5 space-y-3 mt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono block">
                        Professional Department Matcher
                      </span>
                      <p className="text-[9px] text-slate-400">Filter themes tailor-made for your field</p>
                    </div>
                  </div>
                  
                  {/* High fidelity dropdown select menu */}
                  <div className="relative min-w-[210px] w-full md:w-auto">
                    <select
                      id="department-theme-dropdown"
                      value={templateFilter}
                      onChange={(e) => setTemplateFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-indigo-500/50 text-slate-800 text-[11px] font-bold rounded-lg py-2 pl-3 pb-2 pr-9 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-650 transition-all appearance-none"
                    >
                      <option value="all">✨ All Specialized Light Themes</option>
                      <option value="it">💻 IT & Software Systems ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["light", "matte_studio", "oceanic_breeze", "slate"].includes(t.id)).length} Skins)</option>
                      <option value="mechanical">⚙️ Mechanical & Aerospace ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["corporate_suite", "minty_forest", "warm_terracotta", "field_notes"].includes(t.id)).length} Skins)</option>
                      <option value="medical">🏥 Healthcare & Clinical ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["clinical_science", "oceanic_breeze", "minty_forest"].includes(t.id)).length} Skins)</option>
                      <option value="finance">💼 Finance & Management ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["finance_executive", "corporate_suite", "slate"].includes(t.id)).length} Skins)</option>
                      <option value="design">📐 Architecture & Creative Studio ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["creative_gallery", "creative_editorial", "matte_studio", "museum_exhibition"].includes(t.id)).length} Skins)</option>
                      <option value="biotech">🔬 Biotech & Academic Research ({PREMIUM_TEMPLATES.filter(t => !["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"].includes(t.id) && ["biotech_research", "academic_serif", "antique_newsprint"].includes(t.id)).length} Skins)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Smaller templates view block with local scrolling list */}
              <div className="max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-slate-50/30 p-2 rounded-xl border border-slate-200/50">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PREMIUM_TEMPLATES.filter((t) => {
                    // Exclude dark themes entirely
                    const darkThemes = ["dark", "sunset", "cyber", "neon_nights", "glassmorphism", "royal_gold", "cyberpunk", "midnight_slate"];
                    if (darkThemes.includes(t.id)) return false;

                    if (templateFilter === "all") return true;

                    if (templateFilter === "it") {
                      return ["light", "matte_studio", "oceanic_breeze", "slate"].includes(t.id);
                    }
                    if (templateFilter === "mechanical") {
                      return ["corporate_suite", "minty_forest", "warm_terracotta", "field_notes"].includes(t.id);
                    }
                    if (templateFilter === "medical") {
                      return ["clinical_science", "oceanic_breeze", "minty_forest"].includes(t.id);
                    }
                    if (templateFilter === "finance") {
                      return ["finance_executive", "corporate_suite", "slate"].includes(t.id);
                    }
                    if (templateFilter === "design") {
                      return ["creative_gallery", "creative_editorial", "matte_studio", "museum_exhibition"].includes(t.id);
                    }
                    if (templateFilter === "biotech") {
                      return ["biotech_research", "academic_serif", "antique_newsprint"].includes(t.id);
                    }

                    return true;
                  }).map((t) => {
                    const isActive = theme === t.id;

                    const isItRec = ["light", "matte_studio", "oceanic_breeze", "slate"].includes(t.id);
                    const isMechRec = ["corporate_suite", "minty_forest", "warm_terracotta", "field_notes"].includes(t.id);
                    const isMedRec = ["clinical_science"].includes(t.id);
                    const isFinRec = ["finance_executive"].includes(t.id);
                    const isDesRec = ["creative_gallery", "creative_editorial"].includes(t.id);
                    const isBioRec = ["biotech_research", "academic_serif"].includes(t.id);

                    let recommendationBadge = null;
                    if (isItRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          💻 IT
                        </span>
                      );
                    } else if (isMechRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          ⚙️ Mech
                        </span>
                      );
                    } else if (isMedRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-teal-50 border border-teal-150 text-teal-700 text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          🏥 Med
                        </span>
                      );
                    } else if (isFinRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-amber-50 border border-amber-200 text-[#b45309] text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          💼 Exec
                        </span>
                      );
                    } else if (isDesRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-pink-50 border border-pink-150 text-pink-700 text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          📐 Studio
                        </span>
                      );
                    } else if (isBioRec) {
                      recommendationBadge = (
                        <span className="absolute top-1.5 right-1.5 bg-green-50 border border-green-150 text-green-700 text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded-full select-none z-10 shadow-3xs">
                          🔬 Lab
                        </span>
                      );
                    }

                    return (
                      <motion.button
                        key={t.id}
                        layout
                        type="button"
                        onClick={() => handleSelectTemplate(t.id)}
                        whileHover={{ y: -4, scale: 1.015, boxShadow: "0 6px 16px rgba(99,102,241,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className={`p-1.5 rounded-lg text-left border select-none relative flex flex-col justify-between cursor-pointer group ${
                          isActive
                            ? "bg-indigo-50/25 border-indigo-500 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-350"
                        }`}
                      >
                        {recommendationBadge}
                        
                        {isActive && (
                          <motion.div 
                            layoutId="activeThemeHighlight" 
                            className="absolute inset-0 border-2 border-indigo-600 rounded-lg pointer-events-none z-20"
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        )}

                        {/* Integrated High-Fidelity Mockup Representing the Template's UI structure */}
                        <div className="mb-1.5 w-full">
                          <MiniTemplateMockup 
                            template={t} 
                            isActive={isActive} 
                            userDisplayName={displayName}
                            userTagline={tagline}
                            userPhotoURL={photoURL}
                            userBio={bio}
                            userSkills={skills}
                            userExperiences={portfolio?.experiences || []}
                            userProjects={portfolio?.projects || []}
                          />
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-[8.5px] text-slate-800 group-hover:text-indigo-650 transition-colors uppercase tracking-tight truncate block max-w-[85%]">
                              {t.name}
                            </span>
                            {isActive && (
                              <span className="bg-indigo-600 text-white rounded-full p-0.5 scale-75 shrink-0 z-10">
                                <Check className="w-2 h-2 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[7.5px] text-slate-400 line-clamp-1 leading-snug">
                            {t.desc}
                          </p>

                          <div className="flex items-center justify-between text-[7px] pt-1 border-t border-slate-100 font-mono mt-0.5">
                            <span className="text-slate-500 font-bold uppercase tracking-tight">{t.layoutType}</span>
                            <span className="text-indigo-650 font-black">{isActive ? "Active" : "Use"}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

        </div> {/* End of Left Column: Focused Editors */}

        {/* Right Column: Sticky Live Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          {(() => {
            const activeTemplate = PREMIUM_TEMPLATES.find(t => t.id === theme) || PREMIUM_TEMPLATES[0];
            const displayUsername = portfolio?.username || tempUsername || "your-handle";
            const actualPortfolio: Portfolio = {
              ownerId: portfolio?.ownerId || uid || "",
              username: displayUsername,
              displayName: displayName || "Your Name",
              bio: bio || "Bio and objective statement here...",
              photoURL: photoURL || "",
              theme: theme || "light",
              sectionsOrder: sectionsOrder || ["experiences", "projects", "socialLinks"],
              cvUrl: cvUrl || "",
              tagline: tagline || "Your Tagline",
              skills: skills || "",
              experiences: portfolio?.experiences || [],
              projects: portfolio?.projects || [],
              socialLinks: portfolio?.socialLinks || [],
            };
            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 text-[#F8F6F0] p-4 rounded-xl shadow-md">
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-wider text-xs text-indigo-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Interactive Live Blueprint Previewer</span>
                    </h4>
                    <p className="text-[10px] text-stone-350 mt-1 font-mono">
                      Theme: <strong className="text-emerald-400 uppercase font-bold">{activeTemplate.name}</strong> (@{displayUsername})
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {/* Copy Link Action */}
                    <button
                      type="button"
                      onClick={() => {
                        const absoluteUrl = `${window.location.origin}/#/${displayUsername}`;
                        navigator.clipboard.writeText(absoluteUrl);
                        setToastMessage("Copied profile URL to clipboard!");
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase cursor-pointer shadow-xs transition-all duration-150"
                    >
                      <Copy className="w-3 h-3 text-white" />
                      <span>Copy Link</span>
                    </button>

                    <a
                      href={`#/${displayUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#F8F6F0] hover:bg-stone-200 text-stone-950 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase cursor-pointer shadow-xs transition-all duration-150"
                    >
                      <span>Web Link</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-950" />
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/60 shadow-xs">
                  <StaticTemplatePreview
                    template={activeTemplate}
                    portfolio={actualPortfolio}
                    loggedInUsername={username}
                    focusedField={focusedField}
                    onSectionClick={(targetTab) => {
                      if (targetTab === "social") {
                        setActiveTab("social");
                      } else {
                        setActiveTab(targetTab);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

      </div> {/* End of grid split screen wrapper */}

      {/* Universal Image Cropper / Photo Cutter modal overlay */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        onCrop={handleCroppedPhoto}
        onClose={() => {
          setCropperOpen(false);
          setCropperSrc("");
          setCropperMode(null);
        }}
        isCircular={cropperMode === "avatar"}
        aspectRatio={cropperMode === "avatar" ? 1 : 16 / 9}
        title={
          cropperMode === "avatar" 
            ? "Configure Avatar Photo" 
            : cropperMode === "project_cover" 
            ? "Configure Project Cover" 
            : "Configure Gallery Screenshot"
        }
      />

      {/* Dynamic Toast Feedback Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-emerald-100 text-slate-800 font-sans pl-4 pr-5 py-3.5 rounded-xl shadow-2xl ring-1 ring-black/[0.03]"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-600 font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync State</span>
              <span className="text-xs font-semibold text-slate-800 leading-tight mt-0.5">{toastMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-50 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
