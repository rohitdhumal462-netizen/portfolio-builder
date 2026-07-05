import uuid
import logging
from flask import Blueprint, request, jsonify, session, current_app

portfolio_bp = Blueprint("portfolio", __name__, url_prefix="/api")
logger = logging.getLogger("PortfolioBlueprint")

# Decorator to secure endpoints using Flask's native server session context
def login_required(func):
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return jsonify({
                "error": "Unauthorized",
                "message": "You must be signed in to access developer administrative endpoints."
            }), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

def find_user_portfolio_doc(db, uid):
    """
    Scans portfolios collection to retrieve the document that belongs to the user or returns None.
    """
    if db is None:
        return None, None
    try:
        query = db.collection("portfolios").where("ownerId", "==", uid).limit(1).stream()
        for doc in query:
            return doc.id, doc.to_dict()
    except Exception as e:
        logger.error(f"Error querying user portfolio in Firestore: {e}")
    return None, None

# 1. Fetch Current Logged-in User's Active Profile Schema
@portfolio_bp.route("/portfolio", methods=["GET"])
@login_required
def get_my_portfolio():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    
    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio:
        return jsonify({
            "error": "not_found",
            "message": "No portfolio registered for this candidate yet."
        }), 404
        
    return jsonify(portfolio)

# 2. Universal Creator & Metadata Updater (Includes username claim migration)
@portfolio_bp.route("/portfolio", methods=["POST", "PUT"])
@login_required
def save_portfolio_metadata():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}
    
    username = data.get("username", "").strip().lower()
    display_name = data.get("displayName", "").strip()
    bio = data.get("bio", "").strip()
    photo_url = data.get("photoURL", "").strip()
    theme = data.get("theme", "light")
    cv_url = data.get("cvUrl", "").strip()
    sections_order = data.get("sectionsOrder", ["experiences", "projects", "socialLinks"])

    if not username:
        return jsonify({"error": "Username claim is required."}), 400

    # Sanitize username
    username_clean = "".join(c for c in username if c.isalnum() or c in "-_")
    if not username_clean:
         return jsonify({"error": "Invalid username formatting."}), 400

    if db is None:
        # Fallback dictionary simulate save
        return jsonify({
            "status": "success",
            "message": "Local file simulated saved (Mock state-no Firestore connected).",
            "username": username_clean,
            "displayName": display_name or session["user"]["name"],
            "bio": bio,
            "photoURL": photo_url,
            "theme": theme,
            "cvUrl": cv_url,
            "sectionsOrder": sections_order
        })

    try:
        # Check if username is already claimed by someone else
        existing_ref = db.collection("portfolios").document(username_clean)
        existing_doc = existing_ref.get()
        
        if existing_doc.exists and existing_doc.to_dict().get("ownerId") != uid:
            return jsonify({"error": "Username already claimed by another user."}), 409

        # Search if this user already had a portfolio document (to handle renaming cleanly)
        old_doc_id, old_portfolio = find_user_portfolio_doc(db, uid)
        
        # Determine existing nested collections
        experiences = old_portfolio.get("experiences", []) if old_portfolio else []
        projects = old_portfolio.get("projects", []) if old_portfolio else []
        social_links = old_portfolio.get("socialLinks", []) if old_portfolio else []

        # If they changed their username, remove the old document representation
        if old_doc_id and old_doc_id != username_clean:
            db.collection("portfolios").document(old_doc_id).delete()
            logger.info(f"Deleted old username node '{old_doc_id}' for '{username_clean}' update migration.")

        # Build complete model representation
        updated_portfolio = {
            "username": username_clean,
            "displayName": display_name or session["user"]["name"],
            "bio": bio or "Passionate developer shaping cloud products.",
            "photoURL": photo_url or session["user"]["picture"] or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
            "theme": theme,
            "cvUrl": cv_url,
            "sectionsOrder": sections_order,
            "ownerId": uid,
            "experiences": experiences,
            "projects": projects,
            "socialLinks": social_links
        }

        # Write safely to firestore
        db.collection("portfolios").document(username_clean).set(updated_portfolio)
        logger.info(f"Portfolio saved to Firestore under document '{username_clean}' successfully.")
        return jsonify(updated_portfolio), 200

    except Exception as e:
        logger.error(f"Failed to query/write portfolio document: {e}")
        return jsonify({"error": "internal_error", "message": f"Database operation failed: {e}"}), 500

# 3. Add Experience
@portfolio_bp.route("/portfolio/experiences", methods=["POST"])
@login_required
def add_experience():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}
    
    role = data.get("role", "").strip()
    company = data.get("company", "").strip()
    start_date = data.get("startDate", "").strip()
    end_date = data.get("endDate", "").strip() or None
    description = data.get("description", "").strip()
    order = int(data.get("order", 1))

    if not role or not company:
        return jsonify({"error": "Role and Company are required."}), 400

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Profile not initialized. Please configure setting credentials first."}), 404

    new_experience = {
        "id": f"exp-{uuid.uuid4().hex[:7]}",
        "role": role,
        "company": company,
        "startDate": start_date,
        "endDate": end_date,
        "description": description,
        "order": order
    }

    experiences = portfolio.get("experiences", [])
    experiences.append(new_experience)
    
    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"experiences": experiences})
        except Exception as e:
            return jsonify({"error": f"Database write error: {e}"}), 500

    return jsonify(new_experience), 201

