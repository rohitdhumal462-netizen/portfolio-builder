import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Safely extend Express Request namespace with typed user property for auth
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with safety limits for rich screenshots & assets
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Database location file
  const dataPath = path.join(process.cwd(), "data", "portfolios.json");
  let cachePortfolios: any = null;

  // Load portfolios from local database safely
  function getPortfolios() {
    if (useFirestore) {
      if (cachePortfolios) return cachePortfolios;
      cachePortfolios = {};
      return cachePortfolios;
    }
    try {
      if (!fs.existsSync(dataPath)) {
        // Return seeded fallback if we deleted it or similar
        return {};
      }
      const data = fs.readFileSync(dataPath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading portfolios store:", err);
      return {};
    }
  }

  // Save portfolios securely
  function savePortfolios(data: any) {
    try {
      if (useFirestore) {
        cachePortfolios = data;
        // Exclusively replicate to Firestore, and do NOT write to local portfolios.json to prevent leakage
        Object.keys(data).forEach((username) => {
          syncPortfolioToFirestore(username, data[username]);
        });
        return;
      }

      const dirPath = path.dirname(dataPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");

      // Dynamically detect activated Firebase configuration
      let canSync = false;
      try {
        if (fs.existsSync(firebaseConfigPath)) {
          const cfg = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
          if (cfg.apiKey && cfg.apiKey !== "placeholder-api-key") {
            canSync = true;
          }
        }
      } catch (_) {}

      // Auto-replicate portfolios to Cloud Firestore if credentials are active
      if (canSync) {
        Object.keys(data).forEach((username) => {
          syncPortfolioToFirestore(username, data[username]);
        });
      }
    } catch (err) {
      console.error("Error saving portfolios store:", err);
    }
  }

  // Users database location file
  const usersDataPath = path.join(process.cwd(), "data", "users.json");
  let cacheUsers: any = null;

  // Load registered users from local database safely
  function getRegisteredUsers() {
    if (useFirestore) {
      if (cacheUsers) return cacheUsers;
      cacheUsers = {};
      return cacheUsers;
    }
    try {
      if (!fs.existsSync(usersDataPath)) {
        return {};
      }
      const data = fs.readFileSync(usersDataPath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading users store:", err);
      return {};
    }
  }

  // Save registered users safely
  function saveRegisteredUsers(data: any) {
    try {
      if (useFirestore) {
        cacheUsers = data;
        // Exclusively kept in cache; sync logic to Firestore collections (user_registrations, member_credentials, etc.) takes care of cloud persistence
        return;
      }

      const dirPath = path.dirname(usersDataPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(usersDataPath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("Error saving users store:", err);
    }
  }

  // Load firebase credentials
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  let firebaseConfig: any = null;
  let useFirestore = false;
  let firebaseApp: any = null;
  let db: any = null;

  try {
    if (fs.existsSync(firebaseConfigPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
      if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "placeholder-api-key") {
        useFirestore = true;
      }
    }
  } catch (err) {
    console.error("Error reading firebase-applet-config.json inside server:", err);
  }

  // Lazy initialize firebase client side SDK on the server side with dynamic reload support
  async function getFirestoreDB() {
    try {
      if (fs.existsSync(firebaseConfigPath)) {
        const currentConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
         if (currentConfig.apiKey && currentConfig.apiKey !== "placeholder-api-key") {
          firebaseConfig = currentConfig;
          useFirestore = true;
        }
      }
    } catch (err) {
      console.error("Error reloading firebase config:", err);
    }

    if (!useFirestore) return null;
    if (db) return db;
    try {
      const { initializeApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      firebaseApp = initializeApp(firebaseConfig);
      
      const customDbId = firebaseConfig.firestoreDatabaseId || "(default)";
      if (customDbId !== "(default)") {
        db = getFirestore(firebaseApp, customDbId);
        console.log(`[Server] Connected to custom database ID: '${customDbId}'`);
      } else {
        db = getFirestore(firebaseApp);
        console.log("[Server] Connected to '(default)' database.");
      }
      return db;
    } catch (err) {
      console.error("[Server] Error lazy-initializing Firebase Firestore:", err);
      return null;
    }
  }

  // Save CV data to local files and Cloud Firestore separately
  async function saveCVData(username: string, cvData: string) {
    const formattedUsername = username.toLowerCase().trim();
    
    // Save locally to keep profiles.json lightweight
    try {
      const cvDir = path.join(process.cwd(), "data", "cvs");
      if (!fs.existsSync(cvDir)) {
        fs.mkdirSync(cvDir, { recursive: true });
      }
      const cvFilePath = path.join(cvDir, `${formattedUsername}.json`);
      fs.writeFileSync(cvFilePath, JSON.stringify({ cvData }, null, 2), "utf8");
      console.log(`[Server] Saved CV document locally for @${formattedUsername}`);
    } catch (err) {
      console.error(`Error saving CV data locally for @${formattedUsername}:`, err);
    }

    // Save to Cloud Firestore in a separate collection "portfolio_cvs" to prevent main documentbloat and 1MB limit failures
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(firestoreDb, "portfolio_cvs", formattedUsername), {
          username: formattedUsername,
          cvData: cvData,
          updatedAt: new Date().toISOString()
        });
        console.log(`[Server] Saved CV document separately in Cloud Firestore ('portfolio_cvs' collection) for @${formattedUsername}`);
      }
    } catch (err) {
      console.error(`[Server] Firestore write failed under 'portfolio_cvs' for @${formattedUsername}:`, err);
    }
  }

  // Load CV data from local files or Cloud Firestore
  async function getCVData(username: string): Promise<string> {
    const formattedUsername = username.toLowerCase().trim();
    
    // 1. Try local file cache first
    try {
      const cvFilePath = path.join(process.cwd(), "data", "cvs", `${formattedUsername}.json`);
      if (fs.existsSync(cvFilePath)) {
        const data = JSON.parse(fs.readFileSync(cvFilePath, "utf8"));
        if (data.cvData) return data.cvData;
      }
    } catch (err) {
      // Ignore
    }

    // 2. Try fetching from Cloud Firestore 'portfolio_cvs'
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, getDoc } = await import("firebase/firestore");
        const docSnap = await getDoc(doc(firestoreDb, "portfolio_cvs", formattedUsername));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.cvData) {
            // Cache locally for faster subsequent retrieval
            try {
              const cvDir = path.join(process.cwd(), "data", "cvs");
              if (!fs.existsSync(cvDir)) {
                fs.mkdirSync(cvDir, { recursive: true });
              }
              fs.writeFileSync(path.join(cvDir, `${formattedUsername}.json`), JSON.stringify({ cvData: data.cvData }, null, 2), "utf8");
            } catch (_) {}
            return data.cvData;
          }
        }
      }
    } catch (err) {
      console.error(`[Server] Error loading CV from Cloud Firestore for @${formattedUsername}:`, err);
    }

    return "";
  }

  // Synchronize a portfolio document to Firestore (both singular and plural)
  async function syncPortfolioToFirestore(username: string, portfolioData: any) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, setDoc } = await import("firebase/firestore");
        const formattedUsername = username.toLowerCase().trim();
        const safeData = { ...portfolioData };

        // Double-check block to prevent giant base64 serialization in main portfolios document
        if (safeData.cvUrl && safeData.cvUrl.startsWith("data:")) {
          await saveCVData(formattedUsername, safeData.cvUrl);
          safeData.cvUrl = `/api/portfolios/${formattedUsername}/cv`;
        }

        // Sync to "portfolios"
        await setDoc(doc(firestoreDb, "portfolios", formattedUsername), safeData);
        // Sync to "portfolio" (singular)
        await setDoc(doc(firestoreDb, "portfolio", formattedUsername), safeData);
        console.log(`[Server] Synchronized portfolio for @${formattedUsername} to Cloud Firestore ("portfolios" and "portfolio" collections).`);
      }
    } catch (err) {
      console.error(`[Server] Firestore write sync failed for portfolio @${username}:`, err);
    }
  }

  // Synchronize a registered user to standard users collection
  async function syncUserToFirestore(email: string, userData: any) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, setDoc } = await import("firebase/firestore");
        const docId = email.toLowerCase().trim();
        const safeUser = { ...userData };
        // We explicitly guarantee password is included
        if (userData.password) {
          safeUser.password = userData.password;
        }
        
        // Sync to "member_credentials" (the clean custom collection requested)
        await setDoc(doc(firestoreDb, "member_credentials", docId), safeUser);

        // Sync to "user_registrations" (the alternative clean custom collection requested)
        await setDoc(doc(firestoreDb, "user_registrations", docId), safeUser);
        
        // Sync to "user_registrations_secure" (additional secure collection)
        await setDoc(doc(firestoreDb, "user_registrations_secure", docId), safeUser);

        // Keep fallback sync to original collection names for robustness
        await setDoc(doc(firestoreDb, "users", docId), safeUser);
        await setDoc(doc(firestoreDb, "registered_users", docId), safeUser);

        console.log(`[Server] Synchronized user record for ${docId} (with password) to Firestore ("member_credentials", "user_registrations", and "users" collections).`);
      }
    } catch (err) {
      console.error(`[Server] Firestore write sync failed for user ${email}:`, err);
    }
  }

  // Synchronize a registered user to the requested custom collection "user_porfolio"
  async function syncUserToUserPortfolio(email: string, userData: any) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, setDoc } = await import("firebase/firestore");
        const docId = email.toLowerCase().trim();
        const safeUser = { ...userData };
        // Do NOT delete safeUser.password so it remains searchable
        await setDoc(doc(firestoreDb, "user_porfolio", docId), safeUser);
        console.log(`[Server] Synchronized user record (with password) to 'user_porfolio' collection for ${docId}.`);
      }
    } catch (err) {
      console.error(`[Server] Firestore write failed under 'user_porfolio' collection for ${email}:`, err);
    }
  }

  // Log successful login events to the requested custom collection "login_user"
  async function syncUserLoginToFirestore(userData: any) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (firestoreDb) {
        const { doc, setDoc } = await import("firebase/firestore");
        const safeUser = { ...userData };
        // We explicitly guarantee password is included
        if (userData.password) {
          safeUser.password = userData.password;
        }
        const currentTimestamp = new Date().toISOString();
        const timestamp = Date.now();
        // Use a highly predictable and deterministic document ID to guarantee display in general console
        const loginDocId = `login_${safeUser.username || "user"}_${timestamp}`;
        
        // Log to login_user
        await setDoc(doc(firestoreDb, "login_user", loginDocId), {
          ...safeUser,
          loginAt: currentTimestamp
        });

        // Log to login_sessions
        await setDoc(doc(firestoreDb, "login_sessions", loginDocId), {
          ...safeUser,
          loginAt: currentTimestamp
        });
        
        console.log(`[Server] Logged login session event to 'login_user' and 'login_sessions' for ${safeUser.email} using ID: ${loginDocId}`);
      }
    } catch (err) {
      console.error("[Server] Firestore write failed under login session collections:", err);
    }
  }

  // Real-time lookup helper to retrieve user record directly from Cloud Firestore
  async function getUserFromFirestore(loginKey: string) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (!firestoreDb) return null;

      const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      const normalizedKey = loginKey.toLowerCase().trim();

      // If it looks like an email, lookup by doc ID first
      if (normalizedKey.includes("@")) {
        const collectionsToCheck = ["users", "user_porfolio", "registered_users", "user_registrations", "member_credentials"];
        for (const colName of collectionsToCheck) {
          try {
            const docRef = doc(firestoreDb, colName, normalizedKey);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data && (data.uid || data.username)) {
                return {
                  uid: data.uid || `${data.username}-uid`,
                  email: data.email || normalizedKey,
                  name: data.name || data.username || "User",
                  username: data.username || data.uid?.replace("-uid", "") || normalizedKey.split("@")[0],
                  password: data.password || "imported_from_firestore"
                };
              }
            }
          } catch (e) {
            console.warn(`[Server] Firestore read failed on col: ${colName}`, e);
          }
        }
      }

      // Fallback or username lookup: query collection where username equals key
      const queryCollections = ["users", "user_porfolio", "registered_users", "user_registrations", "member_credentials"];
      for (const colName of queryCollections) {
        try {
          const q = query(collection(firestoreDb, colName), where("username", "==", normalizedKey));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const data = docSnap.data();
            return {
              uid: data.uid || `${data.username}-uid`,
              email: data.email || docSnap.id || `${data.username}@example.com`,
              name: data.name || data.username || "User",
              username: data.username,
              password: data.password || "imported_from_firestore"
            };
          }
        } catch (e) {
          console.warn(`[Server] Firestore query failed on col: ${colName}`, e);
        }
      }
    } catch (err) {
      console.error("[Server] getUserFromFirestore failed:", err);
    }
    return null;
  }

  // Real-time lookup helper to retrieve portfolio directly from Cloud Firestore
  async function getPortfolioFromFirestore(username: string) {
    try {
      const firestoreDb = await getFirestoreDB();
      if (!firestoreDb) return null;

      const { doc, getDoc } = await import("firebase/firestore");
      const formattedUsername = username.toLowerCase().trim();

      const collectionsToTry = ["portfolios", "portfolio"];
      for (const colName of collectionsToTry) {
        try {
          const docRef = doc(firestoreDb, colName, formattedUsername);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.username) {
              console.log(`[Server] Real-time recovered portfolio for @${formattedUsername} from Firestore collection ${colName}.`);
              return data;
            }
          }
        } catch (e) {
          console.warn(`[Server] Real-time portfolio search failed on ${colName}:`, e);
        }
      }
    } catch (err) {
      console.error("[Server] getPortfolioFromFirestore failed:", err);
    }
    return null;
  }

  // Load and merge all remote Firestore state during server startup
  async function syncFirestoreToLocalStorage() {
    try {
      const firestoreDb = await getFirestoreDB();
      if (!firestoreDb) return;
      
      const { collection, getDocs } = await import("firebase/firestore");
      
      // 1. Sync registered users (try multiple collections for robustness)
      const userCollections = ["member_credentials", "user_registrations", "user_registrations_secure", "users", "registered_users", "user_porfolio"];
      const localUsers = getRegisteredUsers();
      let usersSyncedCount = 0;

      for (const colName of userCollections) {
        try {
          const snap = await getDocs(collection(firestoreDb, colName));
          if (!snap.empty) {
            snap.forEach((doc) => {
              const remoteUser = doc.data();
              const email = doc.id.includes("@") ? doc.id : (remoteUser.email || `${doc.id}@example.com`);
              if (remoteUser.uid || remoteUser.username) {
                localUsers[email] = {
                  uid: remoteUser.uid || `${remoteUser.username}-uid`,
                  email: remoteUser.email || email,
                  name: remoteUser.name || remoteUser.fullName || remoteUser.displayName || remoteUser.username,
                  username: remoteUser.username || remoteUser.uid?.replace("-uid", "") || doc.id.split("@")[0],
                  password: localUsers[email]?.password || remoteUser.password || "imported_from_firestore"
                };
                usersSyncedCount++;
              }
            });
          }
        } catch (e) {
          console.log(`[Server] Skipped startup sync search on collection: ${colName}`);
        }
      }
      
      if (usersSyncedCount > 0) {
        saveRegisteredUsers(localUsers);
        console.log(`[Server] Synced ${usersSyncedCount} user registration entries from Cloud Firestore into local cache.`);
      }

      // 2. Sync portfolios (try both portfolios and portfolio)
      const portfolioCollections = ["portfolios", "portfolio"];
      const localPortfolios = getPortfolios();
      let portfoliosSyncedCount = 0;

      for (const colName of portfolioCollections) {
        try {
          const snap = await getDocs(collection(firestoreDb, colName));
          if (!snap.empty) {
            snap.forEach((doc) => {
              const remoteData = doc.data();
              const docId = doc.id;
              const existingLocal = localPortfolios[docId] || {};
              
              const remoteCv = remoteData.cvUrl;
              const localCv = existingLocal.cvUrl;
              let mergedCv = (remoteCv !== undefined && remoteCv !== null) ? remoteCv : (localCv || "");
              
              // Migrator for legacy raw base64 data on startup:
              // Move it to dedicated CV storage and reference it securely via API link
              if (mergedCv && mergedCv.startsWith("data:")) {
                const formattedId = docId.toLowerCase().trim();
                saveCVData(formattedId, mergedCv)
                  .then(() => console.log(`[Server] Legacy CV migrated successfully for @${formattedId}`))
                  .catch((err) => console.error(`[Server] Startup migration failed for @${formattedId}:`, err));
                mergedCv = `/api/portfolios/${formattedId}/cv`;
              }

              localPortfolios[docId] = {
                ...remoteData,
                cvUrl: mergedCv
              };
              portfoliosSyncedCount++;
            });
          }
        } catch (e) {
          console.log(`[Server] Skipped startup sync search on collection: ${colName}`);
        }
      }

      if (portfoliosSyncedCount > 0) {
        savePortfolios(localPortfolios);
        console.log(`[Server] Synced ${portfoliosSyncedCount} portfolio records from Cloud Firestore into local cache.`);
      }
    } catch (err) {
      console.error("[Server] Firestore to local cache sync failed:", err);
    }
  }

  // Auth helper to parse Bearer tokens
  function getAuthUser(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    if (!token || token.trim() === "") return null;

    // First attempt to decode JWT for real Firebase ID tokens issued via Google/Auth flow
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload.sub || payload.user_id;
        const email = payload.email || "";
        const name = payload.name || payload.display_name || "Firebase User";
        if (uid) {
          return { uid, email, name, isMock: false };
        }
      }
    } catch (err) {
      // Gracefully catch decode errors and fallback
    }

    // Try checking registered custom users in data/users.json
    try {
      const users = getRegisteredUsers();
      const matched = Object.values(users).find(
        (u: any) => u.username === token || u.uid === token || `${u.username}-uid` === token
      );
      if (matched) {
        const u = matched as any;
        return { uid: u.uid, email: u.email, name: u.name, isMock: true };
      }
    } catch (err) {
      // Ignore reading error
    }

    // Fallback for developers executing instructions via raw CURL commands
    if (token === "MOCK_ADMIN_TOKEN" || token === "john-doe" || token === "<ID_TOKEN>") {
      return { uid: "john-doe-uid", email: "john-doe@example.com", name: "John Doe", isMock: true };
    }

    // General fallback: treat raw non-JWT string as UID (extremely developer friendly)
    if (token.length > 3 && !token.includes('.')) {
      const parsedUid = token.endsWith("-uid") ? token : `${token}-uid`;
      return { uid: parsedUid, email: `${token}@example.com`, name: token, isMock: true };
    }

    return null;
  }

  // --- I. Public Endpoints (No Auth Required) ---

  // Custom persistent database user registration
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, username } = req.body;
    if (!email || !password || !name || !username) {
      return res.status(400).json({ error: "All registration fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usernameClean = username.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, "");

    const users = getRegisteredUsers();

    if (normalizedEmail === "john-doe@example.com" || normalizedEmail === "jane-smith@example.com") {
      return res.status(400).json({ error: "This email address is reserved for pre-seeded demonstration profiles." });
    }

    if (users[normalizedEmail]) {
      return res.status(400).json({ error: "This email is already registered. Please login with your credentials." });
    }

    const usernameTaken = Object.values(users).some((u: any) => u.username === usernameClean);
    if (usernameTaken || usernameClean === "john-doe" || usernameClean === "jane-smith") {
      return res.status(400).json({ error: "This candidate handle has already been claimed." });
    }

    const uid = `${usernameClean}-uid`;
    const newUser = {
      uid,
      email: normalizedEmail,
      password,
      name: name.trim(),
      username: usernameClean,
      createdAt: new Date().toISOString()
    };

    users[normalizedEmail] = newUser;
    saveRegisteredUsers(users);

    // Explicitly await the sync tasks so they complete before answering
    try {
      await syncUserToFirestore(normalizedEmail, newUser);
    } catch (syncErr) {
      console.error("[Server] syncUserToFirestore failed:", syncErr);
    }

    try {
      await syncUserToUserPortfolio(normalizedEmail, newUser);
    } catch (syncErr) {
      console.error("[Server] syncUserToUserPortfolio failed:", syncErr);
    }

    res.status(201).json({
      message: "Successfully registered account",
      user: {
        uid,
        email: normalizedEmail,
        name: name.trim(),
        username: usernameClean
      }
    });
  });

  // Custom persistent database user login verification
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const users = getRegisteredUsers();

    let matchedUser: any = null;
    let matchedLocalKey: string | null = null;
    
    // Support lookup by either Email or Username
    let localUser = users[normalizedEmail];
    if (localUser) {
      matchedLocalKey = normalizedEmail;
    } else {
      // Find user where u.username matches entered field
      const foundEntry = Object.entries(users).find(([_, u]: any) => 
        u.username && u.username.toLowerCase().trim() === normalizedEmail
      );
      if (foundEntry) {
        localUser = foundEntry[1];
        matchedLocalKey = foundEntry[0];
      }
    }

    // Direct Firestore real-time recovery search if not found in local cache
    if (!localUser && useFirestore) {
      try {
        const firestoreUser = await getUserFromFirestore(normalizedEmail);
        if (firestoreUser) {
          localUser = firestoreUser;
          matchedLocalKey = firestoreUser.email;
          // Dynamically persist to local users.json cache so next logins are hot
          users[firestoreUser.email] = firestoreUser;
          saveRegisteredUsers(users);
        }
      } catch (err) {
        console.error("[Server] Error in real-time user recovery:", err);
      }
    }

    if (normalizedEmail === "john-doe@example.com" || normalizedEmail === "john-doe") {
      if (password === "sandbox" || password === "yourpassword") {
        matchedUser = { uid: "john-doe-uid", email: "john-doe@example.com", name: "John Doe", username: "john-doe" };
      }
    } else if (normalizedEmail === "jane-smith@example.com" || normalizedEmail === "jane-smith") {
      if (password === "sandbox" || password === "yourpassword") {
        matchedUser = { uid: "jane-smith-uid", email: "jane-smith@example.com", name: "Jane Smith", username: "jane-smith" };
      }
    } else if (localUser) {
      const u = localUser;
      
      // Auto-remedy and upgrade older legacy accounts that were created without password stored
      const isLegacyOrPlaceholderPassword = !u.password || u.password === "imported_from_firestore" || u.password.trim() === "";
      
      if (isLegacyOrPlaceholderPassword) {
        // Upgrade legacy profile password transparently on successful recover
        u.password = password;
        if (matchedLocalKey) {
          users[matchedLocalKey] = u;
          saveRegisteredUsers(users);
          
          // Force instantaneous background synching tasks
          try {
            await syncUserToFirestore(matchedLocalKey, u);
          } catch (syncErr) {
            console.error("[Server] syncUserToFirestore failed during legacy upgrade:", syncErr);
          }
          try {
            await syncUserToUserPortfolio(matchedLocalKey, u);
          } catch (syncErr) {
            console.error("[Server] syncUserToUserPortfolio failed during legacy upgrade:", syncErr);
          }
        }
        matchedUser = u;
      } else if (u.password === password) {
        matchedUser = u;
      } else {
        return res.status(401).json({ error: "Incorrect password for this registered email profile." });
      }
    }

    if (matchedUser) {
      try {
        await syncUserLoginToFirestore(matchedUser);
      } catch (loginSyncErr) {
        console.error("[Server] syncUserLoginToFirestore failed:", loginSyncErr);
      }

      return res.json({
        message: "Authenticated successfully",
        user: {
          uid: matchedUser.uid,
          email: matchedUser.email,
          name: matchedUser.name,
          username: matchedUser.username
        }
      });
    } else {
      return res.status(404).json({ error: `No candidate record found for ${email}. Go to the Sign Up tab to claim yours instantly!` });
    }
  });

  // Get safe active sandbox users list
  app.get("/api/auth/users", (req, res) => {
    try {
      const users = getRegisteredUsers();
      const safeUsers = Object.values(users).map((u: any) => ({
        email: u.email,
        name: u.name,
        username: u.username
      }));
      res.json(safeUsers);
    } catch (err) {
      res.json([]);
    }
  });

  // 1. API Status (Home page)
  app.get("/api/status", (req, res) => {
    const portfolios = getPortfolios();
    const count = Object.keys(portfolios).length;
    res.json({
      status: "active",
      service: "User Portfolio Builder Service",
      version: "1.2.0",
      stats: {
        totalPortfoliosCreated: count,
        databaseProvider: "Local High-Fidelity JSON Persistence",
        authProvider: "Firebase Authentication"
      },
      message: "REST API endpoints are healthy. Created portfolios can be viewed at index '/#/:username'."
    });
  });

  // Provide a root endpoint response as requested in Part I.1 (curl -X GET "https://api-cf3p2jpe5a-uc.a.run.app/")
  app.get("/", (req, res, next) => {
    // If requesting JSON API directly, return status
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      const portfolios = getPortfolios();
      return res.json({
        status: "active",
        message: "Portfolio Builder backend running on Cloud Run! Check out live portfolios at /#/username or login through the UI.",
        portfoliosCreated: Object.keys(portfolios).length
      });
    }
    // Otherwise, let Vite or static route serve the UI dashboard!
    next();
  });

  // Helper to resolve portfolio with local and Firestore real-time fallbacks
  async function resolvePortfolio(username: string): Promise<any> {
    const formattedUsername = username.toLowerCase().trim();
    const portfolios = getPortfolios();
    let portfolio = portfolios[formattedUsername];

    if (!portfolio && useFirestore) {
      try {
        const firestorePortfolio = await getPortfolioFromFirestore(formattedUsername);
        if (firestorePortfolio) {
          portfolio = firestorePortfolio;
          portfolios[formattedUsername] = firestorePortfolio;
          savePortfolios(portfolios);
        }
      } catch (err) {
        console.error("[Server] Error in resolvePortfolio Firestore fallback:", err);
      }
    }
    return portfolio;
  }

  // 2. Get Full Portfolio Data
  app.get("/api/portfolios/:username", async (req, res) => {
    const { username } = req.params;
    const portfolio = await resolvePortfolio(username);

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Return the full portfolio, sorting collections by 'order' ascending
    const sortedPortfolio = {
      ...portfolio,
      experiences: [...(portfolio.experiences || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      projects: [...(portfolio.projects || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      socialLinks: [...(portfolio.socialLinks || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    };

    res.json(sortedPortfolio);
  });

  // 2.5 Serve Portfolio CV / Resume Document natively
  app.get("/api/portfolios/:username/cv", async (req, res) => {
    const { username } = req.params;
    const formattedUsername = username.toLowerCase().trim();
    
    try {
      const cvData = await getCVData(formattedUsername);
      if (!cvData || cvData.trim() === "") {
        // Redirection or fallback to portfolios json standard if stored there or missing
        const portfolios = getPortfolios();
        const portfolio = portfolios[formattedUsername];
        if (portfolio && portfolio.cvUrl && !portfolio.cvUrl.includes("/cv") && portfolio.cvUrl.startsWith("http")) {
          return res.redirect(portfolio.cvUrl);
        }
        return res.status(404).json({ error: "CV document not found for this portfolio profile." });
      }

      if (cvData.startsWith("data:")) {
        // Parse elements like "data:application/pdf;base64,JVBERi-..."
        const match = cvData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const contentType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, "base64");
          
          let extension = "pdf";
          if (contentType.includes("word") || contentType.includes("officedocument")) {
            extension = "docx";
          } else if (contentType.includes("png")) {
            extension = "png";
          } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            extension = "jpg";
          }

          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", `inline; filename="cv_${formattedUsername}.${extension}"`);
          return res.send(buffer);
        }
      }

      // If it's a standard URL, redirect to it
      if (cvData.startsWith("http")) {
        return res.redirect(cvData);
      }

      return res.status(400).json({ error: "CV asset format is invalid." });
    } catch (err) {
      console.error(`Error serving CV for @${formattedUsername}:`, err);
      res.status(500).json({ error: "Failed to load CV document from storage database." });
    }
  });

  // 3. Get Experiences List Only
  app.get("/api/portfolios/:username/experiences", async (req, res) => {
    const { username } = req.params;
    const portfolio = await resolvePortfolio(username);

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const experiences = [...(portfolio.experiences || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    res.json(experiences);
  });

  // 4. Get Projects List Only
  app.get("/api/portfolios/:username/projects", async (req, res) => {
    const { username } = req.params;
    const portfolio = await resolvePortfolio(username);

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const projects = [...(portfolio.projects || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    res.json(projects);
  });

  // 5. Get Social Links Only
  app.get("/api/portfolios/:username/social", async (req, res) => {
    const { username } = req.params;
    const portfolio = await resolvePortfolio(username);

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const socialLinks = [...(portfolio.socialLinks || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    res.json(socialLinks);
  });

  // --- II. Authenticated Enforcers ---

  const requireAuth = (req: any, res: any, next: any) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Firebase ID Token Required inside Bearer token header. Format: 'Authorization: Bearer <ID_TOKEN>'"
      });
    }
    req.user = user;
    next();
  };

  const findUserPortfolio = (uid: string, data: any) => {
    const key = Object.keys(data).find(username => data[username].ownerId === uid);
    return key ? { key, portfolio: data[key] } : null;
  };

  // 6. Create New Portfolio
  app.post("/api/portfolio", requireAuth, async (req, res) => {
    const { username, displayName, bio, photoURL, theme, sectionsOrder, cvUrl, tagline, skills, department } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "username is required" });
    }

    const formattedUsername = username.trim().toLowerCase();
    const portfolios = getPortfolios();

    // Check if username taken by someone else
    if (portfolios[formattedUsername] && portfolios[formattedUsername].ownerId !== req.user.uid) {
      return res.status(409).json({ error: "Username is already taken by another profile" });
    }

    // Check if this user already has a portfolio under a different username
    const existing = findUserPortfolio(req.user.uid, portfolios);
    if (existing && existing.key !== formattedUsername) {
      // Delete old key to migrate them cleanly
      delete portfolios[existing.key];
    }

    const currentPortfolio = existing ? existing.portfolio : {
      experiences: [],
      projects: [],
      socialLinks: []
    };

    let processedCvUrl = cvUrl || "";
    if (processedCvUrl.startsWith("data:")) {
      await saveCVData(formattedUsername, processedCvUrl);
      processedCvUrl = `/api/portfolios/${formattedUsername}/cv`;
    }

    portfolios[formattedUsername] = {
      username: username.trim(),
      displayName: displayName || req.user.name || "New Professional",
      bio: bio || "",
      photoURL: photoURL || "",
      theme: theme || "light",
      sectionsOrder: sectionsOrder || ["experiences", "projects", "socialLinks"],
      ownerId: req.user.uid,
      cvUrl: processedCvUrl,
      tagline: tagline || "",
      skills: skills || "",
      department: department || "it",
      experiences: currentPortfolio.experiences || [],
      projects: currentPortfolio.projects || [],
      socialLinks: currentPortfolio.socialLinks || []
    };

    savePortfolios(portfolios);
    res.status(201).json(portfolios[formattedUsername]);
  });

  // 7. Update Portfolio Metadata & User Profile
  app.put("/api/portfolio", requireAuth, async (req, res) => {
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found. Create your portfolio profile first." });
    }

    const { theme, bio, displayName, photoURL, sectionsOrder, username, cvUrl, tagline, skills, department } = req.body;
    let targetKey = userPort.key;

    // Handle interactive rename
    if (username && username.trim().toLowerCase() !== userPort.key) {
      const newUsernameFormatted = username.trim().toLowerCase();
      if (portfolios[newUsernameFormatted] && portfolios[newUsernameFormatted].ownerId !== req.user.uid) {
        return res.status(409).json({ error: "Username is already taken" });
      }
      // Migrate keys
      portfolios[newUsernameFormatted] = portfolios[userPort.key];
      delete portfolios[userPort.key];
      targetKey = newUsernameFormatted;
      portfolios[targetKey].username = username.trim();
    }

    let processedCvUrl = cvUrl;
    if (processedCvUrl !== undefined) {
      if (processedCvUrl.startsWith("data:")) {
        await saveCVData(targetKey, processedCvUrl);
        processedCvUrl = `/api/portfolios/${targetKey}/cv`;
      }
      portfolios[targetKey].cvUrl = processedCvUrl;
    }

    if (displayName !== undefined) portfolios[targetKey].displayName = displayName;
    if (bio !== undefined) portfolios[targetKey].bio = bio;
    if (photoURL !== undefined) portfolios[targetKey].photoURL = photoURL;
    if (theme !== undefined) portfolios[targetKey].theme = theme;
    if (sectionsOrder !== undefined) portfolios[targetKey].sectionsOrder = sectionsOrder;
    if (tagline !== undefined) portfolios[targetKey].tagline = tagline;
    if (skills !== undefined) portfolios[targetKey].skills = skills;
    if (department !== undefined) portfolios[targetKey].department = department;

    savePortfolios(portfolios);
    res.json(portfolios[targetKey]);
  });

  // 8. Add Experience
  app.post("/api/portfolio/experiences", requireAuth, (req, res) => {
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio profile not found. Create one first." });
    }

    const { role, company, startDate, endDate, description, order } = req.body;
    if (!role || !company) {
      return res.status(400).json({ error: "role and company are required" });
    }

    const newExp = {
      id: "exp-" + Math.random().toString(36).substring(2, 9),
      role,
      company,
      startDate: startDate || "",
      endDate: endDate || null,
      description: description || "",
      order: order !== undefined ? Number(order) : (userPort.portfolio.experiences?.length || 0) + 1
    };

    if (!userPort.portfolio.experiences) {
      userPort.portfolio.experiences = [];
    }
    userPort.portfolio.experiences.push(newExp);
    savePortfolios(portfolios);

    res.status(201).json(newExp);
  });

  // 9. Update Experience
  app.put("/api/portfolio/experiences/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const experiences = userPort.portfolio.experiences || [];
    const exp = experiences.find((e: any) => e.id === id);

    if (!exp) {
      return res.status(404).json({ error: "Experience record not found" });
    }

    const { role, company, startDate, endDate, description, order } = req.body;

    if (role !== undefined) exp.role = role;
    if (company !== undefined) exp.company = company;
    if (startDate !== undefined) exp.startDate = startDate;
    if (endDate !== undefined) exp.endDate = endDate;
    if (description !== undefined) exp.description = description;
    if (order !== undefined) exp.order = Number(order);

    savePortfolios(portfolios);
    res.json(exp);
  });

  // 10. Delete Experience
  app.delete("/api/portfolio/experiences/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const targetKey = userPort.key;
    const cleanId = id.trim().toLowerCase();
    const initialList = portfolios[targetKey].experiences || [];
    const initialLength = initialList.length;
    
    portfolios[targetKey].experiences = initialList.filter(
      (e: any) => e.id?.toString().trim().toLowerCase() !== cleanId
    );

    if (portfolios[targetKey].experiences.length === initialLength) {
      return res.status(404).json({ error: "Experience record not found" });
    }

    savePortfolios(portfolios);
    res.json({ success: true, message: "Experience successfully deleted" });
  });

  // 11. Add Project
  app.post("/api/portfolio/projects", requireAuth, (req, res) => {
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio profile not found. Create one first." });
    }

    const { title, description, link, demoLink, imageURL, images, techStack, order } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const newProj = {
      id: "proj-" + Math.random().toString(36).substring(2, 9),
      title,
      description,
      link: link || "",
      demoLink: demoLink || "",
      imageURL: imageURL || "",
      images: Array.isArray(images) ? images : [],
      techStack: techStack || "",
      order: order !== undefined ? Number(order) : (userPort.portfolio.projects?.length || 0) + 1
    };

    if (!userPort.portfolio.projects) {
      userPort.portfolio.projects = [];
    }
    userPort.portfolio.projects.push(newProj);
    savePortfolios(portfolios);

    res.status(201).json(newProj);
  });

  // 12. Update Project
  app.put("/api/portfolio/projects/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const projects = userPort.portfolio.projects || [];
    const proj = projects.find((p: any) => p.id === id);

    if (!proj) {
      return res.status(404).json({ error: "Project record not found" });
    }

    const { title, description, link, demoLink, imageURL, images, techStack, order } = req.body;

    if (title !== undefined) proj.title = title;
    if (description !== undefined) proj.description = description;
    if (link !== undefined) proj.link = link;
    if (demoLink !== undefined) proj.demoLink = demoLink;
    if (imageURL !== undefined) proj.imageURL = imageURL;
    if (images !== undefined) proj.images = Array.isArray(images) ? images : [];
    if (techStack !== undefined) proj.techStack = techStack;
    if (order !== undefined) proj.order = Number(order);

    savePortfolios(portfolios);
    res.json(proj);
  });

  // 13. Delete Project
  app.delete("/api/portfolio/projects/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const targetKey = userPort.key;
    const cleanId = id.trim().toLowerCase();
    const initialList = portfolios[targetKey].projects || [];
    const initialLength = initialList.length;

    portfolios[targetKey].projects = initialList.filter(
      (p: any) => p.id?.toString().trim().toLowerCase() !== cleanId
    );

    if (portfolios[targetKey].projects.length === initialLength) {
      return res.status(404).json({ error: "Project record not found" });
    }

    savePortfolios(portfolios);
    res.json({ success: true, message: "Project successfully deleted" });
  });

  // 14. Add Social Link
  app.post("/api/portfolio/social", requireAuth, (req, res) => {
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio profile not found. Create one first." });
    }

    const { platform, url, order } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ error: "platform and url are required" });
    }

    const newSocial = {
      id: "soc-" + Math.random().toString(36).substring(2, 9),
      platform,
      url,
      order: order !== undefined ? Number(order) : (userPort.portfolio.socialLinks?.length || 0) + 1
    };

    if (!userPort.portfolio.socialLinks) {
      userPort.portfolio.socialLinks = [];
    }
    userPort.portfolio.socialLinks.push(newSocial);
    savePortfolios(portfolios);

    res.status(201).json(newSocial);
  });

  // 15. Update Social Link
  app.put("/api/portfolio/social/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const socialLinks = userPort.portfolio.socialLinks || [];
    const soc = socialLinks.find((s: any) => s.id === id);

    if (!soc) {
      return res.status(404).json({ error: "Social Link not found" });
    }

    const { platform, url, order } = req.body;

    if (platform !== undefined) soc.platform = platform;
    if (url !== undefined) soc.url = url;
    if (order !== undefined) soc.order = Number(order);

    savePortfolios(portfolios);
    res.json(soc);
  });

  // 16. Delete Social Link
  app.delete("/api/portfolio/social/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio not found." });
    }

    const targetKey = userPort.key;
    const cleanId = id.trim().toLowerCase();
    const initialList = portfolios[targetKey].socialLinks || [];
    const initialLength = initialList.length;

    portfolios[targetKey].socialLinks = initialList.filter(
      (s: any) => s.id?.toString().trim().toLowerCase() !== cleanId
    );

    if (portfolios[targetKey].socialLinks.length === initialLength) {
      return res.status(404).json({ error: "Social Link not found" });
    }

    savePortfolios(portfolios);
    res.json({ success: true, message: "Social Link successfully deleted" });
  });

  // 17. Reorder Sections
  app.post("/api/portfolio/order", requireAuth, (req, res) => {
    const { sectionsOrder } = req.body;
    if (!sectionsOrder || !Array.isArray(sectionsOrder)) {
      return res.status(400).json({ error: "sectionsOrder is required and must be an Array" });
    }

    const portfolios = getPortfolios();
    const userPort = findUserPortfolio(req.user.uid, portfolios);

    if (!userPort) {
      return res.status(404).json({ error: "Portfolio profile not found." });
    }

    userPort.portfolio.sectionsOrder = sectionsOrder;
    savePortfolios(portfolios);

    res.json({
      success: true,
      message: "Sections reordered successfully",
      sectionsOrder: userPort.portfolio.sectionsOrder
    });
  });

  // --- III. AI Suggestion Endpoint Proxy (Google Gemini API) ---
  
  // High-fidelity local smart fallback generation engine for resilience (e.g., credit depletion, network, or key issues)
  function generateLocalFallback(type: string, promptText: string, role?: string, company?: string): string {
    const cleanPrompt = promptText.trim().replace(/^["'\s]+|["'\s]+$/g, "");
    
    if (type === "bio") {
      if (cleanPrompt.length < 15) {
        return `A passionate developer and designer with a focus on building modern web applications. Specialized in creating clean user interfaces, optimizing client experiences, and leveraging cutting-edge cloud architectures.`;
      }
      
      const matches = cleanPrompt.match(/(react|vue|angular|node|typescript|javascript|python|go|java|cloud|aws|gcp|docker|kubernetes|ui|ux|database|sql|nosql|c\+\+|c#|ruby|swift|kotlin)/gi);
      const skillsList = matches ? Array.from(new Set(matches.map(m => m.toLowerCase()))) : [];
      
      let skillsSentence = "";
      if (skillsList.length > 0) {
        const formattedSkills = skillsList.map(s => {
          if (s === "gcp") return "Google Cloud Platform";
          if (s === "aws") return "Amazon Web Services";
          if (s === "ui" || s === "ux") return s.toUpperCase();
          return s.charAt(0).toUpperCase() + s.slice(1);
        }).join(", ");
        skillsSentence = ` Highly proficient in modern engineering tools including ${formattedSkills}.`;
      }
      
      return `Driven and results-oriented professional with a strong track record of designing and delivering impactful technology solutions.${skillsSentence} Committed to writing clean, maintainable code, optimizing platform architectures, and building responsive, user-centric interfaces.`;
    }
    
    if (type === "experience") {
      const roleName = role || "Software Engineer";
      const companyName = company || "Tech Solutions";
      
      if (cleanPrompt.length < 10) {
        return `Contributed to the core development lifecycle for ${roleName} at ${companyName}. Successfully built new features, enhanced product stability, and collaborated with cross-functional teams to deliver high-quality deliverables on schedule.`;
      }
      
      const polishedPrompt = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);
      return `As a ${roleName} at ${companyName}, successfully spearheaded key software initiatives and designed modular components. ${polishedPrompt}. Collaborative team player dedicated to engineering scalable systems, optimizing application performance, and accelerating delivery pipelines.`;
    }
    
    // Project type fallback
    if (cleanPrompt.length < 10) {
      return `An innovative web application designed to solve real-world problems. Features a clean, modular architecture, a highly responsive user interface, and seamless data synchronization patterns built using modern tech stacks.`;
    }
    
    const polishedPrompt = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);
    return `An advanced development project designed and implemented with high attention to performance and user experience. ${polishedPrompt}. Built using industry-standard engineering patterns and optimized for high responsiveness.`;
  }

  app.post("/api/ai/suggest", async (req, res) => {
    const { type, promptText, role, company } = req.body;
    if (!promptText || promptText.trim() === "") {
      return res.status(400).json({ error: "Context promptText is required for AI suggestions." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("[Server] Gemini API key is missing or not configured. Activating smart offline fallback.");
      const fallbackResult = generateLocalFallback(type, promptText, role, company);
      return res.json({
        result: fallbackResult,
        isFallback: true,
        message: "Gemini API key is not configured in this workspace environment. Showing smart local suggestion fallback."
      });
    }

    try {
      // Lazy load GoogleGenAI SDK to prevent startup latency issues
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      let instruction = "";
      if (type === "bio") {
        instruction = `Write a professional, modern elevator pitch bio (maximum 3 concise sentences) based on this information: "${promptText}". Format: Just the clean plain-text bio, no extra quotes or markdown introductions. Avoid cliche buzzwords, focus on professional impact, cloud architectures, developer tools or design standards.`;
      } else if (type === "experience") {
        instruction = `Write a highly professional achievement-oriented experience description summary for the role "${role || "Software Engineer"}" at "${company || "Tech Corp"}" based on these rough notes: "${promptText}". Keep it energetic, action-driven, and short (3 sentences max). Plain-text only, no markdown headers or bullet symbols.`;
      } else {
        instruction = `Enhance the following text to sound highly professional, technical, and impactful for a software developer portfolio: "${promptText}". Return only the polished plain-text version, maximum 3 sentences.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: instruction,
      });

      res.json({ result: response.text?.trim() || "" });
    } catch (err: any) {
      console.error("Gemini invocation failed:", err);
      
      // Determine if this is a credit depletion / billing / quota / 429 error
      const isQuotaOrBillingError = 
        err.message?.toLowerCase().includes("prepayment") ||
        err.message?.toLowerCase().includes("depleted") ||
        err.message?.toLowerCase().includes("credits") ||
        err.message?.toLowerCase().includes("billing") ||
        err.message?.toLowerCase().includes("quota") ||
        err.message?.toLowerCase().includes("resource_exhausted") ||
        err.status === 429;

      const fallbackResult = generateLocalFallback(type, promptText, role, company);

      if (isQuotaOrBillingError) {
        console.warn("[Server] Prepayment credits depleted or quota limit hit on Gemini API key. Activating smart offline fallback.");
        return res.json({
          result: fallbackResult,
          isFallback: true,
          isQuotaError: true,
          message: "Prepayment credits are depleted or quota limit hit. Showing smart local suggestion fallback to maintain offline app resilience."
        });
      }

      // For any other unexpected errors, still provide the resilient local fallback but include details
      return res.json({
        result: fallbackResult,
        isFallback: true,
        message: `AI Suggestion encountered an issue (${err.message}). Showing smart local suggestion fallback.`,
        details: err.message
      });
    }
  });

  // --- IV. Safety & Error Handling Middleware ---

  // Explicit 404 handler for raw API resources to avoid returning index.html (SPA)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Custom global error handler to handle Entity Too Large and formatting issues as JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        error: "Payload too large. Please upload smaller images or compact your portfolio assets."
      });
    }
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      error: err.message || "An internal server error occurred."
    });
  });

  // --- Vite Dev & Production Static Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve SPA index.html for unknown routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Server] Portfolio backend running on http://0.0.0.0:${PORT}`);
    try {
      const dbInstance = await getFirestoreDB();
      if (dbInstance) {
        console.log("[Server] Triggering initial startup sync with Cloud Firestore...");
        await syncFirestoreToLocalStorage();
      }
    } catch (startupSyncErr) {
      console.warn("[Server] Initial startup sync skipped or failed:", startupSyncErr);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
