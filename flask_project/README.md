# 🚀 Beautiful Flask + Firebase Firestore Portfolio Builder Platform

This is a professional, production-ready, fully responsive CV and Developer Portfolio builder platform. It is designed to work seamlessly both on local machines and deployed on **Google Cloud Run** connected to **Firebase Firestore and Firebase Authentication**.

## ✨ Core Features Included

1. **Candidate Workspace & Console Dashboard**:
   - Complete Profile details modification (displays names, customizable bios, photo URLs).
   - Recruiter CV / Resume attachment links (with high-visibility download actions triggered in lives).
   - Real-time work experiences, creative projects, and social channel CRUD blocks.
   - Dynamic Layout Order: alpine-based section reordering controls.
   - Autosave with automatic debounced API sync and green checkmark state indicators.

2. **Public-facing Profile CVs**:
   - Matches public urls by `@username` directly (e.g. `domain.com/johndoe`).
   - Standard PDF-optimized Styles supporting a high-fidelity print-to-PDF transition when hitting **"Download CV / Print PDF"**.
   - Theme styling profiles natively supported: `light`, `dark`, `cyber` (terminal green), and `slate` (Swiss minimalist grid).

3. **GCP Cloud Run Ready**:
   - Includes custom blueprints (`auth` & `portfolio`).
   - Production Dockerfile wrapping Gunicorn running threads.

---

## 💻 Local Quickstart

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your workstation.

### 2. Configure Virtual Environment & Install packages
Clone or download these files into your workspace, then execute:

```bash
# Navigate to the Flask project folder
cd flask_project

# Spin up a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Setup Firebase Service Account (JSON Secret)
To authorize your server to communicate with Firebase Firestore and verify ID tokens, download active service account credentials:
1. In the **Firebase Console**, go to **Project Settings** > **Service Accounts**.
2. Click **Generate New Private Key** and save the resulting JSON file as `service-account.json` inside your project directory.
3. Define the path pointing to this secure key in your `.env` file:

```env
# .env
FLASK_SECRET_KEY=any-secure-session-salt-passphrase-3000
FIREBASE_SERVICE_ACCOUNT_JSON=service-account.json
```

### 4. Direct Boot App
```bash
python main.py
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## ☁️ Google Cloud Run Deployment

Follow these commands to deploy the Flask application to your Google Cloud Run account:

### Step 1: Initialize Google Cloud CLI
```bash
# Log in with your Google Account
gcloud auth login

# Set your current GCP project target
gcloud config set project [YOUR_PROJECT_ID]
```

### Step 2: Build the Container Image using Cloud Build
Google Cloud Build automates the compilation, sending the result safely to Artifact Registry:

```bash
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/portfolio-builder
```

### Step 3: Launch on Cloud Run
Deploys the compiled container, binding it automatically to standard servers, routing incoming traffic securely on SSL (HTTPS):

```bash
gcloud run deploy portfolio-builder \
    --image gcr.io/[YOUR_PROJECT_ID]/portfolio-builder \
    --platform managed \
    --region asia-southeast1 \
    --allow-unauthenticated
```
*Note: Cloud Run will print the active URL of your deployment (e.g. `https://portfolio-builder-xxxxx.run.app`). Ensure Firebase Auth domains allow this target URL!*

---

## 🎨 Modifying Themes

The templates include Tailwind classes coupled with Alpine state evaluations, defining four layout variations:
- **Classic Professional Light**: Pure white card layout, soft charcoal text, and minimal high contrast grid lines.
- **Cosmic Slate Dark**: Deep navy canvas (`#0f172a`), matching elevated tiles, and green checkmark tags.
- **Brutalist Cyber**: Retro black terminal aesthetics (`font-mono`), featuring sharp glowing terminal-green text and borders.
- **Modern Swiss Minimalist**: Pure premium high-art slate columns with heavy top borders for editorial impact.
