#!/bin/bash

# Kill any existing processes on ports 8000 (backend) and 5173 (frontend)
echo "Cleaning up ports..."
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo "Starting Backend..."
cd backend
# Run in background
uvicorn main:app --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID). Logs in backend.log"

cd ..

echo "Starting Frontend..."
cd frontend
# Run in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID). Logs in frontend.log"

echo "Services are running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop both."

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait
