# Ansible VM 자동 설정 가이드

Docker와 k3s를 20개의 VM에 자동으로 설치하기 위한 Ansible 플레이북입니다.

## 📋 개요

이 Ansible 플레이북은 다음을 자동화합니다:
- Docker CE 최신 버전 설치
- Docker Compose 설치
- k3s (경량 Kubernetes) 최신 버전 설치
- kubectl 설정 및 별칭
- 프로젝트 저장소 클론 (선택사항)
- 필요한 Docker 이미지 사전 다운로드

## 🎯 사전 요구사항

### 제어 노드 (Ansible 실행 머신)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ansible

# macOS
brew install ansible

# Python pip
pip install ansible
```

### 대상 VM (20대)
- OS: Ubuntu 20.04 LTS 이상
- RAM: 최소 4GB (권장 8GB)
- CPU: 최소 2 vCPU (권장 4 vCPU)
- 디스크: 최소 20GB (권장 40GB)
- SSH 접근 가능
- sudo 권한 있는 사용자

## 🚀 빠른 시작

### 1. SSH 키 생성 (최초 1회)

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### 2. Inventory 파일 수정

`inventory.yml`을 열어서 실제 VM IP 주소로 수정:

```yaml
all:
  hosts:
    vm-01:
      ansible_host: 192.168.1.101  # 실제 IP로 변경
      ansible_user: ubuntu          # 실제 사용자로 변경
```

### 3. 변수 설정 (선택사항)

`group_vars/all.yml`에서 필요한 설정 변경:

```yaml
# Docker 버전
docker_version: "latest"

# k3s 버전
k3s_version: "latest"

# 프로젝트 저장소 (본인의 저장소로 변경)
project_repo: "https://github.com/YOUR_USERNAME/ssboard.git"

# Docker Hub 사용자명
dockerhub_username: "YOUR_DOCKERHUB_USERNAME"
```

### 4. SSH 키 배포

```bash
chmod +x setup-ssh.sh
./setup-ssh.sh
```

각 VM의 비밀번호를 입력하거나, sshpass를 사용하여 자동화할 수 있습니다.

### 5. 연결 테스트

```bash
ansible all -i inventory.yml -m ping
```

모든 VM이 `SUCCESS`를 반환하면 준비 완료!

### 6. 플레이북 실행

```bash
chmod +x run.sh
./run.sh
```

또는 직접 실행:

```bash
ansible-playbook -i inventory.yml playbook.yml --ask-become-pass
```

## 📖 상세 사용법

### 특정 호스트만 설정

```bash
# 단일 호스트
ansible-playbook -i inventory.yml playbook.yml --limit vm-01

# 여러 호스트
ansible-playbook -i inventory.yml playbook.yml --limit vm-01,vm-02,vm-03

# 패턴 사용
ansible-playbook -i inventory.yml playbook.yml --limit vm-[01:05]
```

### 드라이런 (실제 변경 없이 테스트)

```bash
ansible-playbook -i inventory.yml playbook.yml --check
```

### 상세 로그 보기

```bash
# 일반 로그
ansible-playbook -i inventory.yml playbook.yml -v

# 더 상세한 로그
ansible-playbook -i inventory.yml playbook.yml -vv

# 디버그 레벨
ansible-playbook -i inventory.yml playbook.yml -vvv
```

### 특정 태스크부터 시작

```bash
ansible-playbook -i inventory.yml playbook.yml --start-at-task="Install Docker CE"
```

### 특정 태그만 실행

```bash
# 프로젝트 클론만
ansible-playbook -i inventory.yml playbook.yml --tags project

# 이미지 다운로드만
ansible-playbook -i inventory.yml playbook.yml --tags images

# 패키지 업그레이드 제외
ansible-playbook -i inventory.yml playbook.yml --skip-tags upgrade
```

## 🔍 검증

### Docker 설치 확인

```bash
# 모든 VM에서 Docker 버전 확인
ansible all -i inventory.yml -a "docker --version"

# Docker 서비스 상태 확인
ansible all -i inventory.yml -a "systemctl status docker" --become

# Docker Compose 버전 확인
ansible all -i inventory.yml -a "docker compose version"
```

### k3s 설치 확인

```bash
# k3s 버전 확인
ansible all -i inventory.yml -a "k3s --version"

# kubectl 버전 확인
ansible all -i inventory.yml -a "kubectl version --client"

# k3s 노드 상태 확인
ansible all -i inventory.yml -a "kubectl get nodes" --become

# k3s 서비스 상태 확인
ansible all -i inventory.yml -a "systemctl status k3s" --become
```

### 프로젝트 확인

```bash
# 프로젝트 디렉토리 확인
ansible all -i inventory.yml -a "ls -la ~/ssboard"

