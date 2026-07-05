from firebase_functions import https_fn
from flask import Flask, request, jsonify, g
import firebase_admin
from firebase_admin import firestore, auth
from google import genai
import functools
import os

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = None
ai_client = None

app = Flask(__name__)

# -----------------------------
# DATABASE & AI LAZY LOAD
# -----------------------------
@app.before_request
def initialize_services():
    global db
    if db is None:
        db = firestore.client()
    print(f"[DEBUG LOG] Request Path: {request.path}", flush=True)
    print(f"[DEBUG LOG] Request URL: {request.url}", flush=True)
    print(f"[DEBUG LOG] Environment PATH_INFO: {request.environ.get('PATH_INFO')}", flush=True)
    print(f"[DEBUG LOG] Environment SCRIPT_NAME: {request.environ.get('SCRIPT_NAME')}", flush=True)


def get_ai_client():
    global ai_client
    if ai_client is None:
        # Client automatically reads GEMINI_API_KEY from environment variables
        ai_client = genai.Client()
    return ai_client


# -----------------------------
# AUTHENTICATION MIDDLEWARE
# -----------------------------
def require_auth(f):
    """Decorator to verify token in Authorization header (Firebase JWT or Sandbox Username)."""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized: Missing or invalid token format"}), 401
        
        token = auth_header.split("Bearer ")[1]
        
        # Determine authentication mode: Firebase JWTs always contain three dot-separated parts
        if len(token.split(".")) == 3:
            try:
                decoded_token = auth.verify_id_token(token)
                g.uid = decoded_token.get("uid")
                g.email = decoded_token.get("email")
            except Exception as e:
                return jsonify({"error": f"Unauthorized: {str(e)}"}), 401
        else:
            # Emulated Sandbox authentication using username
            user_query = db.collection("users").where("username", "==", token).limit(1).get()
            if not user_query:
                return jsonify({"error": "Unauthorized: Sandbox user handle not registered"}), 401
            
            user_doc = user_query[0]
            g.uid = user_doc.id
            g.email = user_doc.to_dict().get("email")
            
        return f(*args, **kwargs)
    return decorated_function


# -----------------------------
# VALIDATION HELPERS (POST ONLY)
# -----------------------------
def validate_experience_post(data):
    role = data.get("role")
    company = data.get("company")
    start_date = data.get("startDate")
    
    if not role or not isinstance(role, str):
        return None, "role is required and must be a string"
    if not company or not isinstance(company, str):
        return None, "company is required and must be a string"
    if not start_date or not isinstance(start_date, str):
        return None, "startDate is required and must be a string"
        
    return {
        "role": role,
        "company": company,
        "startDate": start_date,
        "endDate": data.get("endDate"),
        "description": data.get("description", ""),
        "order": int(data.get("order", 0))
    }, None


def validate_project_post(data):
    title = data.get("title")
    
    if not title or not isinstance(title, str):
        return None, "title is required and must be a string"
        
    return {
        "title": title,
        "description": data.get("description", ""),
        "link": data.get("link"),
        "imageURL": data.get("imageURL"),
        "order": int(data.get("order", 0))
    }, None


def validate_social_link_post(data):
    platform = data.get("platform")
    url = data.get("url")
    
    if not platform or not isinstance(platform, str):
        return None, "platform is required and must be a string"
    if not url or not isinstance(url, str):
        return None, "url is required and must be a string"
        
    return {
        "platform": platform,
        "url": url,
        "order": int(data.get("order", 0))
    }, None


def get_portfolio_id_by_username(username):
    """Helper to retrieve the userId (document ID) associated with a unique username."""
    user_query = db.collection("users").where("username", "==", username).limit(1).get()
    if not user_query:
        return None
    return user_query[0].id


# ==============================================================================
# III. PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED)
# ==============================================================================

# 1. API Status & Statistics
@app.route("/api/status", methods=["GET"])
def get_status():
    try:
        portfolios_ref = db.collection("portfolios").get()
        total_portfolios = len(portfolios_ref)
    except Exception:
        total_portfolios = 0
        
    return jsonify({
        "status": "active",
        "service": "User Portfolio Builder Service",
        "version": "1.2.0",
        "stats": {
            "totalPortfoliosCreated": total_portfolios,
            "databaseProvider": "Local High-Fidelity JSON Persistence",
            "authProvider": "Firebase Authentication"
        },
        "message": "REST API endpoints are healthy. Created portfolios can be viewed at index '/#/:username'."
    }), 200


