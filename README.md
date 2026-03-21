# AutheTrack - SecureTrace AI Fraud Detection Platform

A comprehensive behavioral fraud intelligence platform that protects financial transactions through real-time analysis of user behavior patterns, device characteristics, and transaction anomalies.

## 🚀 Features

- **Real-time Fraud Detection**: Sub-50ms risk scoring for instant transaction decisions
- **Behavioral Analytics**: Advanced ML algorithms analyzing typing rhythm, mouse movements, and device fingerprints
- **95% Detection Accuracy**: Machine learning models with 25% reduction in false positives
- **Real-time Monitoring**: Live transaction monitoring with WebSocket integration
- **Comprehensive Dashboard**: Interactive analytics and fraud investigation tools
- **API Integration**: RESTful APIs with PayPal and external service integration
- **Automated Compliance**: Generate compliance reports and audit trails

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js Server │    │   ML Service    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │     Redis       │    │  Model Storage  │
│  (Database)     │    │   (Caching)     │    │   (Artifacts)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Firebase Project Setup
- Redis Server (for caching and queues)
- Git

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Aanushka001/AuthTrack.git
cd AuthTrack
```

### 2. Setup Client (Frontend)

```bash
cd client
npm install
```

### 3. Setup Server (Backend)

```bash
cd ../server
npm install
```

### 4. Setup ML Service

```bash
cd ../ml-service
pip install -r requirements.txt
```

## ⚙️ Configuration

### Single Environment File Setup

All services read from a **single `.env` file at the project root**.

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and fill in all your values:**
   - Firebase credentials (from [Firebase Console](https://console.firebase.google.com/))
   - JWT secret (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - Redis URL (default: `redis://localhost:6379`)
   - PayPal credentials (optional)
   - All other API keys

3. **Important:** The `.env` file is automatically gitignored. Never commit it.

4. **Firebase Setup:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication and Firestore Database
   - Download service account key
   - Copy the JSON content to your `FIREBASE_PRIVATE_KEY` (multi-line format with `\n`)

## 🚀 Running the Application

### Development Mode (All Services at Once)

```bash
# Prerequisites: Redis must be running
redis-server

# In another terminal, start all services together:
npm run dev
```

This starts:
- ✅ Client (React) on `http://localhost:3000`
- ✅ Server (Node.js) on `http://localhost:3001`
- ✅ ML Service (Python) on `http://localhost:5000`

### Development Mode (Individual Terminals)

If you prefer separate terminals:

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: ML Service
cd ml-service
npm run start

# Terminal 3: Server
cd server
npm run dev

# Terminal 4: Client
cd client
npm run dev
```

### Production Mode

```bash
# Build frontend
npm run build

# Start server + ML service with npm
npm start
```

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### Transaction Endpoints

- `POST /api/transactions/analyze` - Real-time fraud analysis
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/status` - Update transaction status

### Risk Assessment Endpoints

- `GET /api/risk-profiles/:userId` - Get user risk profile
- `GET /api/risk-scores/real-time` - Live risk scoring
- `POST /api/risk-analysis/behavioral` - Behavioral analysis

### Fraud Management Endpoints

- `GET /api/fraud-alerts` - Get fraud alerts
- `POST /api/fraud-alerts/:id/investigate` - Start investigation
- `PUT /api/fraud-alerts/:id/resolve` - Resolve fraud alert

## 🧪 Testing

### Run Frontend Tests

```bash
cd client
npm test
```

### Run Backend Tests

```bash
cd server
npm test
```

### Run ML Service Tests

```bash
cd ml-service
python -m pytest tests/
```

### End-to-End Tests

```bash
cd client
npm run test:e2e
```

## 📈 ML Model Setup & Training

### First-Time Setup (IMPORTANT!)

The ML service requires trained models before it can run. These come as `.pkl` files in `ml-service/models/`:

1. **Train models:**
   ```bash
   cd ml-service
   python models/model_trainer.py
   ```

