# Use Python as base image with Node.js
FROM python:3.10-slim

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY ocr/requirements.txt ./ocr/

# Install Python dependencies with no cache
RUN pip install --no-cache-dir -r ocr/requirements.txt

# Install Node dependencies
RUN npm install --production=false && \
    cd client && npm install --production=false && \
    cd ../server && npm install --production=false && \
    npm cache clean --force

# Copy application code
COPY . .

# Build frontend and remove dev dependencies
RUN npm run build && \
    cd client && npm prune --production && \
    cd ../server && npm prune --production

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    NODE_OPTIONS="--max-old-space-size=384"

# Start application
CMD ["npm", "start"]

