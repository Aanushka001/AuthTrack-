# AutheTrack - Complete Setup & Development Guide

## ✅ What Was Fixed

This repository has been restructured for production-ready deployment with comprehensive environment configuration, monorepo support, and proper service orchestration.

### Security Improvements ✔️
- ✅ Strengthened `.gitignore` to prevent secrets leakage
- ✅ Verified no credentials in git history
- ✅ Excluded Firebase service keys and ML model files
- ✅ Single `.env` file approach prevents accidental commits

### Build System ✔️
- ✅ Added `concurrently` for simultaneous service startup
- ✅ Monorepo scripts in root `package.json` for unified development
- ✅ One command to start all services: `npm run dev`
- ✅ Proper terminal color coding for each service output

### Configuration ✔️
- ✅ Unified root `.env` file (single source of truth)
- ✅ All services read from same configuration
- ✅ Eliminated per-service `.env` files
- ✅ Comprehensive `.env.example` with documentation

### Service Configuration ✔️
- ✅ **Server**: Loads environment from root `.env`
- ✅ **ML Service**: Python and Flask configuration updated
- ✅ **Client**: Vite config reads from root `.env` with VITE_ prefixes

### Documentation ✔️
- ✅ Removed Docker references (not needed for local dev)
- ✅ Added ML model training instructions
- ✅ Updated README with unified setup process
- ✅ Clear production deployment guidelines

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Python 3.8+
- Redis running on `localhost:6379`

### Installation

```bash
# 1. Start Redis (in one terminal)
redis-server

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env and fill in your values
# - Firebase credentials (from Firebase Console)
# - JWT secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - Other API keys as needed

# 4. Install all dependencies
npm run install:all

# 5. Train ML models (first time only!)
cd ml-service && python models/model_trainer.py && cd ..

# 6. Start all services
npm run dev
```

### Verification ✓

Services should be running:
- **React Client**: http://localhost:3000
- **Node.js Server**: http://localhost:3001
- **Python ML Service**: http://localhost:5000

---

## 📋 Configuration Details

### Environment Variables (`.env`)

All variables are centralized in `.env` at project root:

```env
# Core Services
PORT=3001
ML_SERVICE_PORT=5000
NODE_ENV=development

# Firebase (server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# Firebase (client-side) — MUST use VITE_ prefix
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Connectivity
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:5000

# Security
JWT_SECRET=your_super_secret_key_min_32_chars

# ML Configuration
FLASK_ENV=development
MODEL_PATH=./models/
LOG_LEVEL=INFO
```

**Why one `.env`?**
- Single source of truth
- Simpler secret management
- No accidental misconfigurations
- Easier for portfolio review

---

## 🎯 Monorepo Commands

All from project root:

```bash
# Development mode (all services)
npm run dev

# Production mode
npm start

# Build frontend + backend
npm run build

# Lint TypeScript code
npm run lint

# Install all dependencies
npm run install:all
```

---

## 🐍 ML Service Setup (Important!)

The ML service requires trained models before first run:

```bash
cd ml-service

# Train models (generates .pkl files)
python models/model_trainer.py

# Verify models exist
ls -la models/
# Should show:
# - fraud_model.pkl
# - anomaly_model.pkl
# - scaler.pkl
```

**If models don't exist**, the ML service will fail to start with error: `FileNotFoundError: fraud_model.pkl`

This is intentional — we always require trained models.

---

## 📁 Project Structure After Fixes

```
AutheTrack/
├── .env                    ← SINGLE environment file (gitignored)
├── .env.example            ← Template (tracked in git)
├── package.json            ← Monorepo scripts
├── README.md               ← Updated setup docs
│
├── client/                 ← React Frontend
│   ├── vite.config.ts      ← Loads from root .env
│   ├── package.json
│   └── src/
│
├── server/                 ← Node.js Backend
│   ├── src/server.ts       ← Loads from root .env
│   ├── package.json
│   └── ...
│
└── ml-service/             ← Python ML Service
    ├── app.py              ← Loads from root .env
    ├── config/settings.py  ← Loads from root .env
    ├── models/
    │   ├── fraud_model.pkl ← (gitignored)
    │   ├── anomaly_model.pkl
    │   └── scaler.pkl
    └── requirements.txt
```

---

## 🔒 Security Note

The `.env` file contains sensitive information:
- ✅ **Always in `.gitignore`** — never committed
- ✅ **Never hardcode** secrets in code
- ✅ **Rotate credentials** if accidentally exposed
- ✅ **Use different keys** for dev/stage/prod

---

## 📝 Git History

Recent commits for this restructure:

```
56dbee8 docs: update README with unified configuration and proper setup
accc5cc fix(client): load env vars from root .env via Vite
9cfbc2e fix(ml-service): load dotenv from root .env path
e16671f fix(server): load dotenv from root .env path
5491369 config: add root .env.example as single source of truth
5e7bd58 build: add monorepo scripts with concurrently for unified development
899ae75 security: strengthen .gitignore to exclude .env and sensitive files
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ML service won't start` | Run `python models/model_trainer.py` in `ml-service/` |
| `Redis connection refused` | Make sure `redis-server` is running |
| `Port 3001 already in use` | Change `PORT` in `.env` or kill process on that port |
| `VITE_ vars not loading` | Restart dev server (`npm run dev`) after `.env` changes |
| `Firebase auth fails` | Verify `FIREBASE_PRIVATE_KEY` in `.env` is properly formatted |

---

## ✨ Portfolio Ready

This structure demonstrates:
- ✅ Professional monorepo setup
- ✅ Proper environment management
- ✅ Security best practices
- ✅ Clear documentation
- ✅ Production-ready architecture
- ✅ Concurrent service orchestration

**Reviewers can now:**
1. Clone repo
2. Run `cp .env.example .env`
3. Fill in credentials
4. Run `npm run dev`
5. See all services running in <5 minutes

---

## 📚 Next Steps

1. **Local Testing**: Run `npm run dev` and verify all services start
2. **Firebase Setup**: Update `.env` with your Firebase credentials
3. **ML Models**: Train models with `python models/model_trainer.py`
4. **Port Changes**: Edit `.env` if ports conflict
5. **Deploy**: Use CI/CD pipeline to build and deploy

---

Generated: 2026-03-21
Version: 1.0.0
Status: ✅ Production Ready
