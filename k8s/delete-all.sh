#!/bin/bash

# Delete all Kubernetes resources

set -e

echo "======================================"
echo "Deleting Board Application from k3s"
echo "======================================"

read -p "Are you sure you want to delete all resources in 'board' namespace? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

# Delete in reverse order
echo ""
echo "Deleting Frontend..."
kubectl delete -f frontend/ingress.yaml --ignore-not-found=true
kubectl delete -f frontend/service.yaml --ignore-not-found=true
kubectl delete -f frontend/deployment.yaml --ignore-not-found=true

echo ""
echo "Deleting Backend..."
kubectl delete -f backend/service.yaml --ignore-not-found=true
kubectl delete -f backend/deployment.yaml --ignore-not-found=true

echo ""
echo "Deleting PostgreSQL..."
kubectl delete -f postgres/service.yaml --ignore-not-found=true
kubectl delete -f postgres/deployment.yaml --ignore-not-found=true
kubectl delete -f postgres/pvc.yaml --ignore-not-found=true

echo ""
echo "Deleting ConfigMap and Secret..."
kubectl delete -f configmap.yaml --ignore-not-found=true
kubectl delete -f secret.yaml --ignore-not-found=true

echo ""
echo "Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true

echo ""
echo "======================================"
echo "All resources deleted!"
echo "======================================"

