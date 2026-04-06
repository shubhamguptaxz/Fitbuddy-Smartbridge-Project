from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import sqlite3
import json
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
load_dotenv() 

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Configuration ────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("API Key not found!")

genai.configure(api_key=GEMINI_API_KEY)
# Fallback model chain — tries each until one succeeds
MODEL_CHAIN = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"]

def get_model():
    """Return a GenerativeModel, trying each model in the fallback chain."""
    return genai.GenerativeModel(MODEL_CHAIN[0])  # start with lite

app = FastAPI(title="FitBuddy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Setup ────────────────────────────────────────────────────────────
DB_PATH = str(BASE_DIR / "backend" / "fitbuddy.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            weight REAL,
            goal TEXT,
            intensity TEXT,
            created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workout_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_json TEXT,
            feedback TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS nutrition_tips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            goal TEXT,
            tip TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ─── Pydantic Models ───────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    name: str
    age: int
    weight: float
    goal: str          # weight_loss | muscle_gain | general_wellness
    intensity: str     # low | medium | high

class FeedbackRequest(BaseModel):
    user_id: int
    feedback: str

class NutritionRequest(BaseModel):
    user_id: int
    goal: str

# ─── Helper: DB ────────────────────────────────────────────────────────────────
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ─── Helper: Mock Plan (offline fallback) ─────────────────────────────────────
def generate_mock_plan(profile: dict, feedback: str = "") -> dict:
    """Generate a realistic pre-built plan when AI quota is exhausted."""
    goal = profile.get('goal', 'general_wellness')
    intensity = profile.get('intensity', 'medium')
    name = profile.get('name', 'User')

    goal_map = {
        'weight_loss':       ('Weight Loss Blast', 'Your goal is to burn fat and get lean. This plan combines cardio bursts with strength circuits to maximise calorie burn and boost your metabolism all week long.'),
        'muscle_gain':       ('Muscle Builder Program', 'Your goal is to build lean muscle and increase strength. This plan uses progressive bodyweight overload with compound movements to stimulate muscle growth.'),
        'general_wellness':  ('Balanced Wellness Plan', 'Your goal is to stay active and healthy. This plan balances strength, cardio, and flexibility to keep you energised and feeling great every day.'),
    }
    title, goal_summary = goal_map.get(goal, goal_map['general_wellness'])

    day_templates = [
        {"day": "Day 1 - Monday",   "focus": "Full Body Strength",   "duration_minutes": 40,
         "warmup": "5 min light jog in place, arm circles, leg swings, hip rotations.",
         "exercises": [
           {"name": "Push-Ups",         "sets": 3, "reps": "15", "rest": "40s", "tips": "Keep core tight, body in a straight line."},
           {"name": "Bodyweight Squats", "sets": 4, "reps": "20", "rest": "35s", "tips": "Knees behind toes, chest up."},
           {"name": "Plank Hold",        "sets": 3, "reps": "45s", "rest": "30s", "tips": "Squeeze glutes and brace core."},
           {"name": "Glute Bridges",     "sets": 3, "reps": "20", "rest": "30s", "tips": "Fully extend hips at the top."},
           {"name": "Mountain Climbers", "sets": 3, "reps": "30s", "rest": "25s", "tips": "Drive knees fast, keep hips level."},
         ],
         "cooldown": "5 min full-body static stretching — quads, hamstrings, chest, and shoulders.",
         "motivational_note": f"Great start, {name}! You've taken the first step toward your goal."},

        {"day": "Day 2 - Tuesday",  "focus": "Cardio & Core",         "duration_minutes": 35,
         "warmup": "3 min jumping jacks, high knees, then dynamic stretches.",
         "exercises": [
           {"name": "High Knees",       "sets": 4, "reps": "45s", "rest": "20s", "tips": "Pump arms and drive knees to hip height."},
           {"name": "Bicycle Crunches", "sets": 3, "reps": "20",  "rest": "30s", "tips": "Slow and controlled for maximum engagement."},
           {"name": "Burpees",          "sets": 3, "reps": "12",  "rest": "45s", "tips": "Jump explosively, land softly."},
           {"name": "Leg Raises",       "sets": 3, "reps": "15",  "rest": "30s", "tips": "Lower back stays flat on the floor."},
           {"name": "Jump Squats",      "sets": 3, "reps": "15",  "rest": "40s", "tips": "Land softly to protect your knees."},
         ],
         "cooldown": "Child's pose, seated forward fold, lying glute stretch — 5 minutes total.",
         "motivational_note": "Cardio done! Your heart and lungs are getting stronger every session."},

        {"day": "Day 3 - Wednesday", "focus": "Active Recovery",      "duration_minutes": 25,
         "warmup": "Gentle 5 min walk in place.",
         "exercises": [
           {"name": "Cat-Cow Stretch",   "sets": 2, "reps": "10",  "rest": "15s", "tips": "Breathe deeply through each repetition."},
           {"name": "Hip Circles",       "sets": 2, "reps": "10",  "rest": "15s", "tips": "Slow and controlled — feel the mobility."},
           {"name": "Cobra Stretch",     "sets": 3, "reps": "30s", "rest": "20s", "tips": "Gently arch your back without straining."},
           {"name": "Child's Pose",      "sets": 3, "reps": "45s", "rest": "15s", "tips": "Breathe into your lower back."},
           {"name": "Standing Side Bend","sets": 2, "reps": "30s", "rest": "15s", "tips": "Keep both feet planted, reach tall."},
         ],
         "cooldown": "Full body foam rolling or gentle self-massage — focus on quads and back.",
         "motivational_note": "Recovery is when you grow stronger. Rest is part of the plan!"},

        {"day": "Day 4 - Thursday",  "focus": "Upper Body Power",     "duration_minutes": 40,
         "warmup": "Arm swings, shoulder circles, chest openers — 5 minutes.",
         "exercises": [
           {"name": "Wide Push-Ups",     "sets": 3, "reps": "15",  "rest": "40s", "tips": "Wide grip targets outer chest more."},
           {"name": "Diamond Push-Ups",  "sets": 3, "reps": "10",  "rest": "45s", "tips": "Thumbs and forefingers form a diamond."},
           {"name": "Tricep Dips",       "sets": 3, "reps": "15",  "rest": "40s", "tips": "Use a sturdy chair, elbows back."},
           {"name": "Pike Push-Ups",     "sets": 3, "reps": "10",  "rest": "40s", "tips": "Form an inverted V — works shoulders."},
           {"name": "Plank Shoulder Tap","sets": 3, "reps": "20",  "rest": "30s", "tips": "Minimise hip rotation each tap."},
         ],
         "cooldown": "Cross-arm chest stretch, overhead tricep stretch, chest opener — 5 minutes.",
         "motivational_note": "Upper body gains incoming! Consistency is the secret weapon."},

        {"day": "Day 5 - Friday",    "focus": "Legs & Glutes",        "duration_minutes": 45,
         "warmup": "Leg swings, hip openers, sumo squat stretch — 5 minutes.",
         "exercises": [
           {"name": "Sumo Squats",       "sets": 4, "reps": "20",  "rest": "35s", "tips": "Wide stance, toes out 45°, push through heels."},
           {"name": "Reverse Lunges",    "sets": 3, "reps": "12",  "rest": "40s", "tips": "Step back, lower slowly, front knee over ankle."},
           {"name": "Calf Raises",       "sets": 3, "reps": "25",  "rest": "25s", "tips": "Full range — all the way up and down."},
           {"name": "Wall Sit",          "sets": 3, "reps": "45s", "rest": "45s", "tips": "Thighs parallel to floor, back flat."},
           {"name": "Donkey Kicks",      "sets": 3, "reps": "15",  "rest": "30s", "tips": "Squeeze glute at the top of each rep."},
         ],
         "cooldown": "Pigeon pose, standing quad stretch, lying hamstring stretch — 5 minutes.",
         "motivational_note": "Leg day is the best day! Strong legs carry you through anything."},

        {"day": "Day 6 - Saturday",  "focus": "HIIT Circuit",          "duration_minutes": 30,
         "warmup": "3 min jumping jacks, torso twists, dynamic lunges.",
         "exercises": [
           {"name": "Star Jumps",        "sets": 4, "reps": "30s", "rest": "20s", "tips": "Arms and legs simultaneously, full extension."},
           {"name": "Speed Skaters",     "sets": 3, "reps": "30s", "rest": "20s", "tips": "Lateral leap and balance on landing."},
           {"name": "Push-Up to Plank",  "sets": 3, "reps": "10",  "rest": "30s", "tips": "Full push-up, then hold plank for 5s."},
           {"name": "Tuck Jumps",        "sets": 3, "reps": "12",  "rest": "40s", "tips": "Bring knees to chest at peak height."},
           {"name": "Inchworm Walkout",  "sets": 3, "reps": "8",   "rest": "35s", "tips": "Keep legs as straight as possible."},
         ],
         "cooldown": "3 min slow walk in place, full body stretch sequence.",
         "motivational_note": "HIIT done — you just burned serious calories! Weekend warrior!"},

        {"day": "Day 7 - Sunday",    "focus": "Rest & Mobility",       "duration_minutes": 20,
         "warmup": "Gentle breathing exercises — 2 minutes.",
         "exercises": [
           {"name": "Seated Forward Fold","sets": 2, "reps": "60s", "rest": "15s", "tips": "Reach forward, gentle hold — never force."},
           {"name": "Lying Spinal Twist", "sets": 2, "reps": "45s", "rest": "15s", "tips": "Breathe into the twist to deepen it."},
           {"name": "Happy Baby Pose",    "sets": 2, "reps": "45s", "rest": "15s", "tips": "Rock gently side to side for a massage."},
           {"name": "Neck Rolls",         "sets": 2, "reps": "30s", "rest": "10s", "tips": "Slow and gentle circles — never force."},
           {"name": "Diaphragm Breathing","sets": 3, "reps": "10",  "rest": "20s", "tips": "4s inhale, 4s hold, 6s exhale."},
         ],
         "cooldown": "5 min Savasana — lie flat, breathe deeply, let your body rest.",
         "motivational_note": f"Amazing week, {name}! One full week complete. You are unstoppable!"},
    ]

    tips_map = {
        'weight_loss': ["Stay in a slight calorie deficit — around 300–500 kcal below maintenance.", "Drink 2.5–3 litres of water daily to support fat metabolism.", "Sleep 7–8 hours — poor sleep increases hunger hormones and slows fat loss."],
        'muscle_gain': ["Eat 0.8–1g of protein per pound of bodyweight daily to fuel muscle repair.", "Progressive overload is key — add reps or intensity each week.", "Recovery is growth — muscles are built during rest, not during exercise."],
        'general_wellness': ["Balance is everything — mix strength, cardio, and flexibility each week.", "Consistency beats perfection — 3 good workouts beats 1 perfect one.", "Mindset matters — celebrate small wins every single day."],
    }

    return {
        "plan_title": f"{name}'s {title}",
        "goal_summary": goal_summary,
        "weekly_overview": f"A structured 7-day plan tailored for {intensity} intensity, moving you toward your {goal.replace('_', ' ')} goal with a mix of strength, cardio, and recovery days.",
        "days": day_templates,
        "weekly_tips": tips_map.get(goal, tips_map['general_wellness'])
    }


# ─── Helper: Gemini with fallback chain ────────────────────────────────────────
def call_gemini(prompt: str) -> str:
    """Try each model in the fallback chain, raise last error if all fail."""
    last_err = None
    for model_name in MODEL_CHAIN:
        try:
            m = genai.GenerativeModel(model_name)
            response = m.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            err_str = str(e).lower()
            # If quota/rate limit, try next model
            if any(k in err_str for k in ['quota', 'rate', '429', 'resource', 'limit']):
                last_err = e
                continue
            # Other errors (auth, invalid, etc.) — no point retrying other models
            raise
    raise last_err


def parse_json_response(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = text.strip()
    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]
    return json.loads(text.strip())


def generate_workout_plan(profile: dict, feedback: str = "") -> dict:
    feedback_section = f"\nUser Feedback/Modifications: {feedback}" if feedback else ""
    prompt = f"""
You are FitBuddy, an expert personal fitness coach. Generate a detailed, personalized 7-day workout plan.

User Profile:
- Name: {profile['name']}
- Age: {profile['age']} years
- Weight: {profile['weight']} kg
- Fitness Goal: {profile['goal'].replace('_', ' ').title()}
- Workout Intensity: {profile['intensity'].title()}
{feedback_section}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "plan_title": "string",
  "goal_summary": "string (2-3 sentences about their goal)",
  "weekly_overview": "string (brief overview of the week)",
  "days": [
    {{
      "day": "Day 1 - Monday",
      "focus": "string (e.g. Upper Body Strength)",
      "duration_minutes": 45,
      "warmup": "string",
      "exercises": [
        {{"name": "string", "sets": 3, "reps": "string", "rest": "string", "tips": "string"}}
      ],
      "cooldown": "string",
      "motivational_note": "string"
    }}
  ],
  "weekly_tips": ["tip1", "tip2", "tip3"]
}}
"""
    try:
        text = call_gemini(prompt)
        return parse_json_response(text)
    except Exception:
        # All models failed (quota exhausted) — return rich mock plan
        return generate_mock_plan(profile, feedback)


def generate_nutrition_tip(goal: str, name: str) -> dict:
    prompt = f"""
You are FitBuddy, a certified nutritionist. Give a concise, actionable nutrition and recovery tip for someone named {name} whose fitness goal is "{goal.replace('_', ' ')}".

Format your response as JSON:
{{"tip_title": "string", "tip": "string (3-4 sentences)", "foods_to_include": ["food1","food2","food3","food4"], "foods_to_avoid": ["food1","food2","food3"], "hydration_advice": "string", "recovery_advice": "string"}}

Return ONLY valid JSON, no markdown.
"""
    try:
        text = call_gemini(prompt)
        return parse_json_response(text)
    except Exception:
        # Offline fallback nutrition plans
        mock_tips = {
            'weight_loss': {
                "tip_title": "Fat Loss Nutrition Guide",
                "tip": f"Hi {name}! For weight loss, focus on a moderate calorie deficit of 300–500 kcal per day. Prioritise high-protein, high-fibre foods that keep you full longer and support muscle preservation. Avoid processed foods and liquid calories that spike insulin and encourage fat storage.",
                "foods_to_include": ["Chicken breast", "Leafy greens", "Oats", "Eggs", "Greek yogurt", "Berries", "Lentils"],
                "foods_to_avoid": ["Sugary drinks", "White bread", "Fried foods", "Alcohol"],
                "hydration_advice": "Drink 2.5–3 litres of water daily. Start each morning with a glass of water before coffee. Cold water can slightly boost metabolism.",
                "recovery_advice": "Aim for 7–9 hours of sleep — poor sleep raises cortisol and ghrelin (hunger hormone), making fat loss much harder. Schedule at least one full rest day per week."
            },
            'muscle_gain': {
                "tip_title": "Muscle Building Nutrition Guide",
                "tip": f"Hey {name}! To build muscle, you need to eat in a slight calorie surplus of 200–300 kcal above maintenance. Protein is your best friend — aim for 0.8–1g per pound of bodyweight daily. Distribute protein intake evenly across 4–5 meals to maximise muscle protein synthesis.",
                "foods_to_include": ["Eggs", "Chicken", "Tuna", "Cottage cheese", "Brown rice", "Sweet potato", "Almonds"],
                "foods_to_avoid": ["Alcohol", "Excessive sugar", "Ultra-processed snacks", "Trans fats"],
                "hydration_advice": "Drink at least 3 litres of water daily. Dehydration reduces strength by up to 15%. Have a protein shake with water within 30 minutes of training.",
                "recovery_advice": "Muscles are built during rest, not exercise. Sleep 7–9 hours and take 1–2 rest days per week. Consider an ice pack on sore muscles to reduce inflammation."
            },
            'general_wellness': {
                "tip_title": "Balanced Wellness Nutrition Guide",
                "tip": f"Hello {name}! For general wellness, focus on eating a rainbow of whole foods daily. Aim for balance: 40% complex carbs, 30% lean protein, and 30% healthy fats. This ratio fuels energy, supports immunity, and keeps your mood stable throughout the day.",
                "foods_to_include": ["Avocado", "Salmon", "Quinoa", "Spinach", "Mixed berries", "Walnuts", "Dark chocolate (70%+)"],
                "foods_to_avoid": ["Processed meats", "Artificial sweeteners", "Excessive caffeine", "Refined sugar"],
                "hydration_advice": "Drink 2–2.5 litres of water daily. Herbal teas and coconut water are great alternatives. Limit coffee to 1–2 cups per day.",
                "recovery_advice": "Prioritise 7–8 hours of sleep and manage stress through mindfulness or light yoga. A 10-minute post-workout stretch dramatically reduces soreness and improves flexibility."
            }
        }
        return mock_tips.get(goal, mock_tips['general_wellness'])


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.post("/api/generate-plan")
async def generate_plan(profile: UserProfile):
    """Scenario 1: Generate personalized 7-day workout plan."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (name, age, weight, goal, intensity, created_at) VALUES (?,?,?,?,?,?)",
            (profile.name, profile.age, profile.weight, profile.goal, profile.intensity, datetime.now().isoformat())
        )
        user_id = cur.lastrowid

        plan = generate_workout_plan(profile.model_dump())

        cur.execute(
            "INSERT INTO workout_plans (user_id, plan_json, feedback, created_at) VALUES (?,?,?,?)",
            (user_id, json.dumps(plan), "", datetime.now().isoformat())
        )
        plan_id = cur.lastrowid
        conn.commit()
        conn.close()

        return {"success": True, "user_id": user_id, "plan_id": plan_id, "plan": plan}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-plan")
async def update_plan(req: FeedbackRequest):
    """Scenario 2: Update plan based on user feedback."""
    try:
        conn = get_conn()
        cur = conn.cursor()

        user = cur.execute("SELECT * FROM users WHERE id=?", (req.user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        profile = dict(user)
        updated_plan = generate_workout_plan(profile, feedback=req.feedback)

        cur.execute(
            "INSERT INTO workout_plans (user_id, plan_json, feedback, created_at) VALUES (?,?,?,?)",
            (req.user_id, json.dumps(updated_plan), req.feedback, datetime.now().isoformat())
        )
        plan_id = cur.lastrowid
        conn.commit()
        conn.close()

        return {"success": True, "plan_id": plan_id, "plan": updated_plan, "feedback_applied": req.feedback}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/nutrition-tip")
async def get_nutrition_tip(req: NutritionRequest):
    """Scenario 3: Get nutrition/recovery tip based on goal."""
    try:
        conn = get_conn()
        cur = conn.cursor()

        user = cur.execute("SELECT * FROM users WHERE id=?", (req.user_id,)).fetchone()
        name = dict(user)["name"] if user else "User"

        tip_data = generate_nutrition_tip(req.goal, name)

        cur.execute(
            "INSERT INTO nutrition_tips (user_id, goal, tip, created_at) VALUES (?,?,?,?)",
            (req.user_id, req.goal, json.dumps(tip_data), datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        return {"success": True, "nutrition": tip_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/{user_id}/history")
async def get_user_history(user_id: int):
    """Get all plans for a user."""
    conn = get_conn()
    cur = conn.cursor()
    user = cur.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    plans = cur.execute(
        "SELECT * FROM workout_plans WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    tips = cur.execute(
        "SELECT * FROM nutrition_tips WHERE user_id=? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    return {
        "user": dict(user),
        "plans": [dict(p) for p in plans],
        "nutrition_tips": [dict(t) for t in tips]
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "FitBuddy API", "version": "1.0.0"}


# Serve frontend
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "frontend" / "static")), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse(str(BASE_DIR / "frontend" / "index.html"))
