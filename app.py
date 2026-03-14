"""
Autism Risk Assessment - Flask Backend
Run with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import uuid
import secrets
import string

# ✅ ML import
from ml.predictor import predict_risk
def get_age_group(age) -> str:
    try:
        age = int(age)
    except (TypeError, ValueError):
        return "adult"
    if age <= 12:
        return "child"
    elif age <= 17:
        return "adolescent"
    else:
        return "adult"

app = Flask(__name__)
CORS(app,
     origins=["http://localhost:5173", "http://localhost:8080", "*"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True
)

# ==================== CONFIG ====================
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///autism_assessment.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ==================== HELPERS ====================

def generate_id():
    return str(uuid.uuid4())

def generate_invite_code(length=8):
    """Generate a random uppercase alphanumeric invite code"""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ==================== MODELS ====================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'patient' or 'therapist'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Therapist-specific fields
    specialization = db.Column(db.String(100))
    license_number = db.Column(db.String(50))

    # Patient-specific fields
    therapist_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "createdAt": self.created_at.isoformat()
        }
        if self.role == "therapist":
            data["specialization"] = self.specialization
            data["licenseNumber"] = self.license_number
        if self.role == "patient":
            data["therapistId"] = self.therapist_id
        return data


class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    answers = db.Column(db.JSON, nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    feature_importance = db.Column(db.JSON)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)

    patient = db.relationship("User", foreign_keys=[patient_id])

    def to_dict(self):
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient.name if self.patient else None,
            "answers": self.answers,
            "riskScore": self.risk_score,
            "riskLevel": self.risk_level,
            "featureImportance": self.feature_importance,
            "completedAt": self.completed_at.isoformat(),
            "notes": self.notes
        }


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    therapist_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    medication = db.Column(db.String(200))
    dosage = db.Column(db.String(100))
    instructions = db.Column(db.Text, nullable=False)
    recommendations = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("User", foreign_keys=[patient_id])
    therapist = db.relationship("User", foreign_keys=[therapist_id])

    def to_dict(self):
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "therapistId": self.therapist_id,
            "therapistName": self.therapist.name if self.therapist else None,
            "medication": self.medication,
            "dosage": self.dosage,
            "instructions": self.instructions,
            "recommendations": self.recommendations or [],
            "createdAt": self.created_at.isoformat()
        }


# ==================== INVITE CODE MODEL ====================

class InviteCode(db.Model):
    __tablename__ = "invite_codes"

    id = db.Column(db.String(36), primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    therapist_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    used_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    therapist = db.relationship("User", foreign_keys=[therapist_id])

    def is_valid(self):
        return not self.is_used and datetime.utcnow() < self.expires_at

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "therapistId": self.therapist_id,
            "createdAt": self.created_at.isoformat(),
            "expiresAt": self.expires_at.isoformat(),
            "isUsed": self.is_used
        }


# ==================== AUTH ROUTES ====================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    required_fields = ["email", "password", "name", "role"]
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"{field} is required"}), 400

    if data["role"] not in ["patient", "therapist"]:
        return jsonify({"success": False, "error": "Invalid role"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"success": False, "error": "Email already registered"}), 400

    user = User(
        id=generate_id(),
        email=data["email"],
        name=data["name"],
        role=data["role"],
        specialization=data.get("specialization"),
        license_number=data.get("licenseNumber"),
        therapist_id=None
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)

    return jsonify({
        "success": True,
        "data": {
            "user": user.to_dict(),
            "token": token
        }
    })


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"success": False, "error": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id)

    return jsonify({
        "success": True,
        "data": {
            "user": user.to_dict(),
            "token": token
        }
    })


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    return jsonify({"success": True, "data": user.to_dict()})


@app.route("/api/auth/therapist/<therapist_id>", methods=["GET"])
@jwt_required()
def get_therapist(therapist_id):
    therapist = User.query.get(therapist_id)

    if not therapist or therapist.role != "therapist":
        return jsonify({"success": False, "error": "Therapist not found"}), 404

    return jsonify({"success": True, "data": therapist.to_dict()})


# ==================== PATIENT ROUTES ====================

@app.route("/api/patients", methods=["GET"])
@jwt_required()
def get_patients():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "therapist":
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    patients = User.query.filter_by(role="patient", therapist_id=user_id).all()

    return jsonify({
        "success": True,
        "data": [p.to_dict() for p in patients]
    })


@app.route("/api/patients/<patient_id>", methods=["GET"])
@jwt_required()
def get_patient(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    patient = User.query.get(patient_id)

    if not patient or patient.role != "patient":
        return jsonify({"success": False, "error": "Patient not found"}), 404

    if user.role == "patient" and user.id != patient_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    return jsonify({"success": True, "data": patient.to_dict()})


@app.route("/api/patients/<patient_id>/assign", methods=["POST"])
@jwt_required()
def assign_patient(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "therapist":
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    patient = User.query.get(patient_id)

    if not patient or patient.role != "patient":
        return jsonify({"success": False, "error": "Patient not found"}), 404

    patient.therapist_id = user_id
    db.session.commit()

    return jsonify({"success": True, "data": patient.to_dict()})


# ==================== ASSESSMENT ROUTES ====================

@app.route("/api/assessments", methods=["GET"])
@jwt_required()
def get_assessments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    if user.role == "patient":
        assessments = (
            Assessment.query
            .filter_by(patient_id=user_id)
            .order_by(Assessment.completed_at.desc())
            .all()
        )
    else:
        patient_ids = [p.id for p in User.query.filter_by(therapist_id=user_id).all()]
        if not patient_ids:
            return jsonify({"success": True, "data": []})

        assessments = (
            Assessment.query
            .filter(Assessment.patient_id.in_(patient_ids))
            .order_by(Assessment.completed_at.desc())
            .all()
        )

    return jsonify({"success": True, "data": [a.to_dict() for a in assessments]})


@app.route("/api/assessments/<assessment_id>", methods=["GET"])
@jwt_required()
def get_assessment(assessment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    assessment = Assessment.query.get(assessment_id)
    if not assessment:
        return jsonify({"success": False, "error": "Assessment not found"}), 404

    if user.role == "patient" and assessment.patient_id != user_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    if user.role == "therapist":
        patient = User.query.get(assessment.patient_id)
        if patient and patient.therapist_id != user_id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

    return jsonify({"success": True, "data": assessment.to_dict()})


# ==================== DUMMY FALLBACK SCORING ====================

def calculate_risk_score(answers):
    total_score = sum(a.get("value", 0) for a in answers)
    max_possible = len(answers) * 4

    normalized_score = (total_score / max_possible) * 100 if max_possible > 0 else 0

    if normalized_score < 33:
        risk_level = "low"
    elif normalized_score < 66:
        risk_level = "medium"
    else:
        risk_level = "high"

    feature_importance = [
        {"feature": "Social Interaction", "importance": 0.25, "contribution": "negative"},
        {"feature": "Communication", "importance": 0.20, "contribution": "negative"},
        {"feature": "Repetitive Behaviors", "importance": 0.18, "contribution": "negative"},
        {"feature": "Sensory Sensitivity", "importance": 0.15, "contribution": "positive"},
        {"feature": "Emotional Regulation", "importance": 0.12, "contribution": "negative"},
        {"feature": "Daily Living Skills", "importance": 0.10, "contribution": "positive"},
    ]

    return {
        "score": round(normalized_score, 2),
        "level": risk_level,
        "feature_importance": feature_importance
    }


# ==================== CREATE ASSESSMENT ====================

@app.route("/api/assessments", methods=["POST"])
@jwt_required()
def create_assessment():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "patient":
        return jsonify({"success": False, "error": "Only patients can take assessments"}), 403

    data = request.get_json(force=True)

    if not data or "answers" not in data:
        return jsonify({"success": False, "error": "Answers required"}), 400

    answers = data.get("answers", [])
    meta = data.get("meta", {})
    model_choice = "auto"

    age = meta.get("age")
    if age is not None:
        age_group = get_age_group(age)
    else:
        age_group = data.get("ageGroup", "adult")

    try:
        risk_result = predict_risk(age_group, answers, model_choice, meta)
    except Exception as e:
        fallback = calculate_risk_score(answers)
        risk_result = {
            "riskScore": fallback["score"],
            "riskLevel": fallback["level"],
            "featureImportance": fallback["feature_importance"],
            "warning": f"ML model not loaded, fallback used: {str(e)}"
        }

    assessment = Assessment(
        id=generate_id(),
        patient_id=user_id,
        answers=answers,
        risk_score=risk_result["riskScore"],
        risk_level=risk_result["riskLevel"],
        feature_importance=risk_result.get("featureImportance", []),
        notes=data.get("notes")
    )

    db.session.add(assessment)
    db.session.commit()

    return jsonify({"success": True, "data": assessment.to_dict()})


# ==================== PRESCRIPTION ROUTES ====================

@app.route("/api/prescriptions", methods=["GET"])
@jwt_required()
def get_prescriptions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    if user.role == "patient":
        prescriptions = (
            Prescription.query
            .filter_by(patient_id=user_id)
            .order_by(Prescription.created_at.desc())
            .all()
        )
    else:
        prescriptions = (
            Prescription.query
            .filter_by(therapist_id=user_id)
            .order_by(Prescription.created_at.desc())
            .all()
        )

    return jsonify({"success": True, "data": [p.to_dict() for p in prescriptions]})


@app.route("/api/prescriptions", methods=["POST"])
@jwt_required()
def create_prescription():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "therapist":
        return jsonify({"success": False, "error": "Only therapists can create prescriptions"}), 403

    data = request.get_json()

    required_fields = ["patientId", "instructions"]
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"{field} is required"}), 400

    prescription = Prescription(
        id=generate_id(),
        patient_id=data["patientId"],
        therapist_id=user_id,
        medication=data.get("medication"),
        dosage=data.get("dosage"),
        instructions=data["instructions"],
        recommendations=data.get("recommendations", [])
    )

    db.session.add(prescription)
    db.session.commit()

    return jsonify({"success": True, "data": prescription.to_dict()})


@app.route("/api/patients/<patient_id>/prescriptions", methods=["GET"])
@jwt_required()
def get_patient_prescriptions(patient_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == "patient" and user.id != patient_id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    prescriptions = (
        Prescription.query
        .filter_by(patient_id=patient_id)
        .order_by(Prescription.created_at.desc())
        .all()
    )

    return jsonify({"success": True, "data": [p.to_dict() for p in prescriptions]})


# ==================== PREDICT ONLY ROUTE ====================

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)

    answers = data.get("answers", [])
    meta = data.get("meta", {})
    model_choice = "auto"

    age = meta.get("age")
    if age is not None:
        age_group = get_age_group(age)
    else:
        age_group = data.get("ageGroup")

    if not age_group:
        return jsonify({"error": "ageGroup or meta.age is required"}), 400

    if not isinstance(answers, list):
        return jsonify({"error": "answers must be a list"}), 400

    try:
        result = predict_risk(age_group, answers, model_choice, meta)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== INVITE CODE ROUTES ====================

@app.route("/api/invite", methods=["POST"])
@jwt_required()
def generate_invite():
    """Therapist generates a new invite code"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "therapist":
        return jsonify({"success": False, "error": "Only therapists can generate invite codes"}), 403

    old_codes = InviteCode.query.filter_by(therapist_id=user_id, is_used=False).all()
    for old in old_codes:
        db.session.delete(old)

    code = generate_invite_code()
    expires_at = datetime.utcnow() + timedelta(hours=24)

    invite = InviteCode(
        id=generate_id(),
        code=code,
        therapist_id=user_id,
        expires_at=expires_at
    )

    db.session.add(invite)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "code": code,
            "expiresAt": expires_at.isoformat()
        }
    })


