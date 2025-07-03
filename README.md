<<<<<<< HEAD
# LabLens

🔬 **Professional-grade lab report analysis tool specialized for AHS lab reports**

A full-stack web application that uses OCR technology to extract and analyze lab test results from AHS PDF reports, providing patient-friendly explanations and visual indicators for each test.

## 🎯 Project Overview

This application specializes in processing Alberta Health Services (AHS) lab reports to help patients better understand their results. It processes MyHealth Records lab report PDFs and provides:

- **OCR text extraction** from lab report PDFs
- **Intelligent parsing** of test results, values, and reference ranges
- **Visual flagging** system (Normal, Borderline, Abnormal, Critical)
- **Patient-friendly explanations** for each test
- **Professional healthcare-grade UI** with accessibility features
- **Privacy-first design** - no data storage, local processing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │  Python OCR     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Processing)  │
│                 │    │                 │    │                 │
│ • File Upload   │    │ • File Handling │    │ • PDF→Image     │
│ • Results UI    │    │ • API Routes    │    │ • OCR Extract   │
│ • Visual Flags  │    │ • Validation    │    │ • Text Parsing  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lab Definitions JSON                        │
│            (Test metadata, ranges, explanations)               │
└─────────────────────────────────────────────────────────────────┘
```

## 🧱 Tech Stack

### Frontend
- **React 18** with Hooks and Context
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, healthcare-grade styling
- **Lucide React** for professional medical iconography
- **React Dropzone** for file upload with drag-and-drop
- **Axios** for API communication

### Backend
- **Node.js** with Express.js framework
- **Multer** for secure file upload handling
- **Helmet** for security headers
- **CORS** with whitelist configuration
- **Rate limiting** for API protection
- **Express Validator** for input sanitization

### OCR & Processing
- **Python 3.8+** with pytesseract
- **Tesseract OCR** engine for text extraction
- **PIL/Pillow** for image preprocessing
- **pdf2image** for PDF to image conversion

### Data Management
- **JSON-based** lab test definitions
- **File-based** processing (no database required)
- **Privacy-compliant** temporary file handling

## 📁 Project Structure

```
lablens/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── LabResults.jsx
│   │   │   ├── TestResult.jsx
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # App entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── package.json         # Client dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind configuration
│   └── postcss.config.js    # PostCSS configuration
├── server/                   # Express backend
│   ├── routes/              # API routes
│   │   ├── analysis.js      # File upload & analysis
│   │   └── health.js        # Health check endpoints
│   ├── uploads/             # Temporary file storage
│   ├── index.js             # Server entry point
│   └── package.json         # Server dependencies
├── ocr/                     # Python OCR processing
│   ├── parse.py             # Main OCR script
│   └── requirements.txt     # Python dependencies
├── data/                    # Lab test definitions
│   └── definitions.json     # Test metadata & ranges
├── package.json             # Root package.json
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js 16+** and npm
2. **Python 3.8+** and pip
3. **Tesseract OCR** (system dependency)

#### Installing Tesseract OCR

**Windows:**
```bash
# Using Chocolatey
choco install tesseract

# Or download installer from:
# https://github.com/UB-Mannheim/tesseract/wiki
```

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install tesseract-ocr
sudo apt install libtesseract-dev
```

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/lablens.git
cd lablens
```

2. **Install all dependencies:**
```bash
npm run install:all
```
This installs dependencies for the root, client, and server.

3. **Install Python dependencies:**
```bash
cd ocr
pip install -r requirements.txt
cd ..
```

4. **Verify Tesseract installation:**
```bash
tesseract --version
python -c "import pytesseract; print('OCR dependencies OK')"
```

### Development

1. **Start the development servers:**
```bash
npm run dev
```
This starts both the React client (port 3000) and Express server (port 5000).

2. **Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration  
FRONTEND_URL=http://localhost:3000

# OCR Configuration
TESSERACT_CMD=tesseract
PYTESSERACT_TIMEOUT=60

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES=1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_RATE_LIMIT_MAX=10
```

## 🧪 Testing

### API Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Test file upload:
```bash
curl -X POST -F "labReport=@test-report.pdf" http://localhost:5000/api/analyze
```

### Python OCR Testing

Test the OCR script directly:
```bash
cd ocr
python parse.py /path/to/test-report.pdf
```

## 🚀 Deployment

### Option 1: Vercel + Render (Recommended)

#### Frontend (Vercel)

1. **Connect GitHub repository to Vercel**
2. **Configure build settings:**
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm run install:all`

3. **Set environment variables:**
   ```
   VITE_API_URL=https://your-api-domain.onrender.com
   ```

#### Backend (Render)

1. **Create a new Web Service on Render**
2. **Configure build settings:**
   - Build Command: `npm install && cd server && npm install && cd ../ocr && pip install -r requirements.txt`
   - Start Command: `cd server && npm start`

3. **Set environment variables:**
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   PORT=10000
   ```

4. **Add build packs for Tesseract:**
   Add to your `render.yaml`:
   ```yaml
   services:
     - type: web
       name: lablens-api
       env: node
       buildCommand: |
         apt-get update
         apt-get install -y tesseract-ocr
         npm install
         cd server && npm install
         cd ../ocr && pip install -r requirements.txt
       startCommand: cd server && npm start
   ```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY ocr/requirements.txt ./ocr/

# Install dependencies
RUN npm run install:all
RUN cd ocr && pip3 install -r requirements.txt

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t lablens .
docker run -p 5000:5000 lablens
```

