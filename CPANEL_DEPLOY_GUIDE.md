# cPanel Quick Deployment Guide

## 1. Export to GitHub from AI Studio
1. Click the top-right Settings icon (⚙️) or `...` menu in AI Studio.
2. Select **"Export to GitHub"** and choose/create your repository.

---

## 2. Setup Git in cPanel (Only 1 time)
1. Log into your **cPanel**.
2. Go to **Git™ Version Control**.
3. Click **Create**:
   - **Clone URL**: Paste your GitHub repo URL (e.g., `https://github.com/username/dating-app.git`)
   - **Repository Path**: Your desired directory (e.g., `dating-app` or `public_html`)
   - **Repository Name**: `dating-app`
4. Click **Create**.

---

## 3. Setup Node.js in cPanel
1. In cPanel, open **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: Choose 18.x, 20.x or higher
   - **Application root**: Select your project directory (where Git cloned)
   - **Application startup file**: `dist/server.cjs`
3. Click **Create**.
4. In the Application detail page, click **Run NPM Install** and run `npm run build` (or run it via Terminal).

---

## 4. How to Update Anytime (Without downloading ZIP)
Whenever you make changes in AI Studio:
1. Export/Push changes to GitHub.
2. In cPanel **Git™ Version Control** -> click **Manage** on your repo -> click **"Update from Remote"** (Pull) and **"Deploy HEAD Commit"**.
3. In **Setup Node.js App** -> click **"Restart"**.

Your website will be live with the latest changes in seconds!
