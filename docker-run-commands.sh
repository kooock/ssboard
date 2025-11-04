#!/bin/bash

# Docker Run Commands for Teaching Demo
# This script contains all the commands for Phase 1 (Docker Run)
# It's meant to be executed step by step during the lecture

echo "======================================"
echo "Phase 1: Docker Run Commands"
echo "======================================"
echo ""
echo "This script is for demonstration purposes."
echo "Execute commands one by one during the lecture."
echo ""

# Step 1: Run PostgreSQL
echo "Step 1: Running PostgreSQL..."
echo "Command:"
echo "docker run -d \\"
echo "  --name postgres \\"
echo "  -e POSTGRES_DB=boarddb \\"
echo "  -e POSTGRES_USER=admin \\"
echo "  -e POSTGRES_PASSWORD=admin123 \\"
echo "  -p 5432:5432 \\"
echo "  postgres:15-alpine"
echo ""
read -p "Press Enter to execute..."
docker run -d \
  --name postgres \
  -e POSTGRES_DB=boarddb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  postgres:15-alpine

echo ""
echo "Checking PostgreSQL..."
docker ps | grep postgres
docker logs postgres | tail -10
echo ""

# Step 2: Create Docker Network
echo "Step 2: Creating Docker Network..."
echo "Command: docker network create board-network"
read -p "Press Enter to execute..."
docker network create board-network

echo ""
echo "Connecting PostgreSQL to network..."
docker network connect board-network postgres
echo ""

# Step 3: Build Backend
echo "Step 3: Building Backend..."
echo "Command: docker build -t board-backend:v1 ./backend"
read -p "Press Enter to execute..."
cd backend
docker build -t board-backend:v1 .
cd ..
echo ""

# Step 4: Run Backend
echo "Step 4: Running Backend..."
echo "Command:"
echo "docker run -d \\"
echo "  --name backend \\"
echo "  --network board-network \\"
echo "  -e DB_HOST=postgres \\"
echo "  -e DB_PORT=5432 \\"
echo "  -e DB_NAME=boarddb \\"
echo "  -e DB_USER=admin \\"
echo "  -e DB_PASSWORD=admin123 \\"
echo "  -p 8080:8080 \\"
echo "  board-backend:v1"
echo ""
read -p "Press Enter to execute..."
docker run -d \
  --name backend \
  --network board-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=boarddb \
  -e DB_USER=admin \
  -e DB_PASSWORD=admin123 \
  -p 8080:8080 \
  board-backend:v1

echo ""
echo "Waiting for backend to start..."
sleep 10
docker logs backend | tail -20
echo ""

# Step 5: Build Frontend
echo "Step 5: Building Frontend..."
echo "Command: docker build -t board-frontend:v1 ./frontend"
read -p "Press Enter to execute..."
cd frontend
docker build -t board-frontend:v1 .
cd ..
echo ""

# Step 6: Run Frontend
echo "Step 6: Running Frontend..."
echo "Command:"
echo "docker run -d \\"
echo "  --name frontend \\"
echo "  --network board-network \\"
echo "  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \\"
echo "  -p 3000:3000 \\"
echo "  board-frontend:v1"
echo ""
read -p "Press Enter to execute..."
docker run -d \
  --name frontend \
  --network board-network \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -p 3000:3000 \
  board-frontend:v1

echo ""
echo "======================================"
echo "All containers are running!"
echo "======================================"
echo ""
docker ps
echo ""
echo "Access the application:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8080/actuator/health"
echo ""
echo "View logs:"
echo "- docker logs -f backend"
echo "- docker logs -f frontend"
echo ""
echo "To clean up:"
echo "docker rm -f frontend backend postgres"
echo "docker network rm board-network"