### Option 3: Traditional Server Deployment

1. **Prepare the server with dependencies:**
```bash
# Install Node.js, Python, and Tesseract
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-pip tesseract-ocr

# Clone and setup the application
git clone https://github.com/your-org/lablens.git
cd lablens
npm run install:all
cd ocr && pip3 install -r requirements.txt
cd ..
```

2. **Build for production:**
```bash
npm run build
```

3. **Configure process manager (PM2):**
```bash
npm install -g pm2
pm2 start server/index.js --name "lablens"
pm2 startup
pm2 save
```

4. **Configure reverse proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/lablens/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

## 🏥 AHS Lab Report Features

### Lab Test Panels Supported

- **CBC and Differential** (WBC, RBC, Hemoglobin, Platelets, etc.)
- **Vitamin B12** levels
- **Iron Studies** (Iron, TIBC, Ferritin, Iron Saturation)
- **Urinalysis** (Color, Clarity, pH, Glucose, Protein, etc.)
- **Lipid Panel** (HDL, LDL, Triglycerides, Total Cholesterol)
- **Liver Function** (ALT, Bilirubin, GGT)
- **Thyroid Function** (TSH, Free T4)
- **Electrolytes & Renal** (Sodium, Potassium, Creatinine, eGFR)
- **Diabetes Monitoring** (HbA1c)

### Reference Ranges

All reference ranges are based on AHS laboratory standards and include:
- Gender-specific ranges where applicable
- Age-appropriate normal values
- Canadian laboratory units (SI units)

### Privacy Compliance

- **No data storage** - files processed and immediately deleted
- **Local processing** - OCR performed on server, not external services
- **HTTPS encryption** in production
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Secure file handling** with automatic cleanup

## 🔧 Configuration

### Customizing Lab Definitions

Edit `data/definitions.json` to:
- Add new test types
- Update reference ranges
- Modify explanations
- Add new lab panels

Example test definition:
```json
{
  "hemoglobin": {
    "name": "Hemoglobin",
    "unit": "g/L",
    "referenceRange": {
      "male": { "min": 140, "max": 175 },
      "female": { "min": 120, "max": 155 }
    },
    "explanation": "Hemoglobin carries oxygen in your blood...",
    "category": "oxygen_transport"
  }
}
```

### OCR Optimization

Modify `ocr/parse.py` to improve extraction for different report formats:
- Adjust Tesseract configurations
- Add new text pattern recognition
- Improve image preprocessing

## 📊 Monitoring and Maintenance

### Health Checks

- **Basic Health**: `GET /api/health`
- **Detailed Health**: `GET /api/health/detailed`

### Logs

- Server logs: Check Express.js console output
- OCR logs: Python script outputs to stderr
- Client logs: Browser console in development

### Performance Tuning

1. **OCR Performance:**
   - Adjust image DPI (currently 300)
   - Modify page limits for large PDFs
   - Optimize Tesseract configuration

2. **Server Performance:**
   - Adjust rate limiting thresholds
   - Configure file size limits
   - Monitor memory usage

3. **Client Performance:**
   - Optimize bundle size with Vite
   - Implement lazy loading for large result sets
   - Add result caching in localStorage

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Install dependencies: `npm run install:all`
3. Make changes with tests
4. Run health checks: `curl localhost:5000/api/health`
5. Test OCR functionality with sample PDFs
6. Submit pull request with detailed description

### Code Standards

- **JavaScript**: ESLint with React rules
- **Python**: PEP 8 style guide
- **Components**: Functional components with hooks
- **API**: RESTful design with proper HTTP status codes
- **Accessibility**: WCAG 2.1 AA compliance

## 🐛 Troubleshooting

### Common Issues

1. **Tesseract not found:**
   ```bash
   # Verify installation
   tesseract --version
   
   # Check PATH
   which tesseract
   
   # Install if missing (Ubuntu)
   sudo apt-get install tesseract-ocr
   ```

2. **Python dependencies missing:**
   ```bash
   cd ocr
   pip install -r requirements.txt
   
   # Test imports
   python -c "import pytesseract, PIL, pdf2image"
   ```

3. **File upload errors:**
   - Check file size limits (10MB max)
   - Verify PDF is not password protected
   - Ensure disk space available for uploads

4. **Poor OCR accuracy:**
   - Check PDF quality (not scanned images)
   - Verify it's an AHS format report
   - Increase image DPI in OCR script

5. **CORS errors:**
   - Verify frontend URL in server environment
   - Check that both servers are running
   - Confirm port configuration

### Performance Issues

1. **Slow OCR processing:**
   - Reduce image DPI (trade accuracy for speed)
   - Limit pages processed
   - Check server resources

2. **Memory issues:**
   - Monitor Node.js heap usage
   - Implement file cleanup on errors
   - Restart services if needed

## 📋 License

MIT License - See LICENSE file for details.

## 🏥 Disclaimer

This tool is for informational purposes only and should not replace professional medical advice. Lab results should always be interpreted by qualified healthcare professionals in the context of complete medical history, symptoms, and physical examination.

---

**Built with ❤️ for AHS lab report analysis**

For technical support or questions about this implementation, please contact the LabLens development team. 
=======
mvp..
>>>>>>> d6feb35a484ee7ceee17da030a56031110d7ec4e