# 2. Get Full Portfolio Data
@app.route("/api/portfolios/<username>", methods=["GET"])
def get_full_portfolio(username):
    user_query = db.collection("users").where("username", "==", username).limit(1).get()
    if not user_query:
        return jsonify({"error": "User not found"}), 404
        
    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    uid = user_doc.id
    
    portfolio_doc = db.collection("portfolios").document(uid).get()
    if not portfolio_doc.exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    portfolio_data = portfolio_doc.to_dict()
    
    # Fetch subcollections
    experiences_ref = db.collection("portfolios").document(uid).collection("experiences").stream()
    projects_ref = db.collection("portfolios").document(uid).collection("projects").stream()
    social_ref = db.collection("portfolios").document(uid).collection("socialLinks").stream()
    
    experiences = []
    for doc in experiences_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        experiences.append(item)
    experiences.sort(key=lambda x: x.get("order", 0))
    
    projects = []
    for doc in projects_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        projects.append(item)
    projects.sort(key=lambda x: x.get("order", 0))
    
    social_links = []
    for doc in social_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        social_links.append(item)
    social_links.sort(key=lambda x: x.get("order", 0))
    
    return jsonify({
        "username": username,
        "displayName": user_data.get("displayName"),
        "bio": user_data.get("bio"),
        "photoURL": user_data.get("photoURL"),
        "theme": portfolio_data.get("theme", "light"),
        "sectionsOrder": portfolio_data.get("sectionsOrder", []),
        "ownerId": portfolio_data.get("ownerId", uid),
        "cvUrl": portfolio_data.get("cvUrl", ""),
        "tagline": portfolio_data.get("tagline", ""),
        "skills": portfolio_data.get("skills", ""),
        "experiences": experiences,
        "projects": projects,
        "socialLinks": social_links
    }), 200


# 3. Get Experiences List Only
@app.route("/api/portfolios/<username>/experiences", methods=["GET"])
def get_portfolio_experiences(username):
    uid = get_portfolio_id_by_username(username)
    if not uid:
        return jsonify({"error": "Portfolio not found"}), 404
        
    experiences_ref = db.collection("portfolios").document(uid).collection("experiences").stream()
    experiences = []
    for doc in experiences_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        experiences.append(item)
    experiences.sort(key=lambda x: x.get("order", 0))
    
    return jsonify(experiences), 200


# 4. Get Projects List Only
@app.route("/api/portfolios/<username>/projects", methods=["GET"])
def get_portfolio_projects(username):
    uid = get_portfolio_id_by_username(username)
    if not uid:
        return jsonify({"error": "Portfolio not found"}), 404
        
    projects_ref = db.collection("portfolios").document(uid).collection("projects").stream()
    projects = []
    for doc in projects_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        projects.append(item)
    projects.sort(key=lambda x: x.get("order", 0))
    
    return jsonify(projects), 200


# 5. Get Social Links Only
@app.route("/api/portfolios/<username>/social", methods=["GET"])
def get_portfolio_social(username):
    uid = get_portfolio_id_by_username(username)
    if not uid:
        return jsonify({"error": "Portfolio not found"}), 404
        
    social_ref = db.collection("portfolios").document(uid).collection("socialLinks").stream()
    social_links = []
    for doc in social_ref:
        item = doc.to_dict()
        item["id"] = doc.id
        social_links.append(item)
    social_links.sort(key=lambda x: x.get("order", 0))
    
    return jsonify(social_links), 200


# 6. User Registration (Custom Sandbox Store)
@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    username = data.get("username")
    
    if not email or not password or not name or not username:
        return jsonify({"error": "email, password, name, and username are required"}), 400
        
    # Check for conflicts
    existing_email = db.collection("users").where("email", "==", email).limit(1).get()
    if existing_email:
        return jsonify({"error": "Conflict: Email already registered"}), 409
        
    existing_username = db.collection("users").where("username", "==", username).limit(1).get()
    if existing_username:
        return jsonify({"error": "Conflict: Username already taken"}), 409
        
    uid = f"{username}-uid"
    
    user_data = {
        "uid": uid,
        "email": email,
        "password": password,
        "displayName": name,
        "username": username,
        "bio": "",
        "photoURL": ""
    }
    db.collection("users").document(uid).set(user_data)
    
    # Initialize empty portfolio to prevent 404/not found errors on new accounts
    portfolio_data = {
        "userId": uid,
        "ownerId": uid,
        "username": username,
        "theme": "light",
        "sectionsOrder": [],
        "tagline": "",
        "skills": "",
        "cvUrl": ""
    }
    db.collection("portfolios").document(uid).set(portfolio_data)
    
    return jsonify({
        "message": "Successfully registered account and initialized portfolio",
        "user": {
            "uid": uid,
            "email": email,
            "name": name,
            "username": username
        }
    }), 200


