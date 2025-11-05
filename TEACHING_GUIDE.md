# Docker & Kubernetes 강의 진행 가이드

1시간 집중 실습 강의를 위한 강사 가이드입니다.

---

## 📅 강의 일정 (총 60분)

### Phase 1: Docker Run (0-20분)
- 소개 및 아키텍처 설명 (3분)
- 개별 컨테이너 실행 (15분)
- 네트워크 문제 시연 및 해결 (2분)

### Phase 2: Docker Compose (20-40분)
- Docker Compose 소개 (3분)
- 실습 및 비교 (17분)

### Phase 3: Kubernetes (40-57분)
- Kubernetes 소개 (3분)
- k3s 배포 실습 (12분)
- 스케일링 및 자가 복구 시연 (2분)

### 마무리 (57-60분)
- 비교 정리 및 Q&A (3분)

---

## 🎯 Phase 1: Docker Run (0-20분)

### 0:00-0:03 소개 (3분)

**화면 공유**: 프로젝트 구조 다이어그램

```
"오늘은 간단한 게시판을 만들면서 Docker와 Kubernetes를 배워봅니다.
Frontend(Next.js), Backend(Spring Boot), Database(PostgreSQL) 3개 컴포넌트로 구성됩니다."
```

**강조 포인트**:
- 실제 프로덕션에서 사용하는 구조
- 마이크로서비스 아키텍처의 기본

---

### 0:03-0:08 PostgreSQL 실행 (5분)

```bash
# 1. PostgreSQL 실행
docker run -d \
  --name postgres \
  -e POSTGRES_DB=boarddb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  postgres:15-alpine

# 2. 확인
docker ps
docker logs postgres
```

**설명할 내용**:
- `-d`: 백그라운드 실행
- `--name`: 컨테이너 이름 지정
- `-e`: 환경변수 설정
- `-p`: 포트 매핑
- `alpine`: 경량 이미지

**교육 포인트**:
> "컨테이너는 격리된 환경입니다. 각 컨테이너는 독립적으로 실행됩니다."

---

### 0:08-0:15 Backend 실행 및 네트워크 문제 (7분)

```bash
# 1. Backend 빌드
cd backend
docker build -t board-backend:v1 .

# 2. 잘못된 실행 (교육 목적으로 일부러 실패시킴)
docker run -d \
  --name backend \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=boarddb \
  -e DB_USER=admin \
  -e DB_PASSWORD=admin123 \
  -p 8080:8080 \
  board-backend:v1

# 3. 로그 확인 - 실패!
docker logs backend
```

**교육 포인트**:
> "localhost는 컨테이너 자신을 가리킵니다!
> 컨테이너 간 통신을 위해서는 Docker 네트워크가 필요합니다."

```bash
# 4. 해결: Docker 네트워크 생성
docker network create board-network
docker network connect board-network postgres

# 5. Backend 다시 실행
docker rm -f backend
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

# 6. 확인
docker logs -f backend
```

**강조**:
- 네트워크 내에서는 컨테이너 이름으로 통신 가능
- `postgres`가 호스트명이 됨

---

### 0:15-0:18 Frontend 실행 (3분)

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

**교육 포인트**:
> "Frontend는 Next.js rewrites를 사용하여 Backend API를 프록시합니다.
> 브라우저는 /api/posts로 요청하고, Next.js 서버가 backend:8080으로 프록시합니다.
> 이렇게 하면 CORS 문제가 없고, 내부 서비스 이름을 사용할 수 있습니다."

**브라우저 열기**: `http://localhost:3000`

**시연**:
1. 로그인 (admin / admin123)
2. 게시글 목록 확인
3. 게시글 작성

---

### 0:18-0:20 Phase 1 정리 (2분)

**강조할 문제점**:
1. 환경변수를 일일이 입력해야 함
2. 실행 순서를 수동으로 관리해야 함
3. 컨테이너가 많아지면 관리 어려움
4. 네트워크를 수동으로 생성해야 함

**전환**:
> "이런 불편함을 해결하기 위해 Docker Compose가 있습니다!"

---

## 🎯 Phase 2: Docker Compose (20-40분)

### 0:20-0:23 Docker Compose 소개 (3분)

```bash
# 기존 컨테이너 정리
docker rm -f frontend backend postgres
docker network rm board-network
```

**docker-compose.yml 파일 보여주기**:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: boarddb
      ...
    healthcheck:  # ← 여기 강조!
      ...
