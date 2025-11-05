# 🚀 빠른 시작 가이드

Docker/Kubernetes 강의를 빠르게 시작하기 위한 가이드입니다.

## 📋 사전 요구사항

### 로컬 개발 환경
- Docker Desktop 설치
- Docker Compose 설치
- (선택) Minikube 또는 Docker Desktop Kubernetes 활성화

### 클라우드 VM 환경 (강의용 권장)
- k3s 설치: `curl -sfL https://get.k3s.io | sh -`
- kubectl 설치
- Docker 설치

---

## ⚡ 5분 안에 실행하기

### Option 1: Docker Compose (가장 빠름)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd ssboard

# 2. IMPORTANT: Set API_URL environment variable
# Replace YOUR_VM_IP with your actual VM IP
export API_URL=http://YOUR_VM_IP:8080

# Example:
# export API_URL=http://35.190.237.182:8080

# 3. 실행
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f

# 5. 브라우저에서 확인
# http://YOUR_VM_IP:3000
```

**테스트 계정**: `admin` / `admin123`

**⚠️ 주의**: `API_URL` 환경변수는 필수입니다. localhost 사용 시 문제가 발생할 수 있습니다.

---

### Option 2: Kubernetes (k3s)

```bash
# 1. 이미지 빌드 및 푸시
docker login
./build-and-push.sh YOUR_DOCKERHUB_USERNAME

# 2. Kubernetes 매니페스트 수정
# k8s/backend/deployment.yaml: YOUR_DOCKERHUB_USERNAME 변경
# k8s/frontend/deployment.yaml: YOUR_DOCKERHUB_USERNAME 변경

# 3. 배포
cd k8s
./deploy-all.sh

# 4. 포트 포워딩
kubectl port-forward -n board service/frontend-service 3000:3000

# 5. 브라우저에서 확인
# http://localhost:3000
```

---

## 🛠️ 강의 준비 체크리스트

### 강사용

- [ ] Docker Desktop 실행 확인
- [ ] 이미지 미리 빌드
  ```bash
  cd backend && docker build -t board-backend:v1 .
  cd ../frontend && docker build -t board-frontend:v1 .
  ```
- [ ] k3s 설치 및 확인 (클라우드 VM)
  ```bash
  kubectl get nodes
  ```
- [ ] Docker Hub 로그인
  ```bash
  docker login
  ```
- [ ] 터미널 폰트 크기 확대
- [ ] 브라우저 북마크 추가:
  - http://localhost:3000
  - http://localhost:8080/actuator/health

### 수강생용

- [ ] Docker Desktop 설치
- [ ] 프로젝트 클론
- [ ] 네트워크 환경 확인 (포트 3000, 8080 사용 가능)

---

## 📝 강의 흐름 요약

### 1단계: Docker Run (20분)
```bash
# PostgreSQL
docker run -d --name postgres -e POSTGRES_DB=boarddb ...

# Network
docker network create board-network

# Backend
docker run -d --name backend --network board-network ...

# Frontend (IMPORTANT: Set API_URL to your VM IP)
docker run -d --name frontend --network board-network \
  -e API_URL=http://YOUR_VM_IP:8080 -p 3000:3000 board-frontend:v1
```

### 2단계: Docker Compose (20분)
```bash
# IMPORTANT: Set API_URL first
export API_URL=http://YOUR_VM_IP:8080

docker-compose up -d
docker-compose ps
docker-compose logs -f
```

### 3단계: Kubernetes (20분)
```bash
cd k8s
./deploy-all.sh
kubectl get all -n board
kubectl scale deployment backend --replicas=3 -n board
```

---

## 🔧 자주 발생하는 문제

### 포트 충돌
```bash
# 사용 중인 포트 확인 (Mac/Linux)
lsof -i :3000
lsof -i :8080

# 프로세스 종료
kill -9 <PID>
```

### Docker 빌드 느림
```bash
# 빌드 시간 단축을 위해 이미지 미리 받기
docker pull postgres:15-alpine
docker pull gradle:8.5-jdk21
docker pull node:21-alpine
```

### Backend 시작 오류
```bash
# 로그 확인
docker logs backend
# 또는
kubectl logs deployment/backend -n board

# 일반적인 원인: DB 연결 실패
# 해결: PostgreSQL이 준비될 때까지 대기
```

---

## 💡 유용한 명령어

### Docker
```bash
# 모든 컨테이너 중지
docker stop $(docker ps -aq)

# 사용하지 않는 리소스 정리
docker system prune -a

# 이미지 크기 확인
docker images
```

### Kubernetes
```bash
# 전체 상태 확인
kubectl get all -n board

# Pod 로그 실시간 확인
kubectl logs -f <pod-name> -n board

# Pod 내부 접속
kubectl exec -it <pod-name> -n board -- /bin/sh

# 서비스 상세 정보
kubectl describe service backend-service -n board
```

---

## 📚 추가 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [k3s 공식 문서](https://k3s.io/)
- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [Next.js 공식 문서](https://nextjs.org/docs)

---

## 🎯 강의 후 과제

1. **환경변수 변경**: JWT_SECRET를 변경하고 재배포
2. **추가 기능**: 게시글 좋아요 기능 추가
3. **모니터링**: Prometheus + Grafana 연동
4. **CI/CD**: GitHub Actions로 자동 배포 구성

---

질문이나 문제가 있으면 이슈로 남겨주세요!