# 7. User Login (Sandbox Emulation Verification)
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
        
    user_query = db.collection("users").where("email", "==", email).limit(1).get()
    if not user_query:
        return jsonify({"error": "Invalid email or password"}), 401
        
    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    
    if user_data.get("password") != password:
        return jsonify({"error": "Invalid email or password"}), 401
        
    return jsonify({
        "message": "Authenticated successfully",
        "user": {
            "uid": user_doc.id,
            "email": user_data.get("email"),
            "name": user_data.get("displayName"),
            "username": user_data.get("username")
        }
    }), 200


# 8. List Registered Users
@app.route("/api/auth/users", methods=["GET"])
def list_registered_users():
    users_ref = db.collection("users").stream()
    users_list = []
    for doc in users_ref:
        data = doc.to_dict()
        users_list.append({
            "uid": doc.id,
            "email": data.get("email"),
            "name": data.get("displayName"),
            "username": data.get("username")
        })
    return jsonify(users_list), 200


# ==============================================================================
# IV. AUTHENTICATED ENDPOINTS (AUTHENTICATION HEADER REQUIRED)
# ==============================================================================

# 8b. Get Current User Portfolio Details
@app.route("/api/portfolio/me", methods=["GET"])
@require_auth
def get_my_portfolio():
    user_doc = db.collection("users").document(g.uid).get()
    
    user_data = {}
    if user_doc.exists:
        user_data = user_doc.to_dict()
        
    portfolio_doc = db.collection("portfolios").document(g.uid).get()
    portfolio_data = {}
    if portfolio_doc.exists:
        portfolio_data = portfolio_doc.to_dict()
        
    return jsonify({
        "user": {
            "uid": g.uid,
            "email": g.email or user_data.get("email", ""),
            "username": user_data.get("username", ""),
            "displayName": user_data.get("displayName", ""),
            "bio": user_data.get("bio", ""),
            "photoURL": user_data.get("photoURL", "")
        },
        "hasPortfolio": portfolio_doc.exists,
        "portfolio": portfolio_data
    }), 200


# 9. Create New Portfolio Profile
@app.route("/api/portfolio", methods=["POST"])
@require_auth
def create_portfolio():
    data = request.json or {}
    username = data.get("username")
    
    if not username or not isinstance(username, str):
        return jsonify({"error": "username is required and must be a string"}), 400
        
    existing_user_query = db.collection("users").where("username", "==", username).limit(1).get()
    if existing_user_query and existing_user_query[0].id != g.uid:
        return jsonify({"error": "Conflict: Username already taken"}), 409
        
    # Write profile details
    db.collection("users").document(g.uid).set({
        "username": username,
        "displayName": data.get("displayName", ""),
        "bio": data.get("bio", ""),
        "photoURL": data.get("photoURL", ""),
        "email": g.email
    }, merge=True)
    
    # Write portfolio record
    portfolio_data = {
        "userId": g.uid,
        "ownerId": g.uid,
        "username": username,
        "theme": data.get("theme", "light"),
        "sectionsOrder": data.get("sectionsOrder", []),
        "tagline": data.get("tagline", ""),
        "skills": data.get("skills", ""),
        "cvUrl": data.get("cvUrl", "")
    }
    db.collection("portfolios").document(g.uid).set(portfolio_data, merge=True)
    
    return jsonify(portfolio_data), 201


# 10. Update Portfolio Metadata & Theme Map
@app.route("/api/portfolio", methods=["PUT"])
@require_auth
def update_portfolio_metadata():
    portfolio_ref = db.collection("portfolios").document(g.uid)
    if not portfolio_ref.get().exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    data = request.json or {}
    
    portfolio_updates = {}
    if "theme" in data:
        portfolio_updates["theme"] = data["theme"]
    if "sectionsOrder" in data:
        portfolio_updates["sectionsOrder"] = data["sectionsOrder"]
    if "tagline" in data:
        portfolio_updates["tagline"] = data["tagline"]
    if "skills" in data:
        portfolio_updates["skills"] = data["skills"]
    if "cvUrl" in data:
        portfolio_updates["cvUrl"] = data["cvUrl"]
        
    user_updates = {}
    if "displayName" in data:
        user_updates["displayName"] = data["displayName"]
    if "bio" in data:
        user_updates["bio"] = data["bio"]
    if "photoURL" in data:
        user_updates["photoURL"] = data["photoURL"]
        
    if portfolio_updates:
        portfolio_ref.update(portfolio_updates)
    if user_updates:
        db.collection("users").document(g.uid).update(user_updates)
        
    # Return updated combined record
    p_snap = portfolio_ref.get().to_dict()
    u_snap = db.collection("users").document(g.uid).get().to_dict()
    
    return jsonify({
        "username": p_snap.get("username"),
        "displayName": u_snap.get("displayName"),
        "bio": u_snap.get("bio"),
        "photoURL": u_snap.get("photoURL"),
        "theme": p_snap.get("theme"),
        "sectionsOrder": p_snap.get("sectionsOrder"),
        "ownerId": p_snap.get("ownerId"),
        "cvUrl": p_snap.get("cvUrl"),
        "tagline": p_snap.get("tagline"),
        "skills": p_snap.get("skills")
    }), 200


