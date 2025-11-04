#!/bin/bash

# Deploy all Kubernetes resources
# This script should be run after building and pushing Docker images

set -e

echo "======================================"
echo "Deploying Board Application to k3s"
echo "======================================"

# Create namespace
echo ""
echo "Creating namespace..."
kubectl apply -f namespace.yaml

# Create ConfigMap and Secret
echo ""
echo "Creating ConfigMap and Secret..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Deploy PostgreSQL
echo ""
echo "Deploying PostgreSQL..."
kubectl apply -f postgres/pvc.yaml
kubectl apply -f postgres/deployment.yaml
kubectl apply -f postgres/service.yaml

# Wait for PostgreSQL to be ready
echo ""
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n board --timeout=120s

# Deploy Backend
echo ""
echo "Deploying Backend..."
kubectl apply -f backend/deployment.yaml
kubectl apply -f backend/service.yaml

# Wait for Backend to be ready
echo ""
echo "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n board --timeout=180s

# Deploy Frontend
echo ""
echo "Deploying Frontend..."
kubectl apply -f frontend/deployment.yaml
kubectl apply -f frontend/service.yaml
kubectl apply -f frontend/ingress.yaml

# Wait for Frontend to be ready
echo ""
echo "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n board --timeout=120s

# Show deployment status
echo ""
echo "======================================"
echo "Deployment Status"
echo "======================================"
kubectl get all -n board

echo ""
echo "======================================"
echo "Deployment completed!"
echo "======================================"
echo ""
echo "Access the application:"
echo "- Frontend: http://<your-server-ip>:80 (via Ingress)"
echo "- Or use port-forward: kubectl port-forward -n board service/frontend-service 3000:3000"
echo "- Backend API: kubectl port-forward -n board service/backend-service 8080:8080"
echo ""
echo "View logs:"
echo "- Backend: kubectl logs -f deployment/backend -n board"
echo "- Frontend: kubectl logs -f deployment/frontend -n board"
echo "- Postgres: kubectl logs -f deployment/postgres -n board"