# .env 파일 확인
ansible all -i inventory.yml -a "cat ~/ssboard/.env"
```

## 🛠️ 트러블슈팅

### 연결 실패

**증상**: `ansible all -m ping` 실패

**원인 및 해결**:
1. SSH 키가 배포되지 않음
   ```bash
   ./setup-ssh.sh
   ```

2. VM이 꺼져있거나 네트워크 문제
   ```bash
   ping 192.168.1.101
   ```

3. 방화벽 문제
   ```bash
   # VM에서 SSH 포트 확인
   sudo ufw status
   sudo ufw allow 22
   ```

### 권한 문제

**증상**: `permission denied` 에러

**해결**:
```bash
# --ask-become-pass 옵션 사용
ansible-playbook -i inventory.yml playbook.yml --ask-become-pass

# 또는 sudoers 설정
echo "ubuntu ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ubuntu
```

### Docker 설치 실패

**증상**: Docker 설치 중 에러

**해결**:
```bash
# 기존 Docker 완전 제거
ansible all -i inventory.yml -a "sudo apt purge -y docker* containerd*"
ansible all -i inventory.yml -a "sudo rm -rf /var/lib/docker"

# 플레이북 재실행
./run.sh
```

### k3s 설치 실패

**증상**: k3s가 시작되지 않음

**해결**:
```bash
# k3s 제거
ansible all -i inventory.yml -a "/usr/local/bin/k3s-uninstall.sh" --become

# Swap 확인 및 비활성화
ansible all -i inventory.yml -a "swapon --show"
ansible all -i inventory.yml -a "sudo swapoff -a"

# 플레이북 재실행
./run.sh
```

### Python 패키지 문제

**증상**: `No module named 'docker'`

**해결**:
```bash
ansible all -i inventory.yml -a "sudo pip3 install docker docker-compose"
```

## 🎨 커스터마이징

### Docker 버전 고정

`group_vars/all.yml`:
```yaml
docker_version: "24.0.7"
```

### k3s 옵션 변경

`group_vars/all.yml`:
```yaml
k3s_install_options:
  - "--write-kubeconfig-mode 644"
  - "--disable traefik"
  - "--node-taint CriticalAddonsOnly=true:NoExecute"
```

### 추가 패키지 설치

`playbook.yml`의 `pre_tasks` 섹션에 추가:
```yaml
- name: Install additional packages
  apt:
    name:
      - your-package
    state: present
```

## 📊 성능 최적화

### 병렬 실행 수 증가

```bash
# 기본값: 5
ansible-playbook -i inventory.yml playbook.yml -f 10
```

`ansible.cfg` 파일 생성:
```ini
[defaults]
forks = 10
host_key_checking = False
timeout = 30
```

### 팩트 수집 건너뛰기 (빠른 실행)

```bash
ansible-playbook -i inventory.yml playbook.yml --skip-tags facts
```

## 🔄 재실행 및 업데이트

플레이북은 **멱등성(idempotent)**을 가지므로 여러 번 실행해도 안전합니다:

```bash
# Docker/k3s 버전 업데이트
# group_vars/all.yml에서 버전 변경 후
./run.sh
```

## 📝 로그 분석

```bash
# 로그 파일 확인
less ansible.log

# 에러만 추출
grep -i error ansible.log

# 특정 호스트의 로그만
grep "vm-01" ansible.log
```

## 🧹 정리

### k3s 제거

```bash
ansible all -i inventory.yml -a "/usr/local/bin/k3s-uninstall.sh" --become
```

### Docker 제거

```bash
ansible all -i inventory.yml -a "sudo apt purge -y docker-ce docker-ce-cli containerd.io"
ansible all -i inventory.yml -a "sudo rm -rf /var/lib/docker /etc/docker"
```

## 💡 추가 정보

### Ansible Vault (민감 정보 암호화)

비밀번호 등 민감 정보를 안전하게 저장:

```bash
# vault 파일 생성
ansible-vault create group_vars/vault.yml

# 내용 편집
ansible-vault edit group_vars/vault.yml

# 플레이북 실행시 vault 사용
ansible-playbook -i inventory.yml playbook.yml --ask-vault-pass
```

### 동적 Inventory

클라우드 환경에서 동적으로 호스트 목록 생성:
- AWS: `aws_ec2` 플러그인
- GCP: `gcp_compute` 플러그인
- Azure: `azure_rm` 플러그인

## 📚 참고 자료

- [Ansible 공식 문서](https://docs.ansible.com/)
- [Docker 설치 가이드](https://docs.docker.com/engine/install/)
- [k3s 공식 문서](https://k3s.io/)
- [ssboard 프로젝트 README](../README.md)

## 🤝 기여

문제 발견시 이슈를 남겨주세요!

---

**작성일**: 2025-11-04  
**버전**: 1.0.0

