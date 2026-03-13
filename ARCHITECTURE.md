# NovaChain Fintech Blockchain – Architecture & File Reference

This document describes the **entire architecture**, **technical tools**, and **every project file** (excluding `node_modules` and `target`).

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (User)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP (e.g. http://localhost:5173)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)          │  Port: 5173 (or 5174, 5175)             │
│  • index.html → main.jsx → App.jsx │  • SPA: single-page dashboard           │
│  • Tailwind CSS (index.css)        │  • Proxy: /api → http://localhost:8080  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ /api/dashboard/* (proxied by Vite)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (Spring Boot)             │  Port: 8080                             │
│  • REST: /api/dashboard/summary    │  • JSON over HTTP                      │
│  • REST: /api/dashboard/transactions│  • CORS allowed for frontend origins   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ JPA / JDBC
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATABASE (H2 in-memory)            │  jdbc:h2:mem:fintechdb                │
│  • user_accounts                    │  • create-drop on startup             │
│  • transactions                     │  • H2 Console: /h2-console            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data flow (summary):**

1. User opens the React app (Vite dev server).
2. `App.jsx` calls `GET /api/dashboard/summary` and `GET /api/dashboard/transactions` (relative URLs).
3. Vite proxy forwards `/api/*` to `http://localhost:8080/api/*`.
4. Spring Boot controllers call `DashboardService`, which uses JPA repositories to read/write H2.
5. JSON responses are sent back; React updates state and renders the dashboard.

---

## 2. Technical Tools – Descriptions & Functionality

| Tool | Type | Description | Role in This Project |
|------|------|-------------|------------------------|
| **Java 17** | Language / Runtime | LTS Java with records, pattern matching, etc. | Backend is written in Java 17; compiler plugin enforces it. |
| **Maven** | Build / Dependency | Build automation and dependency management for Java. | Builds backend, runs tests, packages JAR; wrapper (`mvnw`) used so Maven need not be installed globally. |
| **Spring Boot 3.3.4** | Framework | Opinionated framework on top of Spring (auto-config, embedded server). | Runs the backend app, configures web, JPA, validation, and H2. |
| **Spring Web** | Library | MVC and REST support (controllers, `@RestController`, HTTP message conversion). | Exposes REST endpoints and returns JSON. |
| **Spring Data JPA** | Library | Abstraction over JPA; repository interfaces with method names → queries. | `UserAccountRepository`, `TransactionRecordRepository` implement persistence without SQL. |
| **Hibernate** | ORM (via JPA) | JPA implementation: entities → tables, object/relational mapping. | Generates schema (create-drop), runs queries, manages entities. |
| **H2** | Database | Lightweight, embeddable JDBC DB; in-memory or file. | In-memory store for demo user and transactions; H2 Console available. |
| **Lombok** | Library | Compile-time code generation (getters, setters, constructors, etc.). | Reduces boilerplate in entities (e.g. `@Getter`, `@Setter`). |
| **Bean Validation** | Library (Jakarta) | Declarative validation with annotations. | Available for request validation (not heavily used in current endpoints). |
| **React 19** | Library | UI library: components, state, and declarative rendering. | Frontend is a React SPA; `App.jsx` holds dashboard UI and state. |
| **Vite 8** | Build / Dev Server | Fast dev server and production bundler (ESM, HMR). | Serves the React app in dev and proxies `/api` to the backend. |
| **Tailwind CSS 4** | CSS Framework | Utility-first CSS (classes like `bg-slate-900`, `rounded-xl`). | Styles the dashboard (layout, colors, spacing, hover). |
| **PostCSS** | CSS Processor | Transforms CSS with plugins. | Runs `@tailwindcss/postcss` so Tailwind can process `index.css`. |
| **ESLint** | Linter | Finds JS/React issues and enforces style. | `npm run lint`; config via ESLint flat config. |
| **Node.js / npm** | Runtime / Package manager | Runs JS and installs frontend dependencies. | Used to run Vite, Tailwind, and React tooling. |

---

## 3. Backend – Every File

### 3.1 Build & config (project root)

| File | Purpose |
|------|--------|
| **`pom.xml`** | Maven project definition: `groupId`/`artifactId`/version, Java 17, Spring Boot 3.3.4; dependencies (web, data-jpa, validation, h2, lombok, test); `maven-compiler-plugin` (source/target/release 17); `spring-boot-maven-plugin` for runnable JAR. |
| **`mvnw`** | Maven Wrapper script (Unix); downloads Maven if needed so you can run `./mvnw` without installing Maven. |
| **`mvnw.cmd`** | Maven Wrapper script for Windows. |
| **`.mvn/wrapper/maven-wrapper.properties`** | Wrapper config: Maven distribution URL and wrapper JAR URL. |
| **`.mvn/wrapper/maven-wrapper.jar`** | Wrapper JAR used by the scripts to bootstrap Maven. |

### 3.2 Application entry & config

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/FintechBlockchainApplication.java`** | Spring Boot entry point. `@SpringBootApplication` enables component scan and auto-config; `main()` starts the app. |
| **`src/main/resources/application.yml`** | App config: app name; H2 datasource (in-memory URL, driver, user); JPA/Hibernate (create-drop, H2 dialect, format_sql, show_sql); H2 console on; server port 8080. |

### 3.3 Config (cross-cutting)

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/config/WebConfig.java`** | Implements `WebMvcConfigurer`. Adds CORS for `/api/**`: allowed origins (localhost 5173–5175, 3000), methods GET/POST/PUT/DELETE/OPTIONS. |
| **`src/main/java/com/example/blockchain/config/GlobalExceptionHandler.java`** | `@RestControllerAdvice`. Catches any `Exception`, returns 500 and a JSON body `{ "error": "Server error", "message": "<exception message>" }` so the frontend can show the backend error. |

### 3.4 Domain model

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/dashboard/model/UserAccount.java`** | JPA entity `user_accounts`: id, username, fiatBalance, cryptoBalance (BigDecimal). Lombok `@Getter`/`@Setter`/`@NoArgsConstructor`. |
| **`src/main/java/com/example/blockchain/dashboard/model/TransactionType.java`** | Enum: DEPOSIT, WITHDRAWAL, BUY, SELL, TRANSFER. Used for transaction type. |
| **`src/main/java/com/example/blockchain/dashboard/model/TransactionRecord.java`** | JPA entity `transactions`: id, txHash, assetSymbol, amount, fiatValue, type (enum, stored as varchar(20)), timestamp (Instant), status, blockHeight, blockHash. Lombok getters/setters. |

### 3.5 Persistence (repositories)

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/dashboard/repository/UserAccountRepository.java`** | Extends `JpaRepository<UserAccount, Long>`. Method `List<UserAccount> findByUsername(String username)` for lookup (handles multiple rows). |
| **`src/main/java/com/example/blockchain/dashboard/repository/TransactionRecordRepository.java`** | Extends `JpaRepository<TransactionRecord, Long>`. Used for `findAll()` and saving demo transactions. |

### 3.6 API contract (DTO)

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/dashboard/dto/DashboardSummaryDto.java`** | Java record for summary API: username, fiatBalance, cryptoBalance, portfolioValue, dailyPnl, totalVolume24h, topAssets (List<String>). Serialized to JSON by Jackson. |

### 3.7 Business logic (service)

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/dashboard/service/DashboardService.java`** | Core service. `ensureDemoData()`: in a new transaction, if no "demo-user" exists, creates one user and 20 demo transactions (synchronized + REQUIRES_NEW to avoid duplicates). `getSummaryForDemoUser()`: ensures demo data, finds first "demo-user", loads transactions, computes portfolio value, 24h volume, top assets, returns `DashboardSummaryDto`. `getRecentTransactions()`: returns up to 50 transactions sorted by timestamp descending. Null-safe for timestamps and amounts. |

### 3.8 REST API (controller)

| File | Purpose |
|------|--------|
| **`src/main/java/com/example/blockchain/dashboard/controller/DashboardController.java`** | `@RestController` at `/api/dashboard`. `GET /summary` → `DashboardSummaryDto`; `GET /transactions` → `List<TransactionRecord>`. Delegates to `DashboardService`. |

---

## 4. Frontend – Every File (source & config only)

### 4.1 HTML entry

| File | Purpose |
|------|--------|
| **`index.html`** | Single HTML page: charset, viewport, title "frontend", `<div id="root">`, script `type="module"` pointing to `/src/main.jsx`. Vite serves this and injects the bundled app. |

### 4.2 JS entry & app root

| File | Purpose |
|------|--------|
| **`src/main.jsx`** | Entry: imports React, `index.css`, and `App.jsx`; `createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)`. |
| **`src/App.jsx`** | Main React app. Defines: `API_BASE = '/api/dashboard'`; nav items; `StatCard`, `TransactionsTable`, `BlockchainTimeline`; state (summary, transactions, loading, error, activeNav, copyToast, actionToast). Fetches summary + transactions on mount via `load()`; handlers: `handleCopyHash` (copy tx hash, show toast), `handleExportCsv` (download CSV), `handleNewTransfer` (toast), refresh button calls `load()`. Renders sidebar (active nav), header (Export CSV, New transfer, Refresh), loading spinner, error box, stat cards, table (with onCopyHash), top assets, timeline. Toasts for "Hash copied" and action feedback. |

### 4.3 Styles

| File | Purpose |
|------|--------|
| **`src/index.css`** | Imports Tailwind (`@import 'tailwindcss'`); body (margin, min-height, background #020617, color, font, antialiasing); `#root` min-height; button cursor/disabled; `@keyframes fadeIn` for toast. |
| **`src/App.css`** | If present: legacy or extra styles; not required for the current Tailwind-based layout. |

### 4.4 Build & tooling config

| File | Purpose |
|------|--------|
| **`package.json`** | Project name, scripts (`dev`, `build`, `lint`, `preview`), dependencies (react, react-dom), devDependencies (vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/postcss, postcss, eslint, etc.). |
| **`vite.config.js`** | Vite config: React plugin; dev server proxy: `/api` → `http://localhost:8080` with `changeOrigin: true` so the SPA talks to the backend without CORS issues in dev. |
| **`postcss.config.js`** | PostCSS config: single plugin `@tailwindcss/postcss` so Tailwind v4 processes the CSS pipeline. |
| **`tailwind.config.js`** | Tailwind: content globs `index.html`, `src/**/*.{js,jsx,ts,tsx}`; theme extend with custom colors (background, surface, primary, secondary, accent). |

---

## 5. Request/Response Examples

**GET /api/dashboard/summary**  
- Response body (conceptually): `{ "username": "demo-user", "fiatBalance": 12500.50, "cryptoBalance": 2.3456, "portfolioValue": ..., "dailyPnl": 245.33, "totalVolume24h": ..., "topAssets": ["BTC", "ETH", ...] }`.

**GET /api/dashboard/transactions**  
- Response body: array of objects with `id`, `txHash`, `assetSymbol`, `amount`, `fiatValue`, `type`, `timestamp`, `status`, `blockHeight`, `blockHash`, etc.

**On 500 error**  
- Status 500, body: `{ "error": "Server error", "message": "<exception message>" }` (from `GlobalExceptionHandler`).

---

## 6. How to Run

- **Backend:** `cd backend && ./mvnw spring-boot:run` (requires Java 17+). Listens on port 8080.
- **Frontend:** `cd frontend && npm install && npm run dev`. Opens on port 5173 (or next free port). Use the URL shown in the terminal.
- **H2 Console:** With backend running, open `http://localhost:8080/h2-console`, JDBC URL `jdbc:h2:mem:fintechdb`, user `sa`, password blank.

---

## 7. Summary Table – Files by Layer

| Layer | Location | Files |
|-------|----------|--------|
| Backend entry & config | `backend/` | `pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn/wrapper/*`, `src/main/resources/application.yml`, `FintechBlockchainApplication.java` |
| Backend config | `backend/.../config/` | `WebConfig.java`, `GlobalExceptionHandler.java` |
| Backend domain | `backend/.../dashboard/model/` | `UserAccount.java`, `TransactionType.java`, `TransactionRecord.java` |
| Backend persistence | `backend/.../dashboard/repository/` | `UserAccountRepository.java`, `TransactionRecordRepository.java` |
| Backend API & service | `backend/.../dashboard/` | `DashboardSummaryDto.java`, `DashboardService.java`, `DashboardController.java` |
| Frontend entry | `frontend/` | `index.html`, `package.json`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js` |
| Frontend app | `frontend/src/` | `main.jsx`, `App.jsx`, `index.css` (and optionally `App.css`) |

This is the full architecture and file-by-file reference for the NovaChain fintech blockchain web app.