```

**설명할 내용**:
1. **선언적 설정**: YAML로 모든 것을 정의
2. **depends_on**: 실행 순서 제어
3. **healthcheck**: 서비스 준비 상태 확인
4. **자동 네트워크**: 네트워크 자동 생성
5. **볼륨**: 데이터 영속성

---

### 0:23-0:37 Docker Compose 실습 (14분)

```bash
# 1. 실행
docker-compose up -d

# 2. 로그 확인
docker-compose logs -f
```

**설명하면서 진행**:
- PostgreSQL이 먼저 시작되고 healthcheck 통과
- Backend가 그 다음 시작
- Frontend가 마지막에 시작

```bash
# 3. 상태 확인
docker-compose ps

# 4. 특정 서비스만 재시작
docker-compose restart backend

# 5. 스케일링 (제한적)
docker-compose up -d --scale backend=3
```

**브라우저 시연**:
- 동일하게 동작하지만 관리가 훨씬 쉬움

---

### 0:37-0:40 Phase 2 정리 (3분)

**장점**:
- 환경변수 중앙 관리
- 실행 순서 자동 제어
- 네트워크 자동 생성
- 한 명령으로 전체 관리

**한계**:
1. 단일 서버에만 배포 가능
2. 자동 스케일링 불가
3. 자가 복구 제한적
4. 로드밸런싱 없음

**전환**:
> "프로덕션 환경에서는 Kubernetes를 사용합니다!"

---

## 🎯 Phase 3: Kubernetes (40-57분)

### 0:40-0:43 Kubernetes 소개 (3분)

```bash
# Docker Compose 정리
docker-compose down
```

**설명**:
- **Kubernetes = 프로덕션급 컨테이너 오케스트레이션**
- 자동 스케일링
- 자가 복구
- 롤링 업데이트
- 로드밸런싱

**k3s 소개**:
- 경량 Kubernetes
- 클라우드 VM에서 실행
- 프로덕션 준비 완료

---

### 0:43-0:50 Kubernetes 매니페스트 설명 (7분)

**파일 구조 보여주기**:

```
k8s/
├── namespace.yaml          # 격리된 환경
├── configmap.yaml          # 설정 데이터
├── secret.yaml             # 민감 정보
├── postgres/
│   ├── pvc.yaml           # 영속 볼륨
│   ├── deployment.yaml    # Pod 관리
│   └── service.yaml       # 네트워킹
├── backend/
│   ├── deployment.yaml    # replicas: 2
│   └── service.yaml
└── frontend/
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml       # 외부 노출
```

**핵심 개념**:

1. **Namespace**: 논리적 격리
2. **ConfigMap**: 설정 분리
3. **Secret**: 패스워드 등 민감 정보
4. **PVC**: 데이터 영속성
5. **Deployment**: Pod 관리, 자가 복구
6. **Service**: 로드밸런싱
7. **Ingress**: 외부 접근

---

### 0:50-0:52 배포 (2분)

**배포 전 확인사항**:

1. Docker Hub username 업데이트
   - `k8s/backend/deployment.yaml`
   - `k8s/frontend/deployment.yaml`

2. **참고**: `k8s/configmap.yaml`의 `BACKEND_URL`
   ```yaml
   data:
     BACKEND_URL: "http://backend-service:8080"
   ```
   **강조**: "Frontend가 API를 프록시하므로 k8s 내부 서비스 이름을 사용합니다!"

**배포 실행**:

```bash
cd k8s

# 전체 배포
./deploy-all.sh
```

**스크립트가 실행되는 동안 설명**:
- Namespace 생성
- ConfigMap, Secret 생성
- PostgreSQL 배포 및 대기
- Backend 배포 및 대기
- Frontend 배포

```bash
# 상태 확인
kubectl get all -n board
```

---

### 0:52-0:55 스케일링 및 자가 복구 시연 (3분)

#### 스케일링

```bash
# Backend를 3개로 증가
kubectl scale deployment backend --replicas=3 -n board

# 확인
kubectl get pods -n board
```

**교육 포인트**:
> "자동으로 3개의 Backend Pod이 생성되고 로드밸런싱됩니다."

#### 자가 복구

```bash
# Pod 하나 삭제
kubectl delete pod <backend-pod-name> -n board

# 즉시 새 Pod 생성됨 확인
kubectl get pods -n board -w
```

**교육 포인트**:
> "Kubernetes가 desired state를 유지하기 위해 자동으로 Pod을 재생성합니다."

---

### 0:55-0:57 접속 확인 (2분)

```bash
# Port-forward로 접속
kubectl port-forward -n board service/frontend-service 3000:3000
```

**브라우저**: `http://localhost:3000`

