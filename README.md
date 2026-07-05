# AI Portfolio Builder

A full-stack AI-powered portfolio builder application.

## Tech Stack
- **Frontend**: Google AI Studio (React + Vite)
- **Backend**: Python + Flask & Node (Express)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API

---

## Features
- User authentication (Firebase Auth validation)
- Portfolio creation, customization, and management
- Experience, projects, and social links
- AI-generated bios and project descriptions (Gemini API)

---

## Run Locally

### Prerequisites
- Node.js
- Python (for Flask backend)

### 1. Frontend Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env` (add your `GEMINI_API_KEY`).
3. Run the development server:
   ```bash
   npm run dev
   ```

### 2. Flask Backend Setup & Run
1. Navigate to the `flask_project` directory.
2. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python main.py
   ```

---

## Live Links
- **Live Demo**: [https://portfolio-api-builder-dashboard-244422993959.asia-southeast1.run.app](https://portfolio-api-builder-dashboard-244422993959.asia-southeast1.run.app)
- **API Endpoint**: [https://us-central1-products-d644c.cloudfunctions.net/api/api/status](https://us-central1-products-d644c.cloudfunctions.net/api/api/status)
