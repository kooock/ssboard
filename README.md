# Docker & Kubernetes 강의용 게시판

Spring Boot + Next.js + PostgreSQL을 사용한 간단한 게시판 애플리케이션입니다.
Docker와 Kubernetes(k3s) 학습을 위해 제작되었습니다.

## 📋 프로젝트 구조

```
ssboard/
├── backend/              # Spring Boot 애플리케이션
│   ├── src/
│   ├── Dockerfile
│   └── build.gradle
├── frontend/             # Next.js 애플리케이션
│   ├── app/
│   ├── components/
│   ├── Dockerfile
│   └── package.json
├── k8s/                  # Kubernetes 매니페스트
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── postgres/
│   ├── backend/
│   └── frontend/
├── ansible/              # VM 자동 설정 (Ansible)
│   ├── inventory.yml
│   ├── playbook.yml
│   ├── roles/
│   ├── setup-ssh.sh
│   └── README.md
├── docker-compose.yml
└── build-and-push.sh
```

## 🎯 기능

- **사용자 관리**: 회원가입, 로그인 (JWT 인증)
- **게시글**: CRUD, 페이징, 검색
- **댓글/대댓글**: 계층형 댓글 시스템
- **조회수**: 게시글 조회수 카운트

## 🏗️ 아키텍처

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│  PostgreSQL  │
│  (Next.js)   │      │(Spring Boot) │      │              │
│   Port 3000  │      │   Port 8080  │      │   Port 5432  │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 📚 Phase 1: Docker Run으로 개별 실행

### 1.1 PostgreSQL 실행

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_DB=boarddb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  postgres:15-alpine
```

### 1.2 Docker 네트워크 생성

```bash
docker network create board-network
docker network connect board-network postgres
```

### 1.3 Backend 빌드 및 실행

```bash
cd backend
docker build -t board-backend:v1 .

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
```



### 1.4 Frontend 빌드 및 실행

```bash
cd ../frontend
docker build -t board-frontend:v1 .

docker run -d \
  --name frontend \
  --network board-network \
  -e BACKEND_URL=http://backend:8080 \
  -p 3000:3000 \
  board-frontend:v1
```

### 1.5 확인

```bash
# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs backend
docker logs frontend

