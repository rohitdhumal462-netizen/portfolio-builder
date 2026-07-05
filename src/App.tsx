/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { auth, usingRealFirebase } from "./firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  User, Globe, ShieldCheck, LogIn, LogOut, Search, 
  Laptop, LayoutGrid, Sparkles, BookOpen, Key, Mail, Lock, UserCheck, CheckCircle2, ChevronRight,
  Eye, EyeOff
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import LivePortfolio, { PREMIUM_TEMPLATES } from "./components/LivePortfolio";
import MiniTemplateMockup from "./components/MiniTemplateMockup";
import LottieLogo from "./components/LottieLogo";
import LottieTaskAssigning from "./components/LottieTaskAssigning";
import lottie from "lottie-web";
import lottieAnimationData from "../assets/7a30479a-1163-11ee-9c3e-57d261ae916e.json";

export default function App() {
  const lottieContainerRef = React.useRef<HTMLDivElement>(null);
  
  const tLight = PREMIUM_TEMPLATES.find(t => t.id === "light") || PREMIUM_TEMPLATES[1];
  const tSlate = PREMIUM_TEMPLATES.find(t => t.id === "slate") || PREMIUM_TEMPLATES[2];
  const tCorp = PREMIUM_TEMPLATES.find(t => t.id === "corporate_suite") || PREMIUM_TEMPLATES[3];

  // Routing based on hash string: "#/" | "#/dashboard" | "#/john-doe"
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || "#/");
  
  // Auth States
  const [userUid, setUserUid] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [bearerToken, setBearerToken] = useState<string>("");
  const [activeUsername, setActiveUsername] = useState<string>("");
  
  // Credentials Form States
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [localUsersList, setLocalUsersList] = useState<any[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const [usernameValidationError, setUsernameValidationError] = useState<string | null>(null);

  // Fetch users list for live validation unconditionally
  useEffect(() => {
    fetch("/api/auth/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllRegisteredUsers(data);
        }
      })
      .catch((err) => console.warn("Could not load users for instant validation:", err));
  }, [authTab, authSuccess]);

  const validateEmailOnBlur = (val: string) => {
    const emailTrimmed = val.trim();
    if (!emailTrimmed) {
      setEmailValidationError(authTab === "signup" ? "Email address is required." : "Email address or username is required.");
      return false;
    }
    if (authTab === "signup") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setEmailValidationError("Invalid email format (e.g., jane.smith@example.com).");
        return false;
      }
      const isTaken = allRegisteredUsers.some(
        (u: any) => u.email?.toLowerCase().trim() === emailTrimmed.toLowerCase()
      ) || emailTrimmed.toLowerCase() === "john-doe@example.com" || emailTrimmed.toLowerCase() === "jane-smith@example.com";
      if (isTaken) {
        setEmailValidationError("This email is already registered. Please login or use a different email.");
        return false;
      }
    } else {
      // In signin, format can be either email or clean username
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
      if (!emailRegex.test(emailTrimmed) && !usernameRegex.test(emailTrimmed)) {
        setEmailValidationError("Please enter a valid username (alphanumeric, -, or _ only) or email address.");
        return false;
      }
    }
    setEmailValidationError(null);
    return true;
  };

  const validateUsernameOnBlur = (val: string) => {
    const valTrimmed = val.trim();
    const usernameClean = valTrimmed.toLowerCase().replace(/[^a-z0-9_\-]/g, "");
    if (!valTrimmed) {
      setUsernameValidationError("Username is required.");
      return false;
    }
    if (valTrimmed.length < 3) {
      setUsernameValidationError("Username must be at least 3 characters long.");
      return false;
    }
    if (/[^a-zA-Z0-9_\-]/.test(val)) {
      setUsernameValidationError("Only letters, numbers, dashes, and underscores permitted.");
      return false;
    }
    if (authTab === "signup") {
      const isTaken = allRegisteredUsers.some(
        (u: any) => u.username?.toLowerCase().trim() === usernameClean
      ) || usernameClean === "john-doe" || usernameClean === "jane-smith";
      if (isTaken) {
        setUsernameValidationError("Username already taken. This handle has been claimed.");
        return false;
      }
    }
    setUsernameValidationError(null);
    return true;
  };

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sync registered sandboxed accounts from server and LocalStorage in real-time
  useEffect(() => {
    if (!usingRealFirebase) {
      let localObj: Record<string, any> = {};
      try {
        const localUsersJson = localStorage.getItem("local_users");
        if (localUsersJson) {
          localObj = JSON.parse(localUsersJson);
          setLocalUsersList(Object.values(localObj));
        }
      } catch (err) {
        console.error("Failed to load local sandbox users:", err);
      }

      // Load from server persistent database as well so it is shared and synchronized
      fetch("/api/auth/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const merged = { ...localObj };
            data.forEach((u: any) => {
              if (u.email) {
                const normEmail = u.email.toLowerCase().trim();
                merged[normEmail] = {
                  email: normEmail,
                  name: u.name,
                  username: u.username,
                  password: "yourpassword" // reference placeholder password
                };
              }
            });
            setLocalUsersList(Object.values(merged));
          }
        })
        .catch((err) => console.warn("Could not retrieve shared persistent user accounts:", err));
    }
  }, [authTab]);

  // Sync hash routing changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Lottie Animation Player
  useEffect(() => {
    if (getSubRoute().view !== "login" || !lottieContainerRef.current) return;
    
    const anim = lottie.loadAnimation({
      container: lottieContainerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: lottieAnimationData,
    });

    return () => {
      anim.destroy();
    };
  }, [currentHash]);

  // Firebase Auth Listener
  useEffect(() => {
    if (usingRealFirebase && auth) {
      const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
        if (user) {
          setUserUid(user.uid);
          setUserEmail(user.email || "");
          setDisplayName(user.displayName || "Firebase User");
          
          // Get Firebase Real ID Token
          const idToken = await user.getIdToken();
          setBearerToken(idToken);
          
          // Set a default username from email prefix
          const emailPrefix = user.email ? user.email.split("@")[0].replace(/[^a-zA-Z0-9_\-]/g, "") : "user";
          setActiveUsername(emailPrefix);
        } else {
          // Cleared
          setUserUid("");
          setUserEmail("");
          setDisplayName("");
          setBearerToken("");
          setActiveUsername("");
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // One-Click Mock Login for Developer Sandbox
  const handleMockLogin = (chosenUser: string = "john-doe") => {
    const formattedUser = chosenUser.trim().toLowerCase();
    setUserUid(`${formattedUser}-uid`);
    setUserEmail(`${formattedUser}@example.com`);
    setDisplayName(chosenUser === "john-doe" ? "John Doe" : "Jane Smith");
    setBearerToken(formattedUser); // Backend treats lowercase string as the uid directly
    setActiveUsername(formattedUser);
    
    // Redirect to dashboard
    window.location.hash = "#/dashboard";
  };

  const handleFirebaseLogin = async () => {
    if (!auth) return;
    try {
      setAuthError(null);
      setAuthSuccess(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.hash = "#/dashboard";
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      setAuthError(err.message || "Google Sign-In failed.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoadingAuth(true);

    if (!email.trim() || !password.trim()) {
      setAuthError("Please fill out all credentials fields.");
      setLoadingAuth(false);
      return;
    }

    const isEmailValid = validateEmailOnBlur(email);
    if (!isEmailValid) {
      setLoadingAuth(false);
      return;
    }

    try {
      // Direct full-stack backend authentication proxy for email/password paths
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const matchedUser = data.user;
        setUserUid(matchedUser.uid);
        setUserEmail(matchedUser.email);
        setDisplayName(matchedUser.name);
        setBearerToken(matchedUser.username); // Lowercase username as authorization token
        setActiveUsername(matchedUser.username);
        
        setAuthSuccess(`Welcome back, ${matchedUser.name}! Opening database logs...`);
        setTimeout(() => {
          window.location.hash = "#/dashboard";
        }, 800);
        setLoadingAuth(false);
        return;
      } else if (data.error) {
        setAuthError(data.error);
        setLoadingAuth(false);
        return;
      }
    } catch (serverErr) {
      console.warn("Server auth failed, falling back to local simulation:", serverErr);
    }

    // Local browser localStorage fallback
    const localUsersJson = localStorage.getItem("local_users");
    const localUsers = localUsersJson ? JSON.parse(localUsersJson) : {};
    const normalizedEmail = email.toLowerCase().trim();
    
    let matchedUser: any = null;
    if (normalizedEmail === "john-doe@example.com" || normalizedEmail === "john-doe") {
      matchedUser = { uid: "john-doe-uid", email: "john-doe@example.com", name: "John Doe", username: "john-doe" };
    } else if (normalizedEmail === "jane-smith@example.com" || normalizedEmail === "jane-smith") {
      matchedUser = { uid: "jane-smith-uid", email: "jane-smith@example.com", name: "Jane Smith", username: "jane-smith" };
    } else if (localUsers[normalizedEmail]) {
      const u = localUsers[normalizedEmail];
      if (u.password === password) {
        matchedUser = u;
      } else {
        setAuthError("Incorrect password for this registered email profile.");
        setLoadingAuth(false);
        return;
      }
    }

    if (matchedUser) {
      setUserUid(matchedUser.uid);
      setUserEmail(matchedUser.email);
      setDisplayName(matchedUser.name);
      setBearerToken(matchedUser.username);
      setActiveUsername(matchedUser.username);
      
      setAuthSuccess(`Welcome back, ${matchedUser.name}! Opening database logs...`);
      setTimeout(() => {
        window.location.hash = "#/dashboard";
      }, 800);
    } else {
      setAuthError(`No candidate record found for ${email}. Go to the Sign Up tab to register instantly!`);
    }
    setLoadingAuth(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoadingAuth(true);

    if (!email.trim() || !password.trim() || !authName.trim() || !authUsername.trim()) {
      setAuthError("Please fill out all fields including your desired username.");
      setLoadingAuth(false);
      return;
    }

    const isEmailValid = validateEmailOnBlur(email);
    const isUsernameValid = validateUsernameOnBlur(authUsername);
    if (!isEmailValid || !isUsernameValid) {
      setLoadingAuth(false);
      return;
    }

    const usernameClean = authUsername.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "");
    if (!usernameClean) {
      setAuthError("Please enter a valid username (alphanumeric, -, or _ only).");
      setLoadingAuth(false);
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      setLoadingAuth(false);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Register custom persistent account over backend API
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: authName.trim(),
          username: usernameClean
        })
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        setAuthError(registerData.error || "Failed to register profile on the server database.");
        setLoadingAuth(false);
        return;
      }

      const uid = registerData.user.uid;

      if (!usingRealFirebase) {
        // Keep writing to local storage as double-redundancy backup in sandbox emulation mode
        const localUsersJson = localStorage.getItem("local_users");
        const localUsers = localUsersJson ? JSON.parse(localUsersJson) : {};
        const newUser = {
          uid,
          email: normalizedEmail,
          password,
          name: authName.trim(),
          username: usernameClean
        };
        localUsers[normalizedEmail] = newUser;
        localStorage.setItem("local_users", JSON.stringify(localUsers));
      }

      // Create initial default portfolio database record under mock name
      try {
        await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usernameClean}`
          },
          body: JSON.stringify({
            username: usernameClean,
            displayName: authName.trim(),
            bio: "",
            photoURL: "",
            theme: "light",
            sectionsOrder: ["experiences", "projects", "socialLinks"]
          })
        });
      } catch (err) {
        console.warn("Local storage write skipped on db mock error.", err);
      }

      setUserUid(uid);
      setUserEmail(normalizedEmail);
      setDisplayName(authName.trim());
      setBearerToken(usernameClean);
      setActiveUsername(usernameClean);

      setAuthSuccess(`Administrative account created successfully as @${usernameClean}! Welcome!`);
      setTimeout(() => {
        window.location.hash = "#/dashboard";
      }, 1000);
    } catch (err: any) {
      console.error("Email Sign Up Error: ", err);
      setAuthError(err.message || "Failed to create account profile.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    if (usingRealFirebase && auth) {
      await signOut(auth);
    }
    setUserUid("");
    setUserEmail("");
    setDisplayName("");
    setBearerToken("");
    setActiveUsername("");
    window.location.hash = "#/";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (!searchQuery.trim()) return;
    
    const targetPath = searchQuery.trim().toLowerCase();
    window.location.hash = `#/${targetPath}`;
  };

  // Helper parsing for URL path routing
  const getSubRoute = () => {
    const path = currentHash.replace("#/", "");
    if (!path || path === "") return { view: "home", param: "" };
    if (path === "dashboard") return { view: "dashboard", param: "" };
    if (path === "login") return { view: "login", param: "" };
    return { view: "portfolio", param: path };
  };

  const route = getSubRoute();
  const isPortfolioView = route.view === "portfolio";

  return (
    <div className={isPortfolioView ? "min-h-screen flex flex-col" : "min-h-screen bg-[#F8F6F0] flex flex-col font-sans text-stone-900"}>
      
      {/* Top Application Header */}
      {!isPortfolioView && (
        <header className="sticky top-0 z-50 bg-[#F8F6F0]/85 backdrop-blur-md border-b border-stone-200/60 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Logo Brand */}
            <a href="#/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 flex items-center justify-center bg-stone-950 rounded-lg p-0.5 select-none overflow-hidden shrink-0">
                <LottieLogo />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-stone-900 text-xs tracking-[0.2em] block uppercase">
                    PORTFOLIO CORE
                  </span>
                  <div className="w-4.5 h-4.5 bg-stone-950 rounded p-0.5 flex items-center justify-center select-none overflow-hidden shrink-0" title="Task Assigning Logo">
                    <LottieTaskAssigning />
                  </div>
                </div>
                <span className="font-mono text-[9px] text-stone-400 block -mt-0.5 tracking-wider uppercase font-semibold">
                  CANDIDATE PROFILE BUILDER
                </span>
              </div>
            </a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#/" 
                className={`text-xs uppercase tracking-[0.15em] font-semibold hover:text-black transition-colors flex items-center gap-2 ${
                  route.view === "home" ? "text-black border-b border-black pb-0.5" : "text-gray-400"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browse Portfolios</span>
              </a>
              
              <a 
                href="#/dashboard" 
                className={`text-xs uppercase tracking-[0.15em] font-semibold hover:text-black transition-colors flex items-center gap-2 ${
                  route.view === "dashboard" ? "text-black border-b border-black pb-0.5" : "text-gray-400"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Console Dashboard</span>
              </a>

              {!bearerToken && (
                <a 
                  href="#/login" 
                  className={`text-xs uppercase tracking-[0.15em] font-semibold hover:text-black transition-colors flex items-center gap-2 ${
                    route.view === "login" ? "text-black border-b border-black pb-0.5" : "text-gray-400"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Portal Sign In</span>
                </a>
              )}
            </nav>

            {/* Auth State Button Controls */}
            <div className="flex items-center gap-3">
              {bearerToken ? (
                <div className="flex items-center gap-3">
                  <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-100 font-semibold border-solid">
                    <ShieldCheck className="w-3" />
                    <span>Session Active: @{activeUsername}</span>
                  </span>
                  <button
                    id="header_logout_btn"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 text-gray-600 hover:text-black rounded-lg text-xs font-semibold border border-gray-100 border-solid transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <a
                  id="header_login_btn"
                  href="#/login"
                  className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Candidate Login</span>
                </a>
              )}
            </div>

          </div>
        </header>
      )}

      {/* RENDER VIEW CONTEXTS */}
      <main className={isPortfolioView ? "flex-1 w-full" : "flex-1 w-full max-w-7xl mx-auto px-6 py-10"}>
        
        {/* VIEW 1: BEAUTIFUL HOME PORTAL LANDING PAGE */}
        {route.view === "home" && (
          <div className="space-y-16 animate-fade-in">
            
            {/* Minimalist Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-6 pt-4 pb-8">
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 border-solid text-gray-650 text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full font-bold uppercase">
                <Sparkles className="w-3 h-3 text-emerald-500 fill-current animate-pulse" />
                <span>Interactive Candidate Portfolios Online</span>
              </div>
              <h1 className="text-gray-950 text-4xl md:text-5xl font-semibold tracking-tighter leading-tight font-display">
                Create & Publish Your CV. <br />
                <span className="text-gray-400 font-light font-display">Craft with Premium Custom Themes.</span>
              </h1>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto select-none font-sans">
                A pristine, high-fidelity developer workspace hosting responsive and PDF-optimized templates. Claim your custom handle namespace, synchronize work experiences or projects instantly, and generate standard paper resumes in seconds!
              </p>

              {/* Dynamic Username Lookup Search */}
              <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto pt-4 relative">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-450 font-mono text-xs">@</span>
                  <input
                    id="search_portfolio_input"
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ""))}
                    className="w-full bg-white border border-gray-200 border-solid rounded-xl pl-8 pr-32 py-3 text-xs font-mono shadow-xs focus:ring-1 focus:ring-black focus:border-black focus:outline-hidden text-slate-800"
                    placeholder="john-doe"
                  />
                  <div className="absolute right-2 top-1.5 flex items-center">
                    <button
                      id="search_portfolio_submit_btn"
                      type="submit"
                      className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
                {searchError && <p className="text-xs text-rose-600 mt-2 font-medium">{searchError}</p>}
                <p className="text-[10px] text-gray-400 mt-3 select-none">
                  Try viewing pre-seeds: <a href="#/john-doe" className="text-black hover:underline font-mono font-bold">john-doe</a> or <a href="#/jane-smith" className="text-black hover:underline font-mono font-bold">jane-smith</a>
                </p>
              </form>
            </div>

            {/* Platform Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="border border-gray-100 border-solid bg-white rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Modular Workspace</h3>
                <p className="text-xs text-gray-450 leading-relaxed font-sans">
                  Instantly structure your profile sections. Re-order components (experiences, creative projects, socials) dynamically on the fly.
                </p>
              </div>

              <div className="border border-gray-100 border-solid bg-white rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">4 Premium Themes</h3>
                <p className="text-xs text-gray-450 leading-relaxed font-sans">
                  Choose visual skins matching your profession: Professional Light, Cosmic Slate Dark, Retro Cyber, or Swiss Minimalist Slate.
                </p>
              </div>

              <div className="border border-gray-100 border-solid bg-white rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Gemini AI Copilot</h3>
                <p className="text-xs text-gray-450 leading-relaxed font-sans">
                  Craft powerful elevator pitches, refine experience sentences dynamically, and polish summary drafts using integrated Gemini models!
                </p>
              </div>

              <div className="border border-gray-100 border-solid bg-white rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Print to Paper PDF</h3>
                <p className="text-xs text-gray-450 leading-relaxed font-sans">
                  Optimized with print-to-PDF styles. Convert digital web cards into standard high-fidelity CV outputs instantly.
                </p>
              </div>

            </div>

            {/* FEATURED FLOATING SAMPLE CVS & PORTFOLIOS SHOWCASE */}
            <div className="space-y-8 pt-8">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 py-1 px-3.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  ✨ Interactive Showcase
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
                  Floating Sample CV Portfolios
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Hover to freeze or click to experience standard light resumes generated live via our candidate administrative engines.
                </p>
              </div>

              {/* SLIDING INFINITE CAROUSEL CONVEYOR */}
              <div className="w-full overflow-hidden py-6 select-none relative mt-4">
                {/* Left/Right elegant gradient fade mask matching body color #F8F6F0 */}
                <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-[#F8F6F0] via-[#F8F6F0]/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#F8F6F0] via-[#F8F6F0]/80 to-transparent z-10 pointer-events-none" />

                <div className="animate-marquee-scroll">
                  {/* Duplicate 2 loops to guarantee perfect endless repeat cycle cover screen wrap */}
                  {[1, 2].map((loopNo) => (
                    <div key={loopNo} className="flex gap-8 shrink-0">
                      
                      {/* 1. Jane Smith (IT & AI Specialist) */}
                      <a 
                        href="#/jane-smith"
                        className="block w-[320px] md:w-[360px] shrink-0 animate-float-slow group"
                      >
                        <div className={`p-5 transition-all duration-300 group-hover:scale-[1.02] border h-full flex flex-col justify-between min-h-[300px] relative overflow-hidden ${tLight.bgClass} ${tLight.fontClass} ${tLight.cardClass}`}>
                          <div>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 font-sans border-2 border-indigo-205 font-semibold text-xs text-indigo-700 flex items-center justify-center shrink-0">
                                  JS
                                </div>
                                <div className="text-left">
                                  <h4 className={`font-black text-xs ${tLight.textPrimary}`}>Jane Smith</h4>
                                  <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider">IT & NLP Systems</span>
                                </div>
                              </div>
                              <span className="bg-indigo-50 text-indigo-750 font-bold px-2.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono border border-indigo-100 shadow-2xs">
                                Minimalist Light
                              </span>
                            </div>
                            
                            {/* Inner Simulated Scrolling Box */}
                            <div className="relative h-[115px] overflow-hidden select-none border border-slate-100/50 rounded-lg p-2.5 bg-white/80">
                              <div className="space-y-3.5 text-left animate-inner-cv-scroll">
                                <div className="space-y-1">
                                  <span className={`text-[11px] font-black block ${tLight.accentText}`}>Lead NLP Systems Engineer</span>
                                  <p className={`text-[10px] leading-relaxed font-sans ${tLight.textMuted}`}>
                                    Designing large-scale context retrieval & vector agent neural pipelines using custom Gemini LLM embeddings.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {["Gemini API", "Python", "LLMs", "RAG"].map(s => (
                                    <span key={s} className="bg-slate-50 border border-slate-200/60 text-slate-700 text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <div className="space-y-1 border-t border-dashed border-slate-200 pt-2">
                                  <span className="text-[10px] font-bold text-slate-800 block">Senior AI Architect @ AcuTech</span>
                                  <p className={`text-[9.5px] ${tLight.textMuted}`}>Deployed dynamic prompt parsing algorithms with 35% performance gain.</p>
                                </div>
                                <div className="space-y-1 border-t border-dashed border-slate-200 pt-2">
                                  <span className="text-[10px] font-bold text-slate-800 block">Education & Certifications</span>
                                  <p className={`text-[9.5px] ${tLight.textMuted}`}>M.S. Computer Science — Specialist NLP Architect</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 border-t border-slate-100/80 pt-3 flex items-center justify-between text-indigo-600">
                            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Interactive Web CV</span>
                            <span className="text-xs group-hover:translate-x-1 transition-transform font-bold">👉 View Profile</span>
                          </div>
                        </div>
                      </a>

                      {/* 2. John Doe (IT & Cloud Specialist) */}
                      <a 
                        href="#/john-doe"
                        className="block w-[320px] md:w-[360px] shrink-0 animate-float-medium group"
                      >
                        <div className={`p-5 transition-all duration-200 h-full flex flex-col justify-between min-h-[300px] relative overflow-hidden ${tSlate.bgClass} ${tSlate.fontClass} ${tSlate.cardClass}`}>
                          <div>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-black font-semibold text-xs text-white flex items-center justify-center shrink-0">
                                  JD
                                </div>
                                <div className="text-left">
                                  <h4 className={`font-black text-xs ${tSlate.textPrimary}`}>John Doe</h4>
                                  <span className="text-[10px] text-zinc-700 font-mono font-bold uppercase tracking-wider">IT & Cloud Systems</span>
                                </div>
                              </div>
                              <span className="bg-white text-black border-2 border-black font-bold px-2.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono shadow-xs">
                                Swiss Slate
                              </span>
                            </div>

                            {/* Inner Simulated Scrolling Box */}
                            <div className="relative h-[115px] overflow-hidden select-none border-2 border-black rounded-none p-2.5 bg-white">
                              <div className="space-y-3.5 text-left animate-inner-cv-scroll">
                                <div className="space-y-1">
                                  <span className={`text-[11px] font-black block uppercase tracking-tight ${tSlate.textPrimary}`}>Data Scientist & ML Developer</span>
                                  <p className={`text-[10px] leading-snug font-sans ${tSlate.textMuted}`}>
                                    Deploying robust deep neural semantic classification and terraformed cloud compute spending by 35% on multi-accounts.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {["Pandas", "Scikit", "Docker", "AWS"].map(s => (
                                    <span key={s} className="bg-slate-100 border border-black text-black text-[8px] px-1.5 py-0.5 rounded-none font-mono font-bold font-sans">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <div className="space-y-1 border-t-2 border-black border-dashed pt-2">
                                  <span className="text-[10px] font-bold text-black block uppercase font-display">SRE Engineer @ TechOps</span>
                                  <p className={`text-[9.5px] ${tSlate.textMuted}`}>Integrated Kubernetes cluster auto-scaling scaling up to 100+ microservices.</p>
                                </div>
                                <div className="space-y-1 border-t-2 border-black border-dashed pt-2">
                                  <span className="text-[10px] font-bold text-black block uppercase font-display">Technical Projects Hub</span>
                                  <p className={`text-[9.5px] ${tSlate.textMuted}`}>Built automated data ingestion pipelines processing 50M events daily.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 border-t-2 border-black pt-3 flex items-center justify-between text-black font-black">
                            <span className="text-[10px] uppercase tracking-widest font-mono">Swiss Slate Design</span>
                            <span className="text-xs group-hover:translate-x-1 transition-transform font-bold">👉 View Profile</span>
                          </div>
                        </div>
                      </a>

                      {/* 3. Rohit Dhumal (Mechanical / Aerospace Lead) */}
                      <a 
                        href="#/rohitdhumal"
                        className="block w-[320px] md:w-[360px] shrink-0 animate-float-fast group"
                      >
                        <div className={`p-5 transition-all duration-300 group-hover:scale-[1.02] h-full flex flex-col justify-between min-h-[300px] relative overflow-hidden ${tCorp.bgClass} ${tCorp.fontClass} ${tCorp.cardClass}`}>
                          <div>
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-205">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-200 font-semibold text-xs text-emerald-750 flex items-center justify-center shrink-0">
                                  RD
                                </div>
                                <div className="text-left">
                                  <h4 className={`font-black text-xs ${tCorp.textPrimary}`}>Rohit Dhumal</h4>
                                  <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase tracking-wider">Mechanical & Aero</span>
                                </div>
                              </div>
                              <span className="bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe] font-bold px-2.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono shadow-2xs">
                                Corporate Suite
                              </span>
                            </div>

                            {/* Inner Simulated Scrolling Box */}
                            <div className="relative h-[115px] overflow-hidden select-none border border-slate-200 rounded-lg p-2.5 bg-white">
                              <div className="space-y-3.5 text-left animate-inner-cv-scroll">
                                <div className="space-y-1">
                                  <span className={`text-[11px] font-bold block ${tCorp.accentText}`}>Chief Mechanical Automation Lead</span>
                                  <p className={`text-[10px] leading-relaxed font-sans ${tCorp.textMuted}`}>
                                    Overseeing aeronautical Quality, diagnostics systems pipelines, CAD/FEA structures, and predictive maintenance.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {["CAD/FEA", "Quality", "MATLAB", "Aerospace"].map(s => (
                                    <span key={s} className="bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe] text-[8px] px-1.5 py-0.5 rounded font-mono font-bold font-sans">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <div className="space-y-1 border-t border-dashed border-slate-200/60 pt-2">
                                  <span className="text-[10px] font-bold text-slate-800 block">Lead Aerodynamics Officer</span>
                                  <p className={`text-[9.5px] ${tCorp.textMuted}`}>Optimized wind-tunnel aerodynamic coefficients for aerospace sub-components.</p>
                                </div>
                                <div className="space-y-1 border-t border-dashed border-slate-200/60 pt-2">
                                  <span className="text-[10px] font-bold text-slate-800 block">FEA Structural Analyst</span>
                                  <p className={`text-[9.5px] ${tCorp.textMuted}`}>Thermal dissipation modeling & stress simulation of complex chassis assemblies.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 border-t border-slate-100/80 pt-3 flex items-center justify-between text-indigo-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Predictive Engineering</span>
                            <span className="text-xs group-hover:translate-x-1 transition-transform font-bold">👉 View Profile</span>
                          </div>
                        </div>
                      </a>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to Action Container */}
            <div className="bg-slate-950 text-white rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Claim Your Custom Candidate Profile Handle</h2>
              <p className="text-slate-300 text-xs max-w-lg mx-auto leading-relaxed">
                Connect your background experiences and host portfolio sites on clean domains. Setup takes under a minute.
              </p>
              <div className="pt-2">
                <a 
                  href="#/login" 
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-6 py-3.5 rounded-xl transition cursor-pointer"
                >
                  <span>Build Your Administrative Portal Account</span>
                  <ChevronRight className="w-4 h-4 text-slate-900" />
                </a>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: CONSOLE DASHBOARD PANEL */}
        {route.view === "dashboard" && (
          <div className="animate-fade-in animate-duration-300">
            {bearerToken ? (
              <Dashboard 
                bearerToken={bearerToken}
                setBearerToken={setBearerToken}
                uid={userUid}
                setUid={setUserUid}
                username={activeUsername}
                setUsername={setActiveUsername}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 border border-gray-150 border-solid bg-white rounded-2xl p-8 text-center space-y-6 shadow-md">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 border-solid rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-900">Developer Session Required</h2>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed font-sans">
                    Please log in or register a profile account above to claim username handles and deploy CV segments.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <a
                    href="#/login"
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <User className="w-4 h-4" />
                    <span>Access Access Credentials Screen</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE PORTFOLIO WEBSITE RENDERING */}
        {route.view === "portfolio" && (
          <div className="animate-fade-in">
            <LivePortfolio usernameParam={route.param} loggedInUsername={activeUsername} hideGallery={true} />
          </div>
        )}

        {/* VIEW 4: DEDICATED SIGN IN / SIGN UP PORTAL */}
        {route.view === "login" && (
          <div className="max-w-5xl mx-auto my-8 lg:my-16 bg-white border border-slate-200/60 shadow-[0_24px_64px_rgba(15,23,42,0.06)] rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 animate-fade-in relative">
            
            {/* Left Column: Premium Dark Visual Showcase using Lottie */}
            <div className="lg:col-span-5 relative overflow-hidden bg-slate-950 px-8 py-12 flex flex-col justify-between text-center lg:text-left min-h-[460px] lg:min-h-[640px] border-b lg:border-b-0 lg:border-r border-slate-900">
              {/* Outer decorative ambient glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

              {/* Decorative wireframe grid in background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

              {/* Top Section of left panel */}
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-850 text-indigo-400 text-[10px] tracking-widest uppercase font-mono rounded-full px-3 py-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  Live Graphics Node
                </div>
                <h4 className="font-sans text-[11px] text-slate-500 font-semibold tracking-wider uppercase">Interactive Core Environment</h4>
              </div>

              {/* Centered Lottie Canvas */}
              <div className="relative group my-8 flex items-center justify-center relative z-10 justify-self-center lg:my-0">
                {/* Visual backplate glow */}
                <div className="absolute w-48 h-48 bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />
                
                {/* Floating cyber-ring enclosure */}
                <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center p-3 rounded-[2rem] bg-slate-900/40 border border-slate-800/80 backdrop-blur-md shadow-2xl transition-all duration-700 hover:rotate-3 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-[2rem]" />
                  <div ref={lottieContainerRef} className="w-full h-full p-2 relative z-10" />
                </div>
              </div>

              {/* Bottom Section of left panel */}
              <div className="space-y-3 relative z-10 select-none">
                <h3 className="font-outfit text-xl font-bold tracking-tight text-white leading-snug">
                  Build a Stunning, Professional Presence.
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto lg:mx-0 font-sans">
                  Craft dynamic data-driven resumes, showcase credentials visually, and publish directly to custom digital handles instantly.
                </p>
              </div>
            </div>

            {/* Right Column: Portal Auth Flow Forms */}
            <div className="lg:col-span-7 p-8 md:p-12 space-y-8 flex flex-col justify-center bg-white">
              
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center p-1 shadow-md shadow-slate-950/20 select-none overflow-hidden shrink-0 transform hover:scale-105 transition-transform">
                    <LottieLogo />
                  </div>
                  <div>
                    <h2 className="font-outfit font-black text-2xl text-slate-900 tracking-tight">Candidate Portal</h2>
                    <p className="text-xs text-slate-500 font-sans">Secure credential gateway and online resume hub</p>
                  </div>
                </div>
              </div>

              {/* Custom Elegant Toggle Tab */}
              <div className="p-1 bg-slate-100/80 rounded-2xl border border-slate-200/40 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signin");
                    setAuthError(null);
                    setAuthSuccess(null);
                    setShowPassword(false);
                    setEmailValidationError(null);
                    setUsernameValidationError(null);
                  }}
                  className={`py-2.5 text-xs font-bold tracking-wide rounded-xl transition-all duration-300 cursor-pointer ${
                    authTab === "signin" 
                      ? "bg-white text-slate-950 shadow-sm border border-slate-200/20" 
                      : "text-slate-500 hover:text-slate-800 border-0 bg-transparent font-semibold"
                  }`}
                >
                  Sign In Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signup");
                    setAuthError(null);
                    setAuthSuccess(null);
                    setShowPassword(false);
                    setEmailValidationError(null);
                    setUsernameValidationError(null);
                  }}
                  className={`py-2.5 text-xs font-bold tracking-wide rounded-xl transition-all duration-300 cursor-pointer ${
                    authTab === "signup" 
                      ? "bg-white text-slate-950 shadow-sm border border-slate-200/20" 
                      : "text-slate-500 hover:text-slate-800 border-0 bg-transparent font-semibold"
                  }`}
                >
                  Register Handle
                </button>
              </div>

              {/* Informational Alerts */}
              {authError && (
                <div id="auth_error_box" className="p-4 bg-red-50/80 border border-red-100 rounded-2xl text-red-800 text-xs flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 animate-pulse" />
                    <span className="font-medium leading-relaxed">{authError}</span>
                  </div>
                  {authError.includes("claim yours instantly") && (
                    <button
                      id="auto_register_cta_btn"
                      type="button"
                      onClick={() => {
                        setAuthTab("signup");
                        setAuthError(null);
                        const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9_\-]/g, "") || "user";
                        setAuthUsername(prefix);
                        setAuthName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
                      }}
                      className="mt-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg px-3.5 py-2 text-[10px] font-bold self-start cursor-pointer border-0 transition-all font-sans tracking-wide uppercase shadow-xs hover:shadow-sm"
                    >
                      Bypass & Register @{email.split("@")[0].replace(/[^a-zA-Z0-9_\-]/g, "") || "user"}
                    </button>
                  )}
                </div>
              )}
              
              {authSuccess && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5 font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Form elements with premium styling */}
              <form onSubmit={authTab === "signin" ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                
                {/* Name field (Only shown for Sign Up) */}
                {authTab === "signup" && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Display Name</label>
                    <div className="relative group">
                      <span className="absolute left-3.5 inset-y-0 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white text-slate-900 rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                {/* Username field (Only shown for Sign Up) */}
                {authTab === "signup" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desired URL Username</label>
                      {authUsername && (
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          portfolio-core/#/{authUsername.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "")}
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <span className="absolute left-3.5 inset-y-0 flex items-center text-slate-400 group-focus-within:text-slate-900 font-mono text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={authUsername}
                        onBlur={(e) => validateUsernameOnBlur(e.target.value)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "");
                          setAuthUsername(val);
                          if (usernameValidationError) {
                            if (val.trim().length >= 3) {
                              setUsernameValidationError(null);
                            }
                          }
                        }}
                        placeholder="janesmith"
                        className={`w-full border bg-slate-50/30 hover:bg-slate-50 focus:bg-white text-slate-900 rounded-xl pl-9 pr-4 py-3 text-xs font-mono focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-hidden transition-all shadow-2xs ${
                          usernameValidationError ? "border-rose-400 ring-2 ring-rose-500/10 focus:border-rose-500" : "border-slate-200/80"
                        }`}
                      />
                    </div>
                    {usernameValidationError ? (
                      <p className="text-[10px] text-rose-600 font-semibold pt-1 px-1 flex items-center gap-1.5 animate-fade-in">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        {usernameValidationError}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 leading-normal font-sans pt-0.5">
                        Your direct access URL. Only alphanumeric, dashes and underscores permitted.
                      </p>
                    )}
                  </div>
                )}

                 {/* Email field (Always shown) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {authTab === "signup" ? "Email Address" : "Email Address or Username"}
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 inset-y-0 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={email}
                      onBlur={(e) => validateEmailOnBlur(e.target.value)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailValidationError) {
                          const valStr = e.target.value.trim();
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
                          if (emailRegex.test(valStr) || usernameRegex.test(valStr)) {
                            setEmailValidationError(null);
                          }
                        }
                      }}
                      placeholder={authTab === "signup" ? "email@example.com" : "username or email@example.com"}
                      className={`w-full border bg-slate-50/30 hover:bg-slate-50 focus:bg-white text-slate-900 rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-hidden transition-all shadow-2xs ${
                        emailValidationError ? "border-rose-400 ring-2 ring-rose-500/10 focus:border-rose-500" : "border-slate-200/80"
                      }`}
                    />
                  </div>
                  {emailValidationError && (
                    <p className="text-[10px] text-rose-600 font-semibold pt-1 px-1 flex items-center gap-1.5 animate-fade-in">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {emailValidationError}
                    </p>
                  )}
                </div>

                {/* Password field (Always shown) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Password</label>
                  <div className="relative group">
                    <span className="absolute left-3.5 inset-y-0 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 focus:bg-white text-slate-900 rounded-xl pl-10 pr-10 py-3 text-xs focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-hidden transition-all shadow-2xs"
                    />
                    <button
                      id="password_visibility_toggle_btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 inset-y-0 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-hidden"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button with hover transitions */}
                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-3.5 px-4 bg-slate-950 hover:bg-indigo-950 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-slate-950/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 border-0 font-sans mt-5"
                >
                  {loadingAuth ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  )}
                  <span>{authTab === "signin" ? "Sign In Credentials" : "Register and Claim Handle &rarr;"}</span>
                </button>

              </form>

              {/* SSO Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-slate-100 w-full" />
                <span className="absolute bg-white px-4 text-[10px] uppercase font-mono tracking-widest text-slate-400">or use single sign-on</span>
              </div>

              {/* Google Access Button */}
              <button
                id="login_portal_admin_google_btn"
                onClick={handleFirebaseLogin}
                disabled={!usingRealFirebase}
                className="w-full py-3.5 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer font-bold text-xs shadow-2xs"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Authorize with Google Workspace</span>
              </button>

              {/* Quick Emulator Pre-seeds Panel */}
              {!usingRealFirebase && (
                <div className="pt-6 border-t border-slate-100 text-center space-y-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Sandbox Developer Pre-seeds</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto p-1">
                    <button 
                      onClick={() => {
                        setEmail("john-doe@example.com");
                        setPassword("sandbox");
                        setAuthTab("signin");
                      }}
                      type="button"
                      className="relative group px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-500 group-hover:scale-125 transition-all shrink-0" />
                      <span>@john-doe</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEmail("jane-smith@example.com");
                        setPassword("sandbox");
                        setAuthTab("signin");
                      }}
                      type="button"
                      className="relative group px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-500 group-hover:scale-125 transition-all shrink-0" />
                      <span>@jane-smith</span>
                    </button>
                    {localUsersList.map((u) => (
                      <button
                        key={u.email}
                        onClick={() => {
                          setEmail(u.email);
                          setPassword(u.password || "yourpassword");
                          setAuthTab("signin");
                        }}
                        type="button"
                        className="relative group px-3.5 py-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-150 hover:border-indigo-250 text-indigo-700 rounded-xl text-[11px] font-mono cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
                        title={`Click to fill: ${u.email}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-125 transition-all shrink-0" />
                        <span>@{u.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Global simple footer block */}
      {!isPortfolioView && (
        <footer className="bg-white border-t border-gray-100 border-solid py-8 text-center text-gray-400 text-xs relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-3">
            {/* Decorative Task Assigning watermark logo */}
            <div className="w-10 h-10 opacity-30 select-none pointer-events-none hover:opacity-60 transition-opacity duration-300">
              <LottieTaskAssigning />
            </div>
            <p>© 2026 Portfolio Builder Core & Resume Dashboard Console. Clean Design Theme Active.</p>
          </div>
        </footer>
      )}

    </div>
  );
}
