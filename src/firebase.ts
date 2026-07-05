/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

let app: any = null;
let db: any = null;
let auth: any = null;
let usingRealFirebase = false;

try {
  // Check if credentials are real or placeholder
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "placeholder-api-key") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    usingRealFirebase = true;

    const customDbId = firebaseConfig.firestoreDatabaseId || "(default)";
    if (customDbId !== "(default)") {
      db = getFirestore(app, customDbId);
      console.log(`[Firebase] Exclusively initialized with custom database: ${customDbId}`);
    } else {
      db = getFirestore(app);
      console.log("[Firebase] Initialized with '(default)' database.");
    }
    console.log("[Firebase] Initialized with live app config.");
  } else {
    console.log("[Firebase] Operating in local sandbox developer emulation mode.");
  }
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
}

export { db, auth, usingRealFirebase, firebaseConfig };
export default app;
