# Multi-stage build for frontend and backend

# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend & Final Image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ ./backend/

# Copy Frontend Build from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Start command
# Use shell form to allow variable expansion for PORT (default 8000)
CMD sh -c "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"
