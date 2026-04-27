#!/bin/bash

# Start Backend
echo "Starting NomadTracker Backend..."
cd server
node index.js &
BACKEND_PID=$!

# Start Frontend
echo "Starting NomadTracker Frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!

echo "NomadTracker is launching!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"

# Keep script running to allow killing both processes easily
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
