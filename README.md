# Blood Test Analyzer

Professional-grade lab report analyzer for AHS reports with OCR capabilities.

## Prerequisites

- Node.js (>=16.0.0)
- Python 3.x
- npm or yarn

## Installation

1. Clone the repository
2. Install all dependencies:
```bash
npm run install:all
```

3. Install Python dependencies:
```bash
cd ocr
pip install -r requirements.txt
```

## Running the Project

### Development Mode
Run both client and server simultaneously:
```bash
npm run dev
```

This starts:
- Client (React/Vite) on http://localhost:5173
- Server (Express) on http://localhost:3000

### Individual Components

Run client only:
```bash
npm run client:dev
```

Run server only:
```bash
npm run server:dev
```

### Production

Build and start:
```bash
npm run build
npm start
```

## Project Structure

- `client/` - React frontend with Vite
- `server/` - Express.js backend API  
- `ocr/` - Python OCR processing scripts
- `data/` - Reference data and definitions