@app.route("/api/invite/redeem", methods=["POST"])
@jwt_required()
def redeem_invite():
    """Patient redeems an invite code to link with a therapist"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "patient":
        return jsonify({"success": False, "error": "Only patients can redeem invite codes"}), 403

    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"success": False, "error": "Invite code is required"}), 400

    code = data["code"].strip().upper()
    invite = InviteCode.query.filter_by(code=code).first()

    if not invite:
        return jsonify({"success": False, "error": "Invalid invite code"}), 404

    if not invite.is_valid():
        return jsonify({"success": False, "error": "Invite code has expired or already been used"}), 400

    user.therapist_id = invite.therapist_id
    invite.is_used = True
    invite.used_by = user_id

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Successfully linked to therapist",
            "therapistId": invite.therapist_id
        }
    })


@app.route("/api/invite/validate/<code>", methods=["GET"])
@jwt_required()
def validate_invite(code):
    """Check if an invite code is valid without redeeming it"""
    invite = InviteCode.query.filter_by(code=code.upper()).first()

    if not invite or not invite.is_valid():
        return jsonify({"success": True, "data": {"valid": False}})

    return jsonify({
        "success": True,
        "data": {
            "valid": True,
            "expiresAt": invite.expires_at.isoformat()
        }
    })


# ==================== QUESTIONS ====================

ASSESSMENT_QUESTIONS = [
    {
        "id": 1,
        "question": "How often does the individual make eye contact during conversations?",
        "category": "Social Interaction",
        "options": [
            {"value": 0, "label": "Always"},
            {"value": 1, "label": "Often"},
            {"value": 2, "label": "Sometimes"},
            {"value": 3, "label": "Rarely"},
            {"value": 4, "label": "Never"},
        ],
    },
    {
        "id": 2,
        "question": "How well does the individual understand non-verbal cues (facial expressions, gestures)?",
        "category": "Communication",
        "options": [
            {"value": 0, "label": "Very well"},
            {"value": 1, "label": "Well"},
            {"value": 2, "label": "Moderately"},
            {"value": 3, "label": "Poorly"},
            {"value": 4, "label": "Not at all"},
        ],
    },
    {
        "id": 3,
        "question": "How often does the individual engage in repetitive movements or behaviors?",
        "category": "Repetitive Behaviors",
        "options": [
            {"value": 0, "label": "Never"},
            {"value": 1, "label": "Rarely"},
            {"value": 2, "label": "Sometimes"},
            {"value": 3, "label": "Often"},
            {"value": 4, "label": "Very frequently"},
        ],
    },
    {
        "id": 4,
        "question": "How does the individual respond to changes in routine?",
        "category": "Flexibility",
        "options": [
            {"value": 0, "label": "Adapts easily"},
            {"value": 1, "label": "Minor difficulty"},
            {"value": 2, "label": "Moderate difficulty"},
            {"value": 3, "label": "Significant difficulty"},
            {"value": 4, "label": "Extreme distress"},
        ],
    },
    {
        "id": 5,
        "question": "How sensitive is the individual to sensory stimuli (sounds, lights, textures)?",
        "category": "Sensory Sensitivity",
        "options": [
            {"value": 0, "label": "Not sensitive"},
            {"value": 1, "label": "Slightly sensitive"},
            {"value": 2, "label": "Moderately sensitive"},
            {"value": 3, "label": "Very sensitive"},
            {"value": 4, "label": "Extremely sensitive"},
        ],
    },
    {
        "id": 6,
        "question": "How well does the individual initiate and maintain friendships?",
        "category": "Social Interaction",
        "options": [
            {"value": 0, "label": "Very well"},
            {"value": 1, "label": "Well"},
            {"value": 2, "label": "With some difficulty"},
            {"value": 3, "label": "With significant difficulty"},
            {"value": 4, "label": "Unable to"},
        ],
    },
    {
        "id": 7,
        "question": "How does the individual express emotions?",
        "category": "Emotional Regulation",
        "options": [
            {"value": 0, "label": "Appropriately"},
            {"value": 1, "label": "Mostly appropriately"},
            {"value": 2, "label": "Sometimes inappropriately"},
            {"value": 3, "label": "Often inappropriately"},
            {"value": 4, "label": "Very inappropriately"},
        ],
    },
    {
        "id": 8,
        "question": "How focused is the individual on specific interests or topics?",
        "category": "Repetitive Behaviors",
        "options": [
            {"value": 0, "label": "Balanced interests"},
            {"value": 1, "label": "Slightly focused"},
            {"value": 2, "label": "Moderately focused"},
            {"value": 3, "label": "Highly focused"},
            {"value": 4, "label": "Exclusively focused"},
        ],
    },
    {
        "id": 9,
        "question": "How well does the individual understand and use verbal communication?",
        "category": "Communication",
        "options": [
            {"value": 0, "label": "Age-appropriate"},
            {"value": 1, "label": "Slightly delayed"},
            {"value": 2, "label": "Moderately delayed"},
            {"value": 3, "label": "Significantly delayed"},
            {"value": 4, "label": "Non-verbal"},
        ],
    },
    {
        "id": 10,
        "question": "How well does the individual perform daily living tasks independently?",
        "category": "Daily Living Skills",
        "options": [
            {"value": 0, "label": "Fully independent"},
            {"value": 1, "label": "Mostly independent"},
            {"value": 2, "label": "Needs some help"},
            {"value": 3, "label": "Needs significant help"},
            {"value": 4, "label": "Fully dependent"},
        ],
    },
]


@app.route("/api/questions", methods=["GET"])
def get_questions():
    return jsonify({"success": True, "data": ASSESSMENT_QUESTIONS})


# ==================== HEALTH ====================

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})


# ==================== INIT DB ====================

def init_db():
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)