# 11. Add Professional Experience Card
@app.route("/api/portfolio/experiences", methods=["POST"])
@require_auth
def add_experience():
    portfolio_ref = db.collection("portfolios").document(g.uid)
    if not portfolio_ref.get().exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    data = request.json or {}
    parsed_data, err = validate_experience_post(data)
    if err:
        return jsonify({"error": err}), 400
        
    _, doc_ref = portfolio_ref.collection("experiences").add(parsed_data)
    
    response_payload = parsed_data.copy()
    response_payload["id"] = doc_ref.id
    return jsonify(response_payload), 201


# 12. Modify Professional Experience
@app.route("/api/portfolio/experiences/<id>", methods=["PUT"])
@require_auth
def update_experience(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    exp_ref = portfolio_ref.collection("experiences").document(id)
    exp_snap = exp_ref.get()
    if not exp_snap.exists:
        return jsonify({"error": "Experience record not found"}), 404
        
    data = request.json or {}
    updates = {}
    
    if "role" in data:
        updates["role"] = data["role"]
    if "company" in data:
        updates["company"] = data["company"]
    if "startDate" in data:
        updates["startDate"] = data["startDate"]
    if "endDate" in data:
        updates["endDate"] = data["endDate"]
    if "description" in data:
        updates["description"] = data["description"]
    if "order" in data:
        updates["order"] = int(data["order"])
        
    if updates:
        exp_ref.update(updates)
        
    updated_payload = exp_ref.get().to_dict()
    updated_payload["id"] = id
    return jsonify(updated_payload), 200


# 13. Remove Experience Card
@app.route("/api/portfolio/experiences/<id>", methods=["DELETE"])
@require_auth
def delete_experience(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    exp_ref = portfolio_ref.collection("experiences").document(id)
    if not exp_ref.get().exists:
        return jsonify({"error": "Experience record not found"}), 404
        
    exp_ref.delete()
    return jsonify({"message": "Experience deleted successfully"}), 200


# 14. Add Portfolio Project Box
@app.route("/api/portfolio/projects", methods=["POST"])
@require_auth
def add_project():
    portfolio_ref = db.collection("portfolios").document(g.uid)
    if not portfolio_ref.get().exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    data = request.json or {}
    parsed_data, err = validate_project_post(data)
    if err:
        return jsonify({"error": err}), 400
        
    _, doc_ref = portfolio_ref.collection("projects").add(parsed_data)
    
    response_payload = parsed_data.copy()
    response_payload["id"] = doc_ref.id
    return jsonify(response_payload), 201


# 15. Modify Portfolio Project Box
@app.route("/api/portfolio/projects/<id>", methods=["PUT"])
@require_auth
def update_project(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    proj_ref = portfolio_ref.collection("projects").document(id)
    proj_snap = proj_ref.get()
    if not proj_snap.exists:
        return jsonify({"error": "Project record not found"}), 404
        
    data = request.json or {}
    updates = {}
    
    if "title" in data:
        updates["title"] = data["title"]
    if "description" in data:
        updates["description"] = data["description"]
    if "link" in data:
        updates["link"] = data["link"]
    if "imageURL" in data:
        updates["imageURL"] = data["imageURL"]
    if "order" in data:
        updates["order"] = int(data["order"])
        
    if updates:
        proj_ref.update(updates)
        
    updated_payload = proj_ref.get().to_dict()
    updated_payload["id"] = id
    return jsonify(updated_payload), 200


# 16. Remove Portfolio Project Box
@app.route("/api/portfolio/projects/<id>", methods=["DELETE"])
@require_auth
def delete_project(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    proj_ref = portfolio_ref.collection("projects").document(id)
    if not proj_ref.get().exists:
        return jsonify({"error": "Project record not found"}), 404
        
    proj_ref.delete()
    return jsonify({"message": "Project deleted successfully"}), 200


# 17. Add External Social Connection
@app.route("/api/portfolio/social", methods=["POST"])
@require_auth
def add_social_link():
    portfolio_ref = db.collection("portfolios").document(g.uid)
    if not portfolio_ref.get().exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    data = request.json or {}
    parsed_data, err = validate_social_link_post(data)
    if err:
        return jsonify({"error": err}), 400
        
    _, doc_ref = portfolio_ref.collection("socialLinks").add(parsed_data)
    
    response_payload = parsed_data.copy()
    response_payload["id"] = doc_ref.id
    return jsonify(response_payload), 201


@app.route("/api/portfolio/social/<id>", methods=["PUT"])
@require_auth
def update_social_link(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    social_ref = portfolio_ref.collection("socialLinks").document(id)
    social_snap = social_ref.get()
    if not social_snap.exists:
        return jsonify({"error": "Social link record not found"}), 404
        
    data = request.json or {}
    updates = {}
    
    if "platform" in data:
        updates["platform"] = data["platform"]
    if "url" in data:
        updates["url"] = data["url"]
    if "order" in data:
        updates["order"] = int(data["order"])
        
    if updates:
        social_ref.update(updates)
        
    updated_payload = social_ref.get().to_dict()
    updated_payload["id"] = id
    return jsonify(updated_payload), 200


@app.route("/api/portfolio/social/<id>", methods=["DELETE"])
@require_auth
def delete_social_link(id):
    portfolio_ref = db.collection("portfolios").document(g.uid)
    social_ref = portfolio_ref.collection("socialLinks").document(id)
    if not social_ref.get().exists:
        return jsonify({"error": "Social link record not found"}), 404
        
    social_ref.delete()
    return jsonify({"message": "Social link deleted successfully"}), 200


# 18. Adjust Render Sections Order
@app.route("/api/portfolio/order", methods=["POST"])
@require_auth
def update_sections_order():
    portfolio_ref = db.collection("portfolios").document(g.uid)
    if not portfolio_ref.get().exists:
        return jsonify({"error": "Portfolio not found"}), 404
        
    data = request.json or {}
    
    if isinstance(data, list):
        sections_order = data
    else:
        sections_order = data.get("sectionsOrder") or data.get("order")
        
    if not isinstance(sections_order, list):
        return jsonify({"error": "sectionsOrder is required and must be a list of strings"}), 400
        
    portfolio_ref.update({
        "sectionsOrder": sections_order
    })
    
    return jsonify({
        "sectionsOrder": sections_order
    }), 200


# 19. Generate AI Assistant Suggestion
@app.route("/api/ai/suggest", methods=["POST"])
@require_auth
def ai_suggest():
    data = request.json or {}
    suggest_type = data.get("type")
    prompt_text = data.get("promptText")
    
    if not suggest_type or suggest_type not in ["bio", "experience", "project"]:
        return jsonify({"error": "type is required and must be 'bio', 'experience', or 'project'"}), 400
    if not prompt_text or not isinstance(prompt_text, str):
        return jsonify({"error": "promptText is required and must be a string"}), 400
        
    role = data.get("role", "")
    company = data.get("company", "")
    
    # Structural generation prompts
    if suggest_type == "bio":
        prompt = (
            "You are an expert technical resume writer. Generate a single highly professional, polished "
            "developer portfolio summary or bio based on these raw notes. Output ONLY the bio text:\n"
            f"Notes: {prompt_text}"
        )
    elif suggest_type == "experience":
        context = f"for the role of '{role}' at '{company}'" if role or company else ""
        prompt = (
            "You are an expert technical resume writer. Write a single, highly creative, and professionally "
            f"refined work experience bullet description (beginning with a strong active verb) {context} "
            "suitable for a developer portfolio. Output ONLY the single suggestion sentence:\n"
            f"Notes: {prompt_text}"
        )
    else: # project
        prompt = (
            "You are an expert technical resume writer. Generate a concise, high-impact description "
            "for a featured software project showcase card. Output ONLY the project description text:\n"
            f"Context: {prompt_text}"
        )
        
    try:
        client = get_ai_client()
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        suggestion = response.text.strip()
        return jsonify({
            "suggestion": suggestion
        }), 200
    except Exception as e:
        return jsonify({"error": f"AI Service Error: {str(e)}"}), 500


# -----------------------------
# FIREBASE FUNCTION WRAPPER
# -----------------------------
@https_fn.on_request()
def api(req):
    return app(req.environ, lambda status, headers: None)