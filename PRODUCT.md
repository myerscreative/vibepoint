# Vibepoint — Product Definition

**Last updated: 25 November 2025**

## Official Product Name
Vibepoint – Your Personal Mood Operating System

## Tagline
The mood map that teaches you how to feel exactly how you want.

## Domain
https://vibepoint.app

---

## Core Philosophy

Every mood is created by three controllable inputs:
1. **What you focus on**
2. **What you tell yourself**
3. **What your body is doing**

### Two-Stage Pedagogy

**→ Stage 1 (Free): Awareness**
Learn to notice these three inputs in your current emotional state.

**→ Stage 2 (Pro): Creation**
Learn to deliberately direct these three inputs. *Motion creates emotion.*

---

## The Three Questions

### Free Version (Current & Forever)

1. **What are you focusing on right now?**
2. **What are you telling yourself?**
3. **What sensations are you feeling in your body right now?**

### Pro Version – The Acting Coach (Launching Q1 2026)

The third question upgrades to:

**"How are you holding and moving your body right now?"**

*(posture, breathing, facial expression, tension, movement, etc.)*

This is the pivotal shift from **passive awareness → active creation**.

---

## Tier Structure

### Free Forever
- Unlimited entries
- Gradient mood selector (happiness × motivation)
- Timeline + scatter plot visualizations
- Automatic pattern detection after ~20 entries
- 100% private, encrypted, no ads, no tracking
- Export/delete everything

### Vibepoint Pro – The Acting Coach ($5/mo or $44/yr)

- Third question becomes **active body direction**
- **"I want to feel X"** → instant personal recipe from your best past states
- 60-second custom state scripts
- Real-time body/posture nudges
- Save & name your super-states
- Weekly "emotion auditions"
- Advanced charts + export options

---

## Roadmap Status

- [x] **Phase 1** – Gradient + 3 awareness questions + storage
- [x] **Phase 2** – Pattern detection & insights dashboard
- [ ] **Phase 3** – Pro "Acting Coach" mode (motion → emotion) → **Q1 2026**
- [ ] **Phase 4** – Widgets, gentle reminders, micro-lessons

---

## Tech Stack (Locked)

- **Framework:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth + PostgreSQL + Row-Level Security)
- **Charts:** Recharts
- **Deployment:** Vercel + PWA support

---

## Privacy Principles (Non-Negotiable)

- Row-level security on all user data
- Encrypted at rest
- **No analytics, no social features, no third-party tracking**
- One-click export or permanent delete

---

## Key Repository Files

- `DATABASE.md` – Complete Supabase schema + RLS policies
- `PRODUCT.md` – This document (single source of truth)
- `README.md` – User-facing overview and setup guide
- `public/gradient-reference.png` – Visual reference for mood gradient

---

## Product Principles

This document is the **single source of truth** for product direction.

All future copy, code, and design decisions must stay aligned with the **two-stage pedagogy**:

1. **Free = Sensation awareness**
   *Notice what's happening in your body*

2. **Pro = Deliberate motion that creates emotion**
   *Direct your body to create the state you want*

---

## Development Philosophy

- **Privacy-first:** No compromises on user data protection
- **Progressive disclosure:** Features unlock as users build habits
- **Scientifically grounded:** Based on emotion research and acting techniques
- **Simple, not simplistic:** Sophisticated insights from simple inputs
- **No dark patterns:** Respectful, calm, user-empowering design
