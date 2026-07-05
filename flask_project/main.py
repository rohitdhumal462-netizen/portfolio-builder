import os
import sys
import logging
from flask import Flask, render_code_template, render_template, request, jsonify, redirect, url_for, session
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

# Load optional local environment variables
load_dotenv()

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("CVPortfolioApp")

app = Flask(__name__)
# Cryptographically strong secret key used to secure user cookies/sessions
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-candidate-dashboard-key-3000")

# Initialize Firebase Admin SDK
db = None
try:
    # 1. Look for explicit JSON service account credentials file
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if service_account_path and os.path.exists(service_account_path):
        logger.info(f"Initializing Firebase with explicit service account credentials at {service_account_path}")
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    else:
        # 2. Otherwise safely fall back to Google Cloud SDK Application Default Credentials (ADC)
        logger.info("Initializing Firebase Admin SDK with environment Application Default Credentials (ADC)")
        firebase_admin.initialize_app()
    
    db = firestore.client()
    logger.info("Firebase Firestore initialization succeeded.")
except Exception as e:
    logger.warning(f"Could not initialize default Firebase Admin SDK directly: {e}")
    logger.info("Running in local mock database fallback. Ensure Firebase credentials are set in production.")

# Helper tool: Get reference to FireStore database client
def get_db():
    global db
    if db is None:
        try:
            db = firestore.client()
        except Exception:
            pass
    return db

# Expose Firestore database helper to other blueprints via app config
app.config["FIREBASE_DB_GETTER"] = get_db

# --- IMPORT BLUEPRINTS ---
# We will create these components to modularize code cleanly
from auth import auth_bp
from portfolio import portfolio_bp

app.register_blueprint(auth_bp)
app.register_blueprint(portfolio_bp)

# --- PUBLIC ROUTING ---

# 1. Landing / Portal Welcome Page
@app.route("/")
def home():
    # If user is logged in, direct them to dashboard. Otherwise send to portal login
    if "user" in session:
        return redirect(url_for("dashboard_view"))
    return render_template("login.html")

# 2. Interactive Recruiter Candidate Search Dashboard View
@app.route("/dashboard")
def dashboard_view():
    if "user" not in session:
        return redirect(url_for("home"))
    return render_template("dashboard.html", user=session["user"])

# 3. Dynamic Public Portfolio Page
@app.route("/<username>")
def public_portfolio(username):
    username_clean = username.strip().lower()
    db_client = get_db()
    
    portfolio_data = None
    if db_client:
        try:
            doc_ref = db_client.collection("portfolios").document(username_clean)
            doc_snap = doc_ref.get()
            if doc_snap.exists:
                portfolio_data = doc_snap.to_dict()
        except Exception as err:
            logger.error(f"Firestore query failed for '{username_clean}': {err}")
    
    # Fallback mock check if db is not connected for local developer testing
    if not portfolio_data:
        # Fallback dictionary for testing
        mock_data = {
            "jane": {
                "username": "jane",
                "displayName": "Jane Smith (Mock Account)",
                "bio": "Lead NLP Engineer & Product Architect. Building beautiful serverless pipelines with modern architectures.",
                "theme": "light",
                "photoURL": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
                "cvUrl": "https://example.com/cv.pdf",
                "sectionsOrder": ["experiences", "projects", "socialLinks"],
                "experiences": [
                    {
                        "id": "exp-1",
                        "role": "Lead AI Architect",
                        "company": "Cognitive Solutions",
                        "startDate": "2023-01",
                        "endDate": "",
                        "description": "Architected state of the art LLM fine-tuning pipelines and vector search indexes. Improved query recall rate by 42%.",
                        "order": 1
                    }
                ],
                "projects": [
                    {
                        "id": "proj-1",
                        "title": "Astra Vector DB Interface",
                        "description": "Interactive vector clustering dashboard built using React, Python Flask, and scikit-learn.",
                        "link": "https://github.com",
                        "imageURL": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400",
                        "order": 1
                    }
                ],
                "socialLinks": [
                    {
                        "id": "soc-1",
                        "platform": "GitHub",
                        "url": "https://github.com",
                        "order": 1
                    }
                ]
            }
        }
        if username_clean in mock_data:
            portfolio_data = mock_data[username_clean]

    if not portfolio_data:
        return render_template("404.html", username=username), 404

    # Sort experiences, projects, and social links in public view context dynamically
    experiences = sorted(portfolio_data.get("experiences", []), key=lambda x: int(x.get("order", 0) or 0))
    projects = sorted(portfolio_data.get("projects", []), key=lambda x: int(x.get("order", 0) or 0))
    social_links = sorted(portfolio_data.get("socialLinks", []), key=lambda x: int(x.get("order", 0) or 0))
    
    sections_order = portfolio_data.get("sectionsOrder", ["experiences", "projects", "socialLinks"])
    theme_setting = portfolio_data.get("theme", "light")
    cv_url_link = portfolio_data.get("cvUrl", "")

    return render_template(
        "public_portfolio.html", 
        portfolio=portfolio_data,
        experiences=experiences,
        projects=projects,
        social_links=social_links,
        sections_order=sections_order,
        theme=theme_setting,
        cv_url=cv_url_link
    )

# --- CUSTOM GLOBAL ERROR HANDLERS ---
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html", username=None), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Internal Server Error: {e}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "The backend service experienced an unhandled transaction error. Check logs for details."
    }), 500

if __name__ == "__main__":
    # Host on Port 3000 as required by sandboxed reverse-proxy layer
    port = int(os.getenv("PORT", 3000))
    logger.info(f"Flask service booting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
