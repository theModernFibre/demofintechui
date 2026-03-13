# Hosting This Project (Including Vercel)

## Important: Two Parts

- **Frontend (React)** → Can be hosted on **Vercel**.
- **Backend (Spring Boot)** → **Cannot** run on Vercel. You must host it elsewhere (Railway, Render, Fly.io, etc.).

---

## Part 1: Deploy the Frontend to Vercel

### Option A: Deploy via Vercel website (recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   cd "design one"
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in (e.g. with GitHub).

3. **New Project** → **Import** your GitHub repository.

4. **Configure the project:**
   - **Root Directory:** Click **Edit** and set to `frontend` (so Vercel builds only the React app).
   - **Framework Preset:** Vite (should be auto-detected).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Environment variable (for production API):**
   - In Project Settings → **Environment Variables**, add:
   - **Name:** `VITE_API_URL`  
   - **Value:** Your backend URL **without** a trailing slash, e.g. `https://your-app.onrender.com`  
   - (Add this after you deploy the backend in Part 2.)

6. Click **Deploy**. Your frontend will be live at `https://your-project.vercel.app`.

### Option B: Deploy via Vercel CLI

1. Install the CLI and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```

2. From the **project root** (parent of `frontend`), link and deploy the frontend:
   ```bash
   cd frontend
   vercel
   ```
   When asked for the project root, use the current directory (frontend).

3. Set the API URL for production:
   ```bash
   vercel env add VITE_API_URL
   ```
   Enter your backend URL when prompted (e.g. `https://your-api.onrender.com`).

4. Redeploy so the env is applied:
   ```bash
   vercel --prod
   ```

### SPA routing

The repo includes a `frontend/vercel.json` that rewrites all routes to `index.html`, so direct links and refresh work for the React app.

---

## Part 2: Host the Backend (Required for the app to work)

Vercel does **not** run Java/Spring Boot. Use one of these:

| Service   | Good for              | Notes |
|----------|------------------------|--------|
| **Render** | Free tier, easy setup | Deploy as "Web Service", build: `cd backend && ./mvnw -DskipTests package`, run: `java -jar target/fintech-blockchain-*.jar`. |
| **Railway** | Simple Java deploy    | Connect repo, set root to `backend`, use Maven build + `java -jar`. |
| **Fly.io**  | Global regions        | Use a `Dockerfile` that builds and runs the Spring Boot JAR. |

### CORS

After the backend is deployed, add your Vercel frontend URL to CORS in the backend so the browser allows requests.

In **`backend/src/main/java/com/example/blockchain/config/WebConfig.java`**, add your Vercel URL to `allowedOrigins`, e.g.:

```java
.allowedOrigins(
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "https://your-project.vercel.app"   // add this
)
```

Redeploy the backend after changing CORS.

---

## Part 3: Connect frontend to backend

1. Deploy backend first and note its URL (e.g. `https://fintech-blockchain.onrender.com`).
2. In Vercel, set **Environment Variable**: `VITE_API_URL` = that URL (no trailing slash), e.g. `https://fintech-blockchain.onrender.com`.
3. Redeploy the frontend on Vercel so the new env is used.

The app uses `VITE_API_URL` only in production; locally it keeps using the Vite proxy (`/api`).

---

## Quick checklist

- [ ] Backend deployed and URL known  
- [ ] Backend CORS includes your Vercel URL  
- [ ] Frontend repo on GitHub (or connected to Vercel)  
- [ ] Vercel project **root** = `frontend`  
- [ ] `VITE_API_URL` set in Vercel to backend URL  
- [ ] Redeploy frontend after setting env  

After that, the Vercel site will load the React app and call your hosted backend API.
