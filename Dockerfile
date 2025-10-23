# Use Python as base image with Node.js
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY ocr/requirements.txt ./ocr/

# Install Python dependencies
RUN pip install --no-cache-dir -r ocr/requirements.txt

# Install Node dependencies
RUN npm install --production=false
RUN cd client && npm install --production=false
RUN cd server && npm install --production=false

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start application
CMD ["npm", "start"]

