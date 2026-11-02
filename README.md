# NextHireAI Web Application

A comprehensive AI-powered career readiness platform. This document provides a step-by-step setup guide, architecture overview of the modules, and Git workflow instructions.

---

## 🧩 Application Modules

NextHireAI is built using a modular architecture located under `src/modules/`. Each module is designed to handle a core aspect of the career readiness journey:

| Module | Directory | Description |
|---|---|---|
| **User Profile Management** | `src/modules/user-management/` | Manages user profiles, career interests, target roles, academic history, and preferences. |
| **AI Resume Analyzer** | `src/modules/ai-resume-analyzer/` | Parses and analyzes resumes against job descriptions, ATS compatibility scores, and keyword suggestions. |
| **AI Mock Interview Engine** | `src/modules/mock-interview/` | Conducts interactive AI-powered mock interviews with speech recognition, question pacing, and real-time evaluation. |
| **Career Readiness Assessment** | `src/modules/interview-readiness/` | Evaluates overall candidate performance, providing readiness scores, gap analysis, and detailed feedback. |
| **Learning Recommendation** | `src/modules/learning-recommendation/` | Generates tailored learning pathways, recommended courses, and skill-building resources based on assessment gaps. |
| **Progress & Tracking** | `src/modules/recommendation-tracking/` | Tracks long-term candidate progress, improvement trends, and completed interview goals. |

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:
1. **Node.js** (v18 or higher / LTS v20+ recommended): [Download Node.js](https://nodejs.org/)
2. **Git**: [Download Git](https://git-scm.com/)
3. **pnpm** (recommended package manager):
   ```bash
   npm install -g pnpm
   ```

---

## 🚀 Initial Setup (First Time Only)

### 1. Clone the Repository
Open your Terminal, Command Prompt, or PowerShell:
```bash
git clone https://github.com/Izzat-Zdin/NextHireAI.git
cd NextHireAI
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file by duplicating the provided `.env.example`:
- **Windows (PowerShell / Command Prompt):**
  ```powershell
  copy .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

> Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are populated in your `.env` file.

### 3. Install Dependencies
Run:
```bash
pnpm install
```
*(or `npm install` if not using pnpm)*

### 4. Start the Development Server
```bash
pnpm dev
```
*(or `npm run dev`)*

Open your browser at:
👉 **http://localhost:8443** (or the URL displayed in your terminal).

---

## 🔄 Daily Git Workflow (Pull & Push)

### 📥 1. Getting Latest Updates (`git pull`)
Always pull the latest changes from GitHub before starting any new work:
```bash
git pull origin main
```

> **Note:** If new packages were added by your teammates, run `pnpm install` again.

---

### 📤 2. Pushing Your Changes (`git push`)
When you are done with your edits and want to share them with the team:

1. **Check status of modified files:**
   ```bash
   git status
   ```
2. **Stage all changes:**
   ```bash
   git add .
   ```
3. **Commit changes with a descriptive message:**
   ```bash
   git commit -m "feat: describe what you changed or added"
   ```
4. **Push to GitHub:**
   ```bash
   git push origin main
   ```

---

## 🌿 Working with Feature Branches (Recommended for Teams)

To prevent merge conflicts when collaborating:

1. **Create and switch to a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes, commit, and push the branch:**
   ```bash
   git add .
   git commit -m "feat: added new feature"
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request (PR) on GitHub to merge into `main`.

---

## 🛠️ Additional Commands

- **Production Build:**
  ```bash
  pnpm build
  ```
- **Preview Production Build:**
  ```bash
  pnpm preview
  ```
