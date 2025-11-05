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

# 2. 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 브라우저에서 확인
# http://localhost:3000
```

**테스트 계정**: `admin` / `admin123`, `user1` / `user123`, `user2` / `user123`

**✨ API 프록시 방식**:
- Frontend Next.js 서버가 Backend API를 프록시합니다
- 환경변수 설정 불필요, CORS 문제 없음
- 초기 데이터는 데이터베이스가 비어있을 때만 생성됩니다

---

### Option 2: Kubernetes (k3s)

**⚠️ IMPORTANT**: `YOUR_DOCKERHUB_USERNAME`을 **본인의 Docker Hub 계정**으로 변경하세요!

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 태그 및 푸시
# 방법 A: 수동으로 태그 및 푸시
docker tag board-backend:v1 YOUR_DOCKERHUB_USERNAME/board-backend:latest
docker tag board-frontend:v1 YOUR_DOCKERHUB_USERNAME/board-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/board-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/board-frontend:latest

# 방법 B: 스크립트 사용 (권장)
./build-and-push.sh YOUR_DOCKERHUB_USERNAME

# 3. Kubernetes 매니페스트 수정 (필수!)
# k8s/backend/deployment.yaml 파일 열기
#   → image: YOUR_DOCKERHUB_USERNAME/board-backend:latest
# k8s/frontend/deployment.yaml 파일 열기
#   → image: YOUR_DOCKERHUB_USERNAME/board-frontend:latest

# 4. 배포
cd k8s
./deploy-all.sh

# 5. 상태 확인
kubectl get all -n board

# 6. 포트 포워딩
kubectl port-forward -n board service/frontend-service 3000:3000

# 7. 브라우저에서 확인
# http://localhost:3000
```

**참고**: Docker Hub username을 변경하지 않으면 이미지를 찾을 수 없어 Pod가 시작되지 않습니다.

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

# Frontend
docker run -d --name frontend --network board-network \
  -e BACKEND_URL=http://backend:8080 -p 3000:3000 board-frontend:v1
```

### 2단계: Docker Compose (20분)
```bash
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

### 초기 데이터가 로드되지 않음

```bash
# 볼륨을 포함하여 완전히 삭제
docker-compose down -v

# 다시 시작 (환경변수 설정 불필요)
docker-compose up -d

# 초기 데이터 로드 확인
docker-compose logs backend | grep "Demo data loaded"
```

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

