# Kubernetes (free/demo)

These manifests are designed for a free local cluster (kind, k3d, or minikube)
or a single-node k3s VM. They are intentionally minimal to show Kubernetes
readiness without requiring a paid managed cluster.

## Quick start (local)

1. Build and tag images locally:
   - `cloudpulse-web:dev`
   - `cloudpulse-api:dev`

2. Apply manifests:
   - `kubectl apply -f k8s/namespace.yaml`
   - `kubectl apply -f k8s/api-deployment.yaml`
   - `kubectl apply -f k8s/api-service.yaml`
   - `kubectl apply -f k8s/web-deployment.yaml`
   - `kubectl apply -f k8s/web-service.yaml`
   - `kubectl apply -f k8s/ingress.yaml`

3. Add hosts entry:
   - `127.0.0.1 cloudpulse.local`

4. Open:
   - `http://cloudpulse.local`

## Notes

- Update image tags and env vars for production.
- Use an ingress controller (nginx) for local routing.
- Set `NEXT_PUBLIC_API_BASE` to the API service URL.
