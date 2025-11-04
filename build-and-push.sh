#!/bin/bash

# Build and push Docker images to Docker Hub
# Usage: ./build-and-push.sh <dockerhub-username> [version]

set -e

# Check if Docker Hub username is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <dockerhub-username> [version]"
    echo "Example: $0 myusername v1.0.0"
    exit 1
fi

DOCKERHUB_USERNAME=$1
VERSION=${2:-latest}

echo "======================================"
echo "Building and pushing Docker images"
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo "======================================"

# Build backend
echo ""
echo "Building backend..."
cd backend
docker build -t $DOCKERHUB_USERNAME/board-backend:$VERSION .
docker tag $DOCKERHUB_USERNAME/board-backend:$VERSION $DOCKERHUB_USERNAME/board-backend:latest
cd ..

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
docker build -t $DOCKERHUB_USERNAME/board-frontend:$VERSION .
docker tag $DOCKERHUB_USERNAME/board-frontend:$VERSION $DOCKERHUB_USERNAME/board-frontend:latest
cd ..

# Push to Docker Hub
echo ""
echo "Pushing images to Docker Hub..."
echo "Please make sure you are logged in: docker login"
read -p "Press enter to continue..."

docker push $DOCKERHUB_USERNAME/board-backend:$VERSION
docker push $DOCKERHUB_USERNAME/board-backend:latest
docker push $DOCKERHUB_USERNAME/board-frontend:$VERSION
docker push $DOCKERHUB_USERNAME/board-frontend:latest

echo ""
echo "======================================"
echo "Build and push completed!"
echo "Backend: $DOCKERHUB_USERNAME/board-backend:$VERSION"
echo "Frontend: $DOCKERHUB_USERNAME/board-frontend:$VERSION"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update k8s/backend/deployment.yaml with your Docker Hub username"
echo "2. Update k8s/frontend/deployment.yaml with your Docker Hub username"
echo "3. Run: ./k8s/deploy-all.sh"