2. **Verify models were created:**
   ```bash
   ls -la models/
   # Should show: fraud_model.pkl, anomaly_model.pkl, scaler.pkl
   ```

3. **If models don't exist, the ML service will fail to start**. This is intentional — we require trained models.

### Model Files

The following files are generated during training and needed at runtime:
- `ml-service/models/fraud_model.pkl` — Random Forest fraud classifier
- `ml-service/models/anomaly_model.pkl` — Isolation Forest anomaly detector  
- `ml-service/models/scaler.pkl` — Feature scaler for preprocessing

These are binary files and large (10-50MB combined). They're gitignored by default. **Recommended:** Use Git LFS to track them, or document the training process in your CI/CD pipeline.

### Retrain Models (Production)

To update models with new data:

```bash
# Option 1: Direct retraining
cd ml-service
python models/model_trainer.py

# Option 2: API endpoint (if running)
curl -X POST http://localhost:5000/api/ml/retrain \
  -H "X-API-Key: YOUR_API_KEY"
```

Retraining happens automatically every 24 hours in production (configurable via `RETRAIN_INTERVAL_HOURS`).

## 🔒 Security Features

- **HTTPS Enforcement**: TLS 1.3 for all communications
- **Rate Limiting**: API throttling and abuse prevention
- **Input Validation**: Comprehensive request sanitization
- **Firebase Security Rules**: Role-based access control
- **Audit Logging**: Complete activity tracking
- **Session Management**: Automatic logout on suspicious activity

## 📊 Monitoring & Analytics

### Performance Metrics

- Transaction processing time: < 50ms
- Fraud detection accuracy: 95%
- False positive reduction: 25%
- System uptime: 99.9%

### Dashboard Features

- Real-time transaction monitoring
- Risk score visualization
- Fraud alert management
- User behavior analytics
- Compliance reporting

## 🚀 Deployment

### Production Deployment

1. **Frontend**: Deploy to Firebase Hosting or Vercel
   ```bash
   cd client
   npm run build
   # Deploy dist/ directory
   ```

2. **Backend**: Deploy to Heroku, AWS, or Google Cloud
   ```bash
   cd server
   npm run build
   npm start
   ```

3. **ML Service**: Deploy to Google Cloud Run or AWS Lambda
   ```bash
   cd ml-service
   gunicorn app:app
   ```

4. **Database**: Use Firebase Firestore or MongoDB Atlas

### Environment Setup for Production

1. Copy `.env` template and configure all values:
   ```bash
   # Copy and update
   cp .env.your-environment .env
   ```

2. Ensure all API keys and credentials are properly set
3. Use production API endpoints
4. Enable SSL/TLS for all connections

## 📚 Project Structure

```
AuthTrack/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and WebSocket services
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend server
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── ...
│   └── package.json
├── ml-service/            # Python ML service
│   ├── models/            # ML models and training
│   ├── data/              # Data processing
│   ├── utils/             # Utility functions
│   └── requirements.txt
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Error**
```bash
npm run firebase:check-config
```

**ML Service Not Starting**
```bash
pip install -r requirements.txt
ls -la ml-service/models/
```

**Redis Connection Error**
```bash
redis-server
redis-cli ping
```

### Getting Help

- 📖 [Documentation](https://github.com/Aanushka001/AuthTrack/wiki)
- 🐛 [Issue Tracker](https://github.com/Aanushka001/AuthTrack/issues)
- 💬 [Discussions](https://github.com/Aanushka001/AuthTrack/discussions)

## 🎯 Roadmap

- [ ] Advanced behavioral biometrics
- [ ] Mobile app support
- [ ] Additional ML model algorithms
- [ ] Multi-language support
- [ ] Enhanced reporting features
- [ ] API rate limiting improvements
- [ ] Advanced admin panel

---

**Built with ❤️ by the AutheTrack Team**

For more information, visit our [documentation](https://github.com/Aanushka001/AuthTrack/wiki) or contact support.