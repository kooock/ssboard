# Docker & Kubernetes 실습 가이드 (학생용)

이 문서는 Docker와 Kubernetes를 처음 배우는 학생들을 위한 단계별 실습 가이드입니다.

---

## 📋 실습 목표

- Docker를 사용하여 컨테이너 실행하기
- Docker Compose로 멀티 컨테이너 애플리케이션 관리하기
- Kubernetes(k3s)로 프로덕션 배포 경험하기

## 🛠️ 사전 준비

### VM(가상머신) 접속하기

강의에서는 개인별로 할당된 클라우드 VM을 사용합니다.

#### 1단계: 본인의 VM IP 확인

📊 **VM 할당 시트**: [https://docs.google.com/spreadsheets/d/1ydWGvzDpUZrBfR5m_RHL-4_osuT_XSHq/edit](https://docs.google.com/spreadsheets/d/1ydWGvzDpUZrBfR5m_RHL-4_osuT_XSHq/edit?usp=drive_link&ouid=107857468499348587903&rtpof=true&sd=true)

위 링크에서 본인의 이름을 찾아 **외부 IP**를 확인하세요.

예시:
- 이름: 홍길동
- 외부 IP: `34.84.123.45`

#### 2단계: SSH 비밀키 다운로드

🔑 **SSH 비밀키**: [https://drive.google.com/file/d/1nQJmGvBWl7IyP6rG69hZhvFiXZytdp3g/view](https://drive.google.com/file/d/1nQJmGvBWl7IyP6rG69hZhvFiXZytdp3g/view?usp=drive_link)

위 링크에서 SSH 비밀키 파일을 다운로드하세요.

#### 3단계: SSH로 VM 접속

##### Mac/Linux 사용자

```bash
# 1. 다운로드한 키 파일을 홈 디렉토리로 이동
mv ~/Downloads/sshboard ~/.ssh/sshboard

# 2. 키 파일 권한 변경 (필수!)
chmod 600 ~/.ssh/sshboard

# 3. SSH 접속 (YOUR_VM_IP를 본인의 외부 IP로 변경)
ssh -i ~/.ssh/sshboard koock1994@YOUR_VM_IP

# 예시:
# ssh -i ~/.ssh/sshboard koock1994@34.84.123.45
```

**체크포인트**: 접속 성공 시 프롬프트가 `koock1994@instance-x-xx:~$` 형태로 변경됩니다.

##### Windows (PowerShell) 사용자

```powershell
# 1. SSH 디렉토리 생성 (이미 있다면 건너뛰기)
mkdir $HOME\.ssh -Force

# 2. 다운로드한 키 파일을 .ssh 폴더로 이동
Move-Item -Path "$HOME\Downloads\sshboard" -Destination "$HOME\.ssh\sshboard"

# 3. SSH 접속 (YOUR_VM_IP를 본인의 외부 IP로 변경)
ssh -i $HOME\.ssh\sshboard koock1994@YOUR_VM_IP

# 예시:
# ssh -i $HOME\.ssh\sshboard koock1994@34.84.123.45
```

**PowerShell에서 권한 에러가 발생하는 경우**:
```powershell
# 키 파일의 권한을 현재 사용자만 읽기 가능하도록 설정
icacls "$HOME\.ssh\sshboard" /inheritance:r
icacls "$HOME\.ssh\sshboard" /grant:r "$($env:USERNAME):(R)"
```

**체크포인트**: 접속 성공 시 프롬프트가 `koock1994@instance-x-xx:~$` 형태로 변경됩니다.

#### SSH 접속 문제 해결

**문제 1: "Permission denied (publickey)"**
- 키 파일 권한 확인: `chmod 600 ~/.ssh/sshboard`
- 키 파일 경로가 올바른지 확인
- 키 파일 이름이 `sshboard`인지 확인

**문제 2: "Connection refused"**
- VM IP가 올바른지 재확인
- VM이 실행 중인지 확인 (강사에게 문의)

**문제 3: "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!"**
```bash
# known_hosts에서 해당 IP 제거
ssh-keygen -R YOUR_VM_IP
```

---

### 필수 설치 (VM에 이미 설치되어 있음)
- [x] Docker & Docker Compose
- [x] k3s (Kubernetes)
- [x] kubectl
- [x] Git

### Docker Hub 계정
- [ ] https://hub.docker.com 에서 무료 계정 생성
- [ ] VM에서 `docker login` 실행

---

## 🚀 Phase 1: Docker Run으로 시작하기 (20분)

### 목표
개별 컨테이너를 실행하고 컨테이너 간 네트워킹을 이해합니다.

### Step 1: VM 접속 및 프로젝트 클론

```bash
# 1. SSH로 VM 접속 (YOUR_VM_IP를 본인의 IP로 변경)
ssh -i ~/.ssh/sshboard koock1994@YOUR_VM_IP

# Windows PowerShell 사용자는:
# ssh -i $HOME\.ssh\sshboard koock1994@YOUR_VM_IP

# 2. 프로젝트 다운로드
git clone https://github.com/kooock/ssboard.git
cd ssboard

# 3. 프로젝트 구조 확인
ls -la
```

**체크포인트**: `backend/`, `frontend/`, `k8s/`, `docker-compose.yml` 폴더가 보여야 합니다.

**참고**: 앞으로 모든 명령어는 **VM에서 실행**합니다!

---

### Step 2: PostgreSQL 데이터베이스 실행

```bash
# PostgreSQL 컨테이너 실행
docker run -d \
  --name postgres \
  -e POSTGRES_DB=boarddb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  postgres:15-alpine

# 실행 확인
docker ps
```

**명령어 설명**:
- `-d`: 백그라운드에서 실행
- `--name postgres`: 컨테이너 이름 지정
- `-e`: 환경변수 설정 (데이터베이스 이름, 사용자명, 비밀번호)
- `-p 5432:5432`: 포트 매핑 (호스트:컨테이너)
- `postgres:15-alpine`: 사용할 이미지

**체크포인트**: `docker ps`에서 postgres 컨테이너가 `Up` 상태로 표시되어야 합니다.

**로그 확인**:
```bash
docker logs postgres
```

---

### Step 3: Backend 빌드 및 실행

#### 3-1. Backend 이미지 빌드

```bash
cd backend
docker build -t board-backend:v1 .
```

**설명**: Dockerfile을 읽어서 Spring Boot 애플리케이션을 컨테이너 이미지로 만듭니다.

**체크포인트**: `Successfully tagged board-backend:v1` 메시지가 보여야 합니다.

#### 3-2. 네트워크 문제 경험하기 (실패 예제)

```bash
# 잘못된 실행 - localhost로 DB 연결 시도
docker run -d \
  --name backend \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=boarddb \
  -e DB_USER=admin \
  -e DB_PASSWORD=admin123 \
  -p 8080:8080 \
  board-backend:v1

# 로그 확인 - 에러 발생!
docker logs backend
```

**❌ 무엇이 문제일까요?**
- `localhost`는 **컨테이너 자신**을 가리킵니다
- postgres 컨테이너와 backend 컨테이너는 격리되어 있습니다
- 컨테이너 간 통신을 위해서는 **Docker 네트워크**가 필요합니다!

#### 3-3. Docker 네트워크로 문제 해결

```bash
# 실패한 컨테이너 제거
docker rm -f backend

# Docker 네트워크 생성
docker network create board-network

# postgres를 네트워크에 연결
docker network connect board-network postgres

# Backend를 네트워크에 포함하여 다시 실행
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

# 로그 확인 - 성공!
docker logs -f backend
```

**✅ 핵심 개념**:
- 같은 Docker 네트워크 내에서는 **컨테이너 이름**으로 통신 가능
- `DB_HOST=postgres`: postgres는 컨테이너 이름

**체크포인트**: 
- 로그에 `Started BoardApplication` 메시지가 보여야 합니다
- 헬스체크 확인:
  ```bash
  # VM 내부에서
  curl http://localhost:8080/actuator/health
  
  # 또는 본인 PC 브라우저에서
  # http://YOUR_VM_IP:8080/actuator/health
  ```
  응답: `{"status":"UP"}`

---

### Step 4: Frontend 빌드 및 실행

```bash
# 프로젝트 루트로 이동
cd ..

# Frontend 빌드
cd frontend
docker build -t board-frontend:v1 .
```

**체크포인트**: `Successfully tagged board-frontend:v1` 메시지 확인

```bash
# Frontend 실행
docker run -d \
  --name frontend \
  --network board-network \
  -e BACKEND_URL=http://backend:8080 \
  -p 3000:3000 \
  board-frontend:v1

# 로그 확인
docker logs frontend
```

**체크포인트**: 브라우저에서 접속 시 게시판 화면이 보여야 합니다.
- VM 내부에서 테스트: `curl http://localhost:3000`
- **본인 PC 브라우저에서**: `http://YOUR_VM_IP:3000`

---

### Step 5: 애플리케이션 테스트

**본인 PC 브라우저에서 확인**:
1. `http://YOUR_VM_IP:3000` 접속
2. 로그인: `admin` / `admin123`
3. 게시글 목록 확인
4. 새 게시글 작성
5. 댓글 작성

**참고**: `YOUR_VM_IP`는 VM 할당 시트에서 확인한 본인의 외부 IP를 사용하세요.

**테스트 계정**:
- Admin: `admin` / `admin123`
- User1: `user1` / `user123`
- User2: `user2` / `user123`

---

### Step 6: 정리 및 복습

#### 현재 상태 확인

```bash
# 실행 중인 컨테이너
docker ps

# 네트워크 확인
docker network ls
docker network inspect board-network
```

#### Docker Run의 문제점

지금까지 경험한 불편한 점들:
1. ❌ 환경변수를 일일이 입력해야 함
2. ❌ 실행 순서를 수동으로 관리해야 함 (postgres → backend → frontend)
3. ❌ 컨테이너가 많아지면 관리가 어려움
4. ❌ 네트워크를 수동으로 생성하고 연결해야 함

**→ 이런 문제를 해결하기 위해 Docker Compose가 있습니다!**

#### 컨테이너 정리

```bash
# Phase 2를 위해 모두 정리
cd ..
docker rm -f frontend backend postgres
docker network rm board-network
```

---

## 🎯 Phase 2: Docker Compose로 편하게 관리하기 (20분)

### 목표
Docker Compose를 사용하여 멀티 컨테이너 애플리케이션을 쉽게 관리합니다.

### Step 1: docker-compose.yml 살펴보기

```bash
# 프로젝트 루트에서
cat docker-compose.yml
```

**주요 내용**:
```yaml
services:
  postgres:    # 데이터베이스
  backend:     # Spring Boot API
  frontend:    # Next.js 웹
```

**Docker Compose의 장점**:
- ✅ 모든 설정을 하나의 파일에 선언
- ✅ 자동으로 네트워크 생성
- ✅ `depends_on`으로 실행 순서 제어
- ✅ 환경변수 중앙 관리

---

### Step 2: Docker Compose로 실행

```bash
# 모든 서비스 시작 (백그라운드)
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

**명령어 설명**:
- `up`: 서비스 시작
- `-d`: 백그라운드 실행 (detached mode)
- `logs -f`: 실시간 로그 보기 (Ctrl+C로 종료)

**체크포인트**: 
- postgres, backend, frontend가 모두 `Up` 상태
- 본인 PC 브라우저에서 `http://YOUR_VM_IP:3000` 접속 가능

---

### Step 3: Docker Compose 명령어 실습

#### 상태 확인

```bash
# 실행 중인 서비스 확인
docker-compose ps

# 특정 서비스 로그만 보기
docker-compose logs backend
docker-compose logs frontend
```

#### 서비스 제어

```bash
# 특정 서비스 재시작
docker-compose restart backend

# 특정 서비스 중지
docker-compose stop frontend

# 특정 서비스 시작
docker-compose start frontend

# 스케일링 (backend를 3개로)
docker-compose up -d --scale backend=3
docker-compose ps
```

---

### Step 4: 애플리케이션 수정 및 재배포

#### 코드 수정 후 재빌드

```bash
# Frontend만 재빌드하고 재시작
docker-compose up -d --build frontend

# 또는 전체 재빌드
docker-compose build
docker-compose up -d
```

---

### Step 5: 데이터 초기화

**문제**: 초기 데이터(테스트 계정)가 안 보이는 경우

```bash
# 볼륨을 포함하여 완전히 삭제
docker-compose down -v

# 다시 시작 (새로운 데이터베이스)
docker-compose up -d

# 초기 데이터 로드 확인
docker-compose logs backend | grep "Demo data loaded"
```

---

### Step 6: 정리

#### Docker Compose의 장점 정리

| 항목 | Docker Run | Docker Compose |
|------|------------|----------------|
| 설정 방법 | 명령행 인자 | YAML 파일 |
| 네트워크 | 수동 생성 | 자동 생성 |
| 실행 순서 | 수동 관리 | depends_on |
| 환경변수 | 명령행에 나열 | 파일에 정리 |
| 재시작 | docker restart | docker-compose restart |
| 로그 | docker logs | docker-compose logs |

#### Docker Compose의 한계

- 🔸 단일 호스트(서버)에서만 실행
- 🔸 자동 스케일링 불가
- 🔸 자가 복구 기능 제한적
- 🔸 로드밸런싱 기본 기능 없음
- 🔸 무중단 배포(Rolling Update) 어려움

**→ 프로덕션 환경에서는 Kubernetes가 필요합니다!**

#### 정리

```bash
# Phase 3를 위해 정리
docker-compose down
```

---

## 🚢 Phase 3: Kubernetes(k3s)로 프로덕션 배포하기 (17분)

### 목표
Kubernetes를 사용하여 프로덕션급 배포를 경험합니다.

### 사전 준비

#### 1. Docker Hub 로그인

```bash
docker login
```

**입력 정보**: Docker Hub 계정의 username과 password

#### 2. 이미지 빌드 및 푸시

**⚠️ IMPORTANT**: `YOUR_DOCKERHUB_USERNAME`을 본인의 Docker Hub 계정으로 변경하세요!

```bash
# 방법 A: 수동으로 태그 및 푸시
docker tag board-backend:v1 YOUR_DOCKERHUB_USERNAME/board-backend:latest
docker tag board-frontend:v1 YOUR_DOCKERHUB_USERNAME/board-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/board-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/board-frontend:latest

# 방법 B: 스크립트 사용 (더 빠름)
./build-and-push.sh YOUR_DOCKERHUB_USERNAME
```

**예시**:
```bash
# 예: Docker Hub 계정이 johndoe인 경우
./build-and-push.sh johndoe
```

**체크포인트**: Docker Hub 웹사이트에서 본인의 repository 확인

---

### Step 1: Kubernetes 매니페스트 수정

**⚠️ 필수 작업**: 다음 파일들을 수정해야 합니다!

#### 1-1. Backend Deployment 수정

파일: `k8s/backend/deployment.yaml`

```yaml
# 25번째 줄 부근 찾기
spec:
  containers:
  - name: backend
    image: YOUR_DOCKERHUB_USERNAME/board-backend:latest  # ← 여기 변경!
```

**YOUR_DOCKERHUB_USERNAME을 본인 계정으로 변경**

#### 1-2. Frontend Deployment 수정

파일: `k8s/frontend/deployment.yaml`

```yaml
# 25번째 줄 부근 찾기
spec:
  containers:
  - name: frontend
    image: YOUR_DOCKERHUB_USERNAME/board-frontend:latest  # ← 여기 변경!
```

**YOUR_DOCKERHUB_USERNAME을 본인 계정으로 변경**

---

### Step 2: Kubernetes 개념 살펴보기

배포하기 전에 주요 개념을 이해합니다:

```bash
# k8s 디렉토리 구조 확인
ls -la k8s/
```

**주요 리소스**:
1. **Namespace** (`namespace.yaml`): 논리적 격리
2. **ConfigMap** (`configmap.yaml`): 설정 데이터
3. **Secret** (`secret.yaml`): 민감 정보 (비밀번호)
4. **PersistentVolumeClaim** (`postgres/pvc.yaml`): 데이터 영속성
5. **Deployment** (`*/deployment.yaml`): Pod 관리
6. **Service** (`*/service.yaml`): 로드밸런싱
7. **Ingress** (`frontend/ingress.yaml`): 외부 접근

---

### Step 3: Kubernetes 배포

```bash
cd k8s

# 전체 배포 (스크립트 사용)
./deploy-all.sh
```

**스크립트가 하는 일**:
1. Namespace 생성
2. ConfigMap, Secret 생성
3. PostgreSQL 배포 및 대기
4. Backend 배포 및 대기
5. Frontend 배포

**체크포인트**: "Frontend deployment completed!" 메시지 확인

---

### Step 4: 배포 상태 확인

#### 모든 리소스 확인

```bash
# board namespace의 모든 리소스
kubectl get all -n board

# Pod 상태 확인
kubectl get pods -n board

# 서비스 확인
kubectl get svc -n board

# Ingress 확인
kubectl get ingress -n board
```

**체크포인트**: 모든 Pod가 `Running` 상태여야 합니다.

#### 상세 정보 확인

```bash
# Pod 상세 정보
kubectl describe pod <pod-name> -n board

# 로그 확인
kubectl logs <pod-name> -n board

# 특정 deployment의 로그
kubectl logs deployment/backend -n board
kubectl logs deployment/frontend -n board
```

---

### Step 5: Service를 NodePort로 변경하여 외부 접속하기

기본적으로 배포된 Service는 `ClusterIP` 타입이라 클러스터 내부에서만 접속 가능합니다.
외부에서 접속하려면 `NodePort`로 변경해야 합니다.

#### 5-1. 현재 Service 타입 확인

```bash
# Service 목록 확인
kubectl get svc -n board

# 출력 예시:
# NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
# frontend-service   ClusterIP   10.43.xxx.xxx   <none>        3000/TCP   5m
# backend-service    ClusterIP   10.43.xxx.xxx   <none>        8080/TCP   5m
```

**확인**: `TYPE`이 `ClusterIP`로 표시됩니다 → 외부 접속 불가능

#### 5-2. Frontend Service를 NodePort로 변경

```bash
# kubectl patch를 사용한 실시간 변경
kubectl patch svc frontend-service -n board -p '{"spec":{"type":"NodePort"}}'

# Service 확인
kubectl get svc frontend-service -n board

# 출력 예시:
# NAME               TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# frontend-service   NodePort   10.43.xxx.xxx   <none>        3000:31234/TCP   5m
#                                                              ^^^^^^^^^^^^
#                                                              3000:NodePort
```

**설명**:
- `3000:31234` → 내부 포트 3000, 외부 NodePort 31234 (자동 할당)
- NodePort는 30000-32767 범위에서 자동으로 할당됩니다

#### 5-3. Backend Service도 NodePort로 변경 (선택사항)

```bash
# Backend API 테스트를 위해 변경
kubectl patch svc backend-service -n board -p '{"spec":{"type":"NodePort"}}'

# Service 확인
kubectl get svc backend-service -n board
```

#### 5-4. 할당된 NodePort 확인

```bash
# 모든 Service 확인
kubectl get svc -n board

# 출력 예시:
# NAME               TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# frontend-service   NodePort   10.43.xxx.xxx   <none>        3000:31234/TCP   5m
# backend-service    NodePort   10.43.xxx.xxx   <none>        8080:32567/TCP   5m
```

**중요**: `PORT(S)` 컬럼에서 뒤쪽 번호가 실제 접속 포트입니다!

#### 5-5. 본인 PC 브라우저에서 접속

```
http://YOUR_VM_IP:31234
```

**예시**: 
- Frontend NodePort가 `31234`라면 → `http://35.190.237.182:31234`
- Backend NodePort가 `32567`이라면 → `http://35.190.237.182:32567/actuator/health`

**테스트**:
1. 브라우저에서 `http://YOUR_VM_IP:NodePort` 접속
2. 로그인: `admin` / `admin123`
3. 게시글 작성
4. 댓글 작성

#### 5-6. Service 타입 원래대로 되돌리기 (실습 종료 후)

```bash
# ClusterIP로 다시 변경
kubectl patch svc frontend-service -n board -p '{"spec":{"type":"ClusterIP"}}'
kubectl patch svc backend-service -n board -p '{"spec":{"type":"ClusterIP"}}'
```

**💡 학습 포인트**:
- **ClusterIP**: 클러스터 내부에서만 접속 가능 (기본값)
- **NodePort**: 모든 노드의 특정 포트로 외부 접속 가능
- **LoadBalancer**: 클라우드 로드밸런서 사용 (GCP, AWS, Azure)
- **kubectl patch**: Service를 재생성하지 않고 실시간 수정 가능

---

### Step 6: 스케일링 실습

#### Pod 수 늘리기

```bash
# Backend를 3개로 스케일
kubectl scale deployment backend -n board --replicas=3

# 확인
kubectl get pods -n board
```

**체크포인트**: backend pod가 3개로 늘어나야 합니다.

#### 스케일 다운

```bash
# Backend를 2개로 축소
kubectl scale deployment backend -n board --replicas=2

# 확인
kubectl get pods -n board
```

---

### Step 7: 자가 복구(Self-Healing) 시연

#### Pod 강제 삭제

```bash
# Backend Pod 하나 삭제
kubectl delete pod <backend-pod-name> -n board

# 즉시 확인
kubectl get pods -n board -w
```

**관찰**: 
- 삭제된 Pod: `Terminating`
- 새로운 Pod: 자동으로 생성됨 (`ContainerCreating` → `Running`)

**✨ Kubernetes의 자가 복구**: Deployment가 항상 원하는 replica 수를 유지합니다!

---

### Step 8: 롤링 업데이트

#### 이미지 업데이트

```bash
# 새 버전 이미지로 업데이트
kubectl set image deployment/backend \
  backend=YOUR_DOCKERHUB_USERNAME/board-backend:v2 \
  -n board

# 롤아웃 상태 확인
kubectl rollout status deployment/backend -n board
```

**관찰**: 
- 새로운 Pod가 하나씩 생성됨
- 이전 Pod가 하나씩 종료됨
- **무중단 배포** (Zero Downtime)

#### 롤백

```bash
# 이전 버전으로 되돌리기
kubectl rollout undo deployment/backend -n board

# 히스토리 확인
kubectl rollout history deployment/backend -n board
```

---

### Step 9: 리소스 정리

#### 특정 리소스 삭제

```bash
# Deployment만 삭제
kubectl delete deployment backend -n board

# 다시 생성
kubectl apply -f backend/deployment.yaml
```

#### 전체 정리

```bash
# board namespace 전체 삭제
kubectl delete namespace board

# 또는 스크립트 사용
./cleanup-all.sh
```

---

## 📊 3가지 방식 비교 정리

### Docker Run vs Docker Compose vs Kubernetes

| 특징 | Docker Run | Docker Compose | Kubernetes |
|------|-----------|----------------|------------|
| **설정 복잡도** | 높음 | 중간 | 높음 (처음만) |
| **관리 편의성** | 낮음 | 높음 | 매우 높음 |
| **스케일링** | 수동 | 제한적 | 자동 |
| **자가 복구** | 없음 | 재시작만 | 완전 자동 |
| **로드밸런싱** | 없음 | 없음 | 자동 |
| **무중단 배포** | 불가 | 어려움 | 쉬움 |
| **프로덕션 준비** | ❌ | 제한적 | ✅ |
| **사용 시나리오** | 개발/테스트 | 개발/소규모 | 프로덕션 |

---

## 🔧 문제 해결 가이드

### Docker Run 관련

#### 문제: 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker logs <container-name>

# 상세 정보 확인
docker inspect <container-name>
```

#### 문제: 네트워크 연결 안됨

```bash
# 네트워크 확인
docker network ls
docker network inspect board-network

# 컨테이너가 네트워크에 연결되어 있는지 확인
docker inspect <container-name> | grep -A 20 "Networks"
```

---

### Docker Compose 관련

#### 문제: 서비스가 시작되지 않음

```bash
# 로그 확인
docker-compose logs <service-name>

# 상태 확인
docker-compose ps
```

#### 문제: 포트 충돌

```bash
# 사용 중인 포트 확인 (Mac/Linux)
lsof -i :3000
lsof -i :8080
lsof -i :5432

# 프로세스 종료
kill -9 <PID>
```

#### 문제: 초기 데이터가 없음

```bash
# 볼륨 삭제하고 재시작
docker-compose down -v
docker-compose up -d
```

---

### Kubernetes 관련

#### 문제: Pod가 ImagePullBackOff 상태

**원인**: 이미지를 찾을 수 없음

```bash
# Pod 상세 정보 확인
kubectl describe pod <pod-name> -n board
```

**해결**:
1. Deployment YAML에서 이미지 이름 확인
2. Docker Hub에 이미지가 푸시되었는지 확인
3. `YOUR_DOCKERHUB_USERNAME`을 본인 계정으로 변경했는지 확인

#### 문제: Pod가 CrashLoopBackOff 상태

**원인**: 애플리케이션이 시작 후 계속 실패함

```bash
# 로그 확인
kubectl logs <pod-name> -n board

# 이전 로그 확인
kubectl logs <pod-name> -n board --previous
```

#### 문제: Service에 연결 안됨

```bash
# Service 확인
kubectl get svc -n board

# Endpoint 확인
kubectl get endpoints -n board

# Service 상세 정보
kubectl describe svc <service-name> -n board
```

---

## 🎓 학습 정리

### 핵심 개념

#### Docker
- **컨테이너**: 격리된 실행 환경
- **이미지**: 컨테이너의 템플릿
- **네트워크**: 컨테이너 간 통신
- **볼륨**: 데이터 영속성

#### Docker Compose
- **선언적 설정**: YAML 파일로 모든 것을 정의
- **서비스**: 애플리케이션의 구성 요소
- **의존성 관리**: depends_on으로 순서 제어

#### Kubernetes
- **Pod**: 컨테이너의 실행 단위
- **Deployment**: Pod 관리 및 스케일링
- **Service**: 로드밸런싱 및 서비스 디스커버리
- **ConfigMap/Secret**: 설정 관리
- **자가 복구**: 항상 원하는 상태 유지
- **롤링 업데이트**: 무중단 배포

---

## 📚 추가 학습 리소스

### 공식 문서
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [k3s 공식 문서](https://docs.k3s.io/)

### 추천 학습 경로
1. **Docker 기초**: 컨테이너 개념, 이미지 빌드
2. **Docker Compose**: 멀티 컨테이너 애플리케이션
3. **Kubernetes 개념**: Pod, Deployment, Service
4. **Kubernetes 심화**: ConfigMap, Ingress, StatefulSet
5. **CI/CD**: Jenkins, GitHub Actions와 통합

---

## 🎯 다음 단계 실습 과제

### 기초 과제
1. **다른 이미지로 실습**
   - nginx, redis, mongodb 등으로 연습

2. **Dockerfile 수정**
   - Backend 또는 Frontend Dockerfile 최적화

3. **docker-compose.yml 수정**
   - 새로운 서비스 추가 (예: Redis 캐시)

### 중급 과제
1. **기능 추가**
   - 게시글 좋아요 기능
   - 게시글 태그 기능
   - 파일 업로드 기능

2. **모니터링 추가**
   - Prometheus + Grafana 연동

3. **CI/CD 구축**
   - GitHub Actions로 자동 배포

### 고급 과제
1. **Kubernetes 심화**
   - HPA (Horizontal Pod Autoscaler) 설정
   - Ingress로 도메인 연결
   - Helm Chart 작성

2. **보안 강화**
   - Network Policy 설정
   - HTTPS 적용
   - RBAC 설정

---

## 💡 팁과 꿀팁

### Docker 팁
```bash
# 모든 컨테이너 중지
docker stop $(docker ps -q)

# 사용하지 않는 이미지 정리
docker image prune -a

# 시스템 전체 정리
docker system prune -a --volumes
```

### kubectl 단축키
```bash
# .bashrc 또는 .zshrc에 추가
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgn='kubectl get nodes'
alias kdp='kubectl describe pod'
```

### 자주 사용하는 명령어
```bash
# Docker
docker ps -a                    # 모든 컨테이너
docker logs -f <container>      # 실시간 로그
docker exec -it <container> sh  # 컨테이너 접속

# Docker Compose
docker-compose up -d            # 시작
docker-compose down -v          # 정지 및 볼륨 삭제
docker-compose logs -f          # 실시간 로그

# Kubernetes
kubectl get all -n board        # 모든 리소스
kubectl logs -f deployment/backend -n board  # 실시간 로그
kubectl exec -it <pod> -n board -- sh        # Pod 접속
```

---

## ✅ 실습 완료 체크리스트

### Phase 1: Docker Run
- [ ] PostgreSQL 컨테이너 실행
- [ ] Backend 이미지 빌드
- [ ] 네트워크 문제 경험 및 해결
- [ ] Frontend 실행
- [ ] 브라우저에서 애플리케이션 동작 확인

### Phase 2: Docker Compose
- [ ] docker-compose.yml 이해
- [ ] docker-compose up으로 전체 실행
- [ ] 로그 확인 및 상태 모니터링
- [ ] 서비스 재시작 실습
- [ ] 정리 (docker-compose down)

### Phase 3: Kubernetes
- [ ] Docker Hub 계정 생성 및 로그인
- [ ] 이미지 푸시
- [ ] Kubernetes 매니페스트 수정
- [ ] 배포 및 상태 확인
- [ ] 스케일링 실습
- [ ] 자가 복구 확인
- [ ] 정리

---

**수고하셨습니다! 🎉**

이제 Docker와 Kubernetes의 기본을 이해하고 실제로 사용할 수 있게 되었습니다.
계속해서 실습하고 개인 프로젝트에 적용해보세요!

---

## 📝 만족도 조사 (필수!)

**⚠️ 중요: 실습을 완료한 후 반드시 만족도 조사에 참여해주세요!**

강의와 실습 환경 개선을 위해 여러분의 소중한 의견이 필요합니다.

### 만족도 조사 참여하기

🔗 **만족도 조사 링크**: [https://drive.google.com/file/d/1eAurDENJjObQs2WNBFUVW_m_8Yzc65a_/view](https://drive.google.com/file/d/1eAurDENJjObQs2WNBFUVW_m_8Yzc65a_/view?usp=sharing)

또는 아래 QR 코드를 스캔하세요:

![만족도 조사 QR 코드](images/[QR]%20만족도조사_고려대학교_251105.jpg)

**소요 시간**: 약 2-3분

**설문 내용**:
- 강의 내용의 이해도
- 실습 환경의 편의성
- 강의 진행 속도
- 개선 사항 및 건의사항

### 왜 만족도 조사가 중요한가요?

✅ 여러분의 피드백은 다음 강의 개선에 직접 반영됩니다  
✅ 실습 환경과 커리큘럼 개선에 활용됩니다  
✅ 더 나은 학습 경험을 만드는 데 도움이 됩니다

**감사합니다!** 여러분의 적극적인 참여를 부탁드립니다. 🙏

---

**질문이나 피드백**: [GitHub Issues](https://github.com/YOUR_REPO/issues)