# 웹 브라우저에서 접속
# http://localhost:3000
```

### 1.6 정리

```bash
docker rm -f frontend backend postgres
docker network rm board-network
```

---

## 📚 Phase 2: Docker Compose로 실행

### 2.1 Docker Compose 실행

```bash
# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
```

**✨ API 프록시 방식**
- Frontend Next.js 서버가 Backend API를 프록시합니다
- 브라우저는 `/api/*` 요청을 Frontend 서버로 보냄
- Frontend 서버가 내부 서비스 이름(`backend:8080`)으로 프록시
- 환경변수 설정 불필요, CORS 문제 없음

### 2.2 확인

```bash
# 서비스 상태 확인
docker-compose ps

# 웹 브라우저에서 접속
# http://localhost:3000
```

### 2.3 정리

```bash
# 서비스 중지 및 삭제 (볼륨은 유지)
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

### 2.4 초기 데이터 재생성

초기 데이터(admin, user1, user2)는 **데이터베이스가 비어있을 때만** 자동 생성됩니다.

**이미 데이터가 있는 경우 초기화하려면:**
```bash
# 볼륨을 포함하여 완전히 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d

# 초기 데이터 로드 확인
docker-compose logs backend | grep "Demo data loaded"

# 예상 출력:
# ===================================
# Demo data loaded successfully!
# Admin: admin / admin123
# User1: user1 / user123
# User2: user2 / user123
# ===================================
```

---

## 📚 Phase 3: Kubernetes (k3s)로 배포

### 3.1 사전 준비

#### 이미지 빌드 및 푸시

```bash
# Docker Hub에 로그인
docker login

# 이미지 빌드 및 푸시
./build-and-push.sh YOUR_DOCKERHUB_USERNAME

# 예: ./build-and-push.sh johndoe
```

#### Kubernetes 매니페스트 수정

1. `k8s/backend/deployment.yaml`: Docker Hub username 업데이트
2. `k8s/frontend/deployment.yaml`: Docker Hub username 업데이트
   - `BACKEND_URL`은 ConfigMap에서 자동으로 가져옴 (`backend-service:8080`)
3. `k8s/frontend/ingress.yaml`: 도메인 또는 IP 설정

### 3.2 배포

```bash
cd k8s

# 전체 배포
./deploy-all.sh
```

### 3.3 확인

```bash
# 모든 리소스 확인
kubectl get all -n board

# Pod 상태 확인
kubectl get pods -n board

# 서비스 확인
kubectl get svc -n board

# Ingress 확인
kubectl get ingress -n board
```

### 3.4 접속

#### Option 1: Port Forward (개발용)

```bash
# Frontend 포트 포워딩
kubectl port-forward -n board service/frontend-service 3000:3000

# Backend 포트 포워딩
kubectl port-forward -n board service/backend-service 8080:8080
```

#### Option 2: Ingress (프로덕션)

```bash
# Ingress IP 확인
kubectl get ingress -n board

# 브라우저에서 해당 IP 또는 도메인으로 접속
```

### 3.5 스케일링

```bash
# Backend 스케일 아웃
kubectl scale deployment backend --replicas=3 -n board

# 확인
kubectl get pods -n board
```

### 3.6 롤링 업데이트

```bash
# 새 이미지로 업데이트
kubectl set image deployment/backend \
  backend=YOUR_USERNAME/board-backend:v2 -n board

# 업데이트 상태 확인
kubectl rollout status deployment/backend -n board

# 롤백 (필요시)
kubectl rollout undo deployment/backend -n board
```

### 3.7 로그 확인

```bash
# Backend 로그
kubectl logs -f deployment/backend -n board

# Frontend 로그
kubectl logs -f deployment/frontend -n board

# PostgreSQL 로그
kubectl logs -f deployment/postgres -n board
```

### 3.8 정리

```bash
# 전체 삭제
./delete-all.sh
```

---

## 🤖 사전준비: VM 자동 설정 (Ansible)

20개의 VM에 Docker와 k3s를 자동으로 설치합니다.

혼자 실습할 경우는 ansible을 사용하지 않아도 됩니다.

### 4.1 사전 준비

```bash
# Ansible 설치
sudo apt install -y ansible  # Ubuntu/Debian
brew install ansible          # macOS

# SSH 키 생성
ssh-keygen -t rsa -b 4096
```

### 4.2 설정

1. **Inventory 수정**: `ansible/inventory.yml`에 실제 VM IP 주소 입력
2. **변수 설정**: `ansible/group_vars/all.yml`에서 Docker Hub username 등 수정
3. **SSH 키 배포**:

```bash
cd ansible
chmod +x setup-ssh.sh
./setup-ssh.sh
```

### 4.3 실행

```bash
cd ansible

# 연결 테스트
ansible all -i inventory.yml -m ping

# 플레이북 실행
chmod +x run.sh
./run.sh
```

또는 직접 실행:

```bash
ansible-playbook -i inventory.yml playbook.yml --ask-become-pass
```

### 4.4 검증

```bash
# Docker 버전 확인
ansible all -i inventory.yml -a "docker --version"

# k3s 노드 확인
ansible all -i inventory.yml -a "kubectl get nodes" --become

# 특정 VM SSH 접속
ssh ubuntu@192.168.1.101
kubectl get nodes
```

### 4.5 커스터마이징

`ansible/group_vars/all.yml`:

```yaml
# Docker 버전
docker_version: "latest"

# k3s 버전
k3s_version: "latest"

# 프로젝트 저장소
project_repo: "https://github.com/YOUR_USERNAME/ssboard.git"
```

### 4.6 특정 호스트만 설정

```bash
# 단일 호스트
ansible-playbook -i inventory.yml playbook.yml --limit vm-01

# 여러 호스트
ansible-playbook -i inventory.yml playbook.yml --limit vm-01,vm-02,vm-03
```

### 4.7 자세한 가이드

전체 가이드는 [ansible/README.md](ansible/README.md)를 참조하세요.

---

## 🧪 테스트 계정

초기 데이터로 다음 계정들이 **데이터베이스가 비어있을 때** 자동 생성됩니다:

- **Admin**: `admin` / `admin123`
- **User1**: `user1` / `user123`
- **User2**: `user2` / `user123`

**주의**: 초기 데이터는 `userRepository.count() == 0`일 때만 생성됩니다. 
데이터를 초기화하려면 `docker-compose down -v`로 볼륨을 삭제하세요.

---

## ⚙️ API 프록시 아키텍처

Frontend는 **Next.js rewrites를 사용하여 Backend API를 프록시**합니다. 이를 통해 CORS 문제 없이 깔끔한 아키텍처를 구현합니다.

### 작동 방식

```
브라우저 → Frontend (/api/posts)
         ↓ (Next.js rewrites)
         → Backend (http://backend:8080/api/posts)
```

1. **브라우저 요청**: 상대 경로 `/api/posts`로 요청
2. **Next.js 서버**: `next.config.js`의 rewrites 규칙에 따라 프록시
3. **Backend 호출**: 내부 서비스 이름(`backend:8080`)으로 요청

### 장점

- ✅ **CORS 문제 없음**: 같은 origin (same-origin)
- ✅ **내부 DNS 사용**: VM IP 설정 불필요
- ✅ **보안 강화**: Backend를 외부에 직접 노출하지 않음
- ✅ **간편한 설정**: 환경변수 최소화

### 설정 파일

**next.config.js**:
```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ];
}
```

**docker-compose.yml**:
```yaml
environment:
  BACKEND_URL: http://backend:8080  # 내부 서비스 이름
```

**k8s/configmap.yaml**:
```yaml
BACKEND_URL: "http://backend-service:8080"  # k8s 서비스 이름
```

### 테스트

```bash
# 브라우저에서 프록시 테스트
# F12 → Console 탭
fetch('/api/posts').then(r => r.json()).then(console.log)

# 또는 curl로 Frontend를 통한 API 호출
curl http://localhost:3000/api/posts
```

---

## 🔧 트러블슈팅

### Backend가 시작되지 않는 경우

```bash
# 로그 확인
docker logs backend
# 또는
kubectl logs deployment/backend -n board

# DB 연결 확인
docker exec -it postgres psql -U admin -d boarddb
# 또는
kubectl exec -it deployment/postgres -n board -- psql -U admin -d boarddb
```

### Frontend에서 API 호출 실패

```bash
# Backend가 실행 중인지 확인
curl http://localhost:8080/actuator/health

# 네트워크 확인 (Docker Compose)
docker-compose exec frontend ping backend

# 환경변수 확인
docker inspect frontend | grep API_URL

# Runtime Config API 확인
curl http://localhost:3000/api/config
```

### Kubernetes Pod가 시작되지 않는 경우

```bash
# Pod 상세 정보 확인
kubectl describe pod <pod-name> -n board

# 이벤트 확인
kubectl get events -n board --sort-by='.lastTimestamp'

# 이미지 Pull 문제 확인
kubectl get pods -n board -o jsonpath='{.items[*].status.containerStatuses[*].state}'
```

---

## 📖 추가 학습 자료

### Docker 관련

- Docker 네트워크: `docker network ls`
- Docker 볼륨: `docker volume ls`
- Docker 이미지 크기 최적화: 멀티스테이지 빌드 활용

### Kubernetes 관련

- ConfigMap과 Secret 활용
- PersistentVolume과 PersistentVolumeClaim
- Horizontal Pod Autoscaler (HPA)
- Monitoring: Prometheus, Grafana

---

## 📝 비교표

| 특징          | docker run  | docker-compose  | kubernetes |
| ------------- | ----------- | --------------- | ---------- |
| 설정 복잡도   | 높음        | 중간            | 높음       |
| 관리 편의성   | 낮음        | 높음            | 매우 높음  |
| 프로덕션 준비 | 아니오      | 제한적          | 예         |
| 스케일링      | 수동        | 제한적          | 자동       |
| 자동 복구     | 없음        | 제한적 (재시작) | 강력       |
| 로드밸런싱    | 수동        | 없음            | 자동       |
| 롤링 업데이트 | 불가능      | 제한적          | 강력       |
| 사용 사례     | 개발/테스트 | 개발/소규모     | 프로덕션   |

---

## 🎓 강의 진행 순서

1. **소개 (5분)**: 프로젝트 구조 및 아키텍처 설명
2. **Docker Run (20분)**: 개별 컨테이너 실행 및 네트워크 문제 해결
3. **Docker Compose (20분)**: 선언적 설정 및 서비스 오케스트레이션
4. **Kubernetes (25분)**: 프로덕션 환경 배포 및 관리
5. **정리 및 Q&A (5분)**

---

## 📄 라이선스

This project is created for educational purposes.

---

## 👥 문의

강의 관련 문의사항은 이슈로 남겨주세요.