# 4. Update / Edit Experience
@portfolio_bp.route("/portfolio/experiences/<id>", methods=["PUT"])
@login_required
def update_experience(id):
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    experiences = portfolio.get("experiences", [])
    target = None
    for exp in experiences:
        if exp.get("id") == id:
            target = exp
            break

    if not target:
        return jsonify({"error": "Experience record not found."}), 404

    # Apply changes
    if "role" in data: target["role"] = data["role"].strip()
    if "company" in data: target["company"] = data["company"].strip()
    if "startDate" in data: target["startDate"] = data["startDate"].strip()
    if "endDate" in data: target["endDate"] = data["endDate"].strip() or None
    if "description" in data: target["description"] = data["description"].strip()
    if "order" in data: target["order"] = int(data["order"])

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"experiences": experiences})
        except Exception as e:
            return jsonify({"error": f"Database update error: {e}"}), 500

    return jsonify(target)

# 5. Delete Experience
@portfolio_bp.route("/portfolio/experiences/<id>", methods=["DELETE"])
@login_required
def delete_experience(id):
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    experiences = portfolio.get("experiences", [])
    updated_experiences = [exp for exp in experiences if exp.get("id") != id]

    if len(experiences) == len(updated_experiences):
        return jsonify({"error": "Experience record not found."}), 404

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"experiences": updated_experiences})
        except Exception as e:
            return jsonify({"error": f"Database deletion error: {e}"}), 500

    return jsonify({"success": True, "message": "Experience deleted successfully."})

# 6. Add Project
@portfolio_bp.route("/portfolio/projects", methods=["POST"])
@login_required
def add_project():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    link = data.get("link", "").strip()
    image_url = data.get("imageURL", "").strip()
    order = int(data.get("order", 1))

    if not title or not description:
        return jsonify({"error": "Title and description are required."}), 400

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not initialized."}), 404

    new_project = {
        "id": f"proj-{uuid.uuid4().hex[:7]}",
        "title": title,
        "description": description,
        "link": link,
        "imageURL": image_url or "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=300",
        "order": order
    }

    projects = portfolio.get("projects", [])
    projects.append(new_project)

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"projects": projects})
        except Exception as e:
            return jsonify({"error": f"Database write error: {e}"}), 500

    return jsonify(new_project), 201

# 7. Update Project
@portfolio_bp.route("/portfolio/projects/<id>", methods=["PUT"])
@login_required
def update_project(id):
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    projects = portfolio.get("projects", [])
    target = None
    for proj in projects:
        if proj.get("id") == id:
            target = proj
            break

    if not target:
        return jsonify({"error": "Project record not found."}), 404

    if "title" in data: target["title"] = data["title"].strip()
    if "description" in data: target["description"] = data["description"].strip()
    if "link" in data: target["link"] = data["link"].strip()
    if "imageURL" in data: target["imageURL"] = data["imageURL"].strip()
    if "order" in data: target["order"] = int(data["order"])

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"projects": projects})
        except Exception as e:
            return jsonify({"error": f"Database update error: {e}"}), 500

    return jsonify(target)

# 8. Delete Project
@portfolio_bp.route("/portfolio/projects/<id>", methods=["DELETE"])
@login_required
def delete_project(id):
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    projects = portfolio.get("projects", [])
    updated_projects = [proj for proj in projects if proj.get("id") != id]

    if len(projects) == len(updated_projects):
        return jsonify({"error": "Project record not found."}), 404

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"projects": updated_projects})
        except Exception as e:
            return jsonify({"error": f"Database update error: {e}"}), 500

    return jsonify({"success": True, "message": "Project record deleted successfully."})

# 9. Add Social Link
@portfolio_bp.route("/portfolio/social", methods=["POST"])
@login_required
def add_social():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}

    platform = data.get("platform", "").strip()
    url = data.get("url", "").strip()
    order = int(data.get("order", 1))

    if not platform or not url:
        return jsonify({"error": "Platform and URL are required."}), 400

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    new_social = {
        "id": f"soc-{uuid.uuid4().hex[:7]}",
        "platform": platform,
        "url": url,
        "order": order
    }

    socials = portfolio.get("socialLinks", [])
    socials.append(new_social)

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"socialLinks": socials})
        except Exception as e:
            return jsonify({"error": f"Database write error: {e}"}), 500

    return jsonify(new_social), 201

# 10. Delete Social Link
@portfolio_bp.route("/portfolio/social/<id>", methods=["DELETE"])
@login_required
def delete_social(id):
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio node not found."}), 404

    socials = portfolio.get("socialLinks", [])
    updated_socials = [soc for soc in socials if soc.get("id") != id]

    if len(socials) == len(updated_socials):
        return jsonify({"error": "Social link not found."}), 404

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"socialLinks": updated_socials})
        except Exception as e:
            return jsonify({"error": f"Database write error: {e}"}), 500

    return jsonify({"success": True, "message": "Social link deleted successfully."})

# 11. Custom Reorder endpoint
@portfolio_bp.route("/portfolio/order", methods=["POST"])
@login_required
def reorder_sections():
    db = current_app.config["FIREBASE_DB_GETTER"]()
    uid = session["user"]["uid"]
    data = request.get_json() or {}

    sections_order = data.get("sectionsOrder")
    if not sections_order or not isinstance(sections_order, list):
         return jsonify({"error": "sectionsOrder list must be defined."}), 400

    doc_id, portfolio = find_user_portfolio_doc(db, uid)
    if not portfolio or not doc_id:
        return jsonify({"error": "Portfolio not found."}), 404

    if db:
        try:
            db.collection("portfolios").document(doc_id).update({"sectionsOrder": sections_order})
        except Exception as e:
            return jsonify({"error": f"Database write error: {e}"}), 500

    return jsonify({"success": True, "sectionsOrder": sections_order})