**설명**:
- 실제 환경에서는 Ingress를 통해 도메인으로 접속
- LoadBalancer 또는 NodePort 사용 가능

---

## 🎯 마무리 (57-60분)

### 0:57-0:59 비교 정리 (2분)

**화면 공유**: 비교표

| 특징              | docker run | docker-compose | kubernetes |
|-------------------|-----------|----------------|------------|
| 설정 복잡도        | 높음      | 중간           | 높음       |
| 관리 편의성        | 낮음      | 높음           | 매우 높음  |
| 프로덕션 준비      | 아니오    | 제한적         | 예         |
| 스케일링          | 수동      | 제한적         | 자동       |
| 자동 복구         | 없음      | 제한적         | 강력       |
| 사용 사례         | 개발/테스트| 개발/소규모    | 프로덕션   |

**핵심 메시지**:
1. **개발 단계**: docker run 또는 docker-compose
2. **소규모 배포**: docker-compose
3. **프로덕션**: Kubernetes

---

### 0:59-1:00 Q&A 및 다음 학습 (1분)

**다음 학습 단계**:
1. Helm Charts - Kubernetes 패키지 관리
2. CI/CD 파이프라인 - 자동 배포
3. Monitoring - Prometheus, Grafana
4. Service Mesh - Istio

**질문 받기**

---

## 💡 강의 팁

### 사전 준비

1. **이미지 미리 빌드**:
```bash
./build-and-push.sh YOUR_USERNAME
```

2. **k3s 설치 확인**:
```bash
kubectl get nodes
```

3. **터미널 준비**:
- 2개 터미널 (명령어 실행 + 로그 확인)
- 폰트 크기 크게

4. **브라우저 탭 준비**:
- localhost:3000
- localhost:8080/actuator/health

---

### 시간 조절 전략

**시간이 부족하면**:
- Phase 3의 롤링 업데이트 생략
- 스케일링만 시연

**시간이 남으면**:
- Ingress 설정 상세 설명
- ConfigMap/Secret 실시간 업데이트 시연
- Horizontal Pod Autoscaler 소개

---

### 예상 질문 및 답변

**Q: Docker Compose와 Kubernetes 중 뭘 써야 하나요?**
> A: 개발 환경이나 소규모는 Docker Compose, 프로덕션이나 대규모는 Kubernetes를 추천합니다.

**Q: Kubernetes가 너무 복잡한데요?**
> A: 초기 학습 곡선은 있지만, 프로덕션 환경의 복잡한 요구사항을 해결해줍니다. Helm 같은 도구로 복잡성을 줄일 수 있습니다.

**Q: 로컬에서 Kubernetes를 연습하려면?**
> A: minikube, kind, Docker Desktop의 Kubernetes를 사용하면 됩니다.

**Q: StatefulSet은 언제 쓰나요?**
> A: PostgreSQL 같은 stateful 애플리케이션에서 Pod 순서와 영속성이 중요할 때 사용합니다. 이번 예제는 단일 replica라 Deployment를 사용했습니다.

---

## 🚨 트러블슈팅 가이드

### 빌드 실패

```bash
# Gradle 캐시 문제
cd backend
./gradlew clean build

# Docker 빌드 캐시 무시
docker build --no-cache -t board-backend:v1 .
```

### Backend가 DB에 연결 못함

```bash
# PostgreSQL 준비 확인
docker logs postgres
kubectl logs deployment/postgres -n board

# 네트워크 확인
docker network inspect board-network
kubectl get svc -n board
```

### Frontend에서 API 호출 실패

```bash
# 환경변수 확인 (BACKEND_URL 확인)
docker inspect frontend | grep BACKEND_URL
kubectl describe pod <frontend-pod> -n board | grep BACKEND_URL

# Frontend를 통한 API 프록시 테스트
curl http://localhost:3000/api/posts
# Frontend가 backend:8080으로 프록시

# Backend 직접 접근 테스트
curl http://localhost:8080/actuator/health
kubectl port-forward -n board service/backend-service 8080:8080
```

---

## 📸 데모 시나리오

### 추천 데모 흐름

1. **회원가입**: `testuser` / `test@example.com` / `test123`
2. **로그인**: 방금 만든 계정으로
3. **게시글 작성**: "Kubernetes는 정말 강력합니다!"
4. **댓글 작성**: "동의합니다!"
5. **대댓글 작성**: "저도요!"

**포인트**:
> "이 모든 것이 컨테이너에서 실행되고 있습니다. 
> 프로덕션 환경에서는 수십~수백 개의 Pod이 자동으로 관리됩니다."

---

좋은 강의 되세요! 🎉

