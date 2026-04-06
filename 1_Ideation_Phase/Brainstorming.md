# Brainstorming Document

## Project: FitBuddy — AI-Powered Personal Fitness Coach

---

## Brainstorming Session Overview

**Date:** March 2025  
**Focus Area:** AI-Powered Fitness Application using Google Gemini API  
**Goal:** Identify the best approach to build a scalable, AI-driven fitness coach app

---

## Mind Map: Core Ideas

```
                          ┌─────────────┐
                          │  FitBuddy   │
                          └──────┬──────┘
          ┌───────────────┬──────┴──────┬───────────────┐
          ▼               ▼             ▼               ▼
    [User Input]    [AI Engine]   [Data Storage]  [Frontend UI]
          │               │             │               │
    Name, Age,      Gemini Flash   SQLite DB      Dark Mode
    Weight, Goal,   LLM Prompts    Users Table    Animated
    Intensity       JSON Output    Plans Table    Responsive
                                   Nutrition       Cards/Tabs
```

---

## Feature Brainstorming

### Core Features (Must-Have)
1. **Personalized Workout Plan Generation** — Using Gemini AI with structured prompts
2. **7-Day Plan Structure** — Day-by-day breakdown with warmup, exercises, cooldown
3. **Feedback-Based Plan Update** — Users describe changes, AI regenerates accordingly
4. **Nutrition & Recovery Tips** — Tailored dietary advice based on goal
5. **User Profile Storage** — Save user data to SQLite for persistence

### Nice-to-Have Features (Explored)
- History tracking per user
- Exercise video links
- Calorie calculator integration
- Weekly progress tracking
- Push notifications

### Discarded Features (Too Complex)
- Real-time chat with AI coach
- Wearable device integration
- Payment/subscription model
- Social sharing features

---

## Technology Brainstorming

| Layer | Options Considered | Selected | Reason |
|---|---|---|---|
| Backend | Flask, FastAPI, Django | **FastAPI** | Async, fast, auto-docs, Pydantic |
| AI | OpenAI, Cohere, Gemini | **Gemini 2.0 Flash** | Free tier, powerful, fast |
| Database | PostgreSQL, MongoDB, SQLite | **SQLite** | Simple, file-based, no setup |
| Frontend | React, Vue, Vanilla HTML | **Vanilla HTML/CSS/JS** | Lightweight, no build step |
| Styling | Bootstrap, Tailwind, Custom | **Custom CSS** | Full control, glassmorphism |
| Deployment | AWS, Heroku, Vercel | **Local + Docker** | Easy for submission |

---

## User Journey Brainstorm

```
User Opens App
     │
     ▼
Fill Profile Form (Name, Age, Weight, Goal, Intensity)
     │
     ▼
Click "Generate My 7-Day Plan"
     │
     ▼
AI Generates Personalized Plan → Displayed with Cards
     │
     ▼
User Reviews → Gives Feedback → Click "Update Plan"
     │
     ▼
AI Refines Plan → Updated Plan Shown
     │
     ▼
User Checks "Nutrition Tips" Tab → Enters Goal → Gets Tips
```

---

## Prompt Engineering Ideas

### Brainstormed Prompt Approaches:
1. **Simple prompt**: "Create a workout plan for {name}" — Too generic ❌
2. **Structured prompt with JSON output**: Gives the AI a schema to fill — Best ✅
3. **Chain-of-thought prompt**: Ask AI to reason first, then plan — Too verbose ❌
4. **Role-based prompt**: "You are an expert fitness coach..." — Great for tone ✅

### Final Approach:
- Role-based system prompt + user profile data + required JSON schema
- Response parsing with markdown code fence stripping
- Temperature controlled for consistency

---

## Risk Brainstorm

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gemini API rate limits | Medium | Cache plans, add error handling |
| Invalid JSON from AI | Medium | Try-except + JSON validation |
| SQLite concurrency | Low | Single-user setup for demo |
| API key exposure | High | Environment variables |
| UI not responsive | Low | CSS grid + media queries |

---

## Conclusion

The brainstorming session led to the following key decisions:
- **FastAPI + Gemini + SQLite** as the core tech stack
- **Three core scenarios** as the main features
- **Glassmorphism dark UI** for maximum visual impact
- **Structured JSON prompts** for reliable AI output
