# Ansible 플레이북 테스트 가이드

실제 VM에 배포하기 전에 로컬에서 테스트하는 방법입니다.

## 🧪 로컬 테스트 (Vagrant 사용)

### 1. Vagrant 설치

```bash
# macOS
brew install vagrant

# Ubuntu
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vagrant
```

### 2. Vagrantfile 생성

`ansible/Vagrantfile`:
```ruby
Vagrant.configure("2") do |config|
  # Use Ubuntu 22.04
  config.vm.box = "ubuntu/jammy64"
  
  # Create 3 test VMs
  (1..3).each do |i|
    config.vm.define "vm-0#{i}" do |node|
      node.vm.hostname = "vm-0#{i}"
      node.vm.network "private_network", ip: "192.168.56.10#{i}"
      
      node.vm.provider "virtualbox" do |vb|
        vb.memory = "2048"
        vb.cpus = 2
      end
    end
  end
  
  # Provision with Ansible (optional)
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "playbook.yml"
    ansible.inventory_path = "test-inventory.yml"
  end
end
```

### 3. 테스트 Inventory 생성

`ansible/test-inventory.yml`:
```yaml
all:
  hosts:
    vm-01:
      ansible_host: 192.168.56.101
      ansible_user: vagrant
      ansible_ssh_private_key_file: .vagrant/machines/vm-01/virtualbox/private_key
    vm-02:
      ansible_host: 192.168.56.102
      ansible_user: vagrant
      ansible_ssh_private_key_file: .vagrant/machines/vm-02/virtualbox/private_key
    vm-03:
      ansible_host: 192.168.56.103
      ansible_user: vagrant
      ansible_ssh_private_key_file: .vagrant/machines/vm-03/virtualbox/private_key
  
  vars:
    ansible_python_interpreter: /usr/bin/python3
```

### 4. VM 시작 및 테스트

```bash
# VM 시작
vagrant up

# 연결 테스트
ansible all -i test-inventory.yml -m ping

# 플레이북 실행
ansible-playbook -i test-inventory.yml playbook.yml

# VM 정리
vagrant destroy -f
```

## ✅ 검증 체크리스트

### Phase 1: 연결 테스트
- [ ] `ansible all -m ping` 성공
- [ ] SSH 키 기반 인증 동작
- [ ] sudo 권한 확인

### Phase 2: Docker 설치 검증
- [ ] Docker 서비스 실행 중
- [ ] Docker 버전 확인
- [ ] Docker Compose 설치 확인
- [ ] 사용자가 docker 그룹에 속함
- [ ] `docker ps` 명령어 동작

### Phase 3: k3s 설치 검증
- [ ] k3s 서비스 실행 중
- [ ] kubectl 명령어 동작
- [ ] `kubectl get nodes` 노드 Ready 상태
- [ ] kubeconfig 파일 존재
- [ ] kubectl 별칭(k) 동작

### Phase 4: 프로젝트 설정 검증
- [ ] 프로젝트 디렉토리 존재
- [ ] .env 파일 생성됨
- [ ] Docker 이미지 다운로드됨

## 🔄 단계별 테스트 시나리오

### 시나리오 1: Docker만 설치

```bash
# playbook.yml에서 k3s role 주석 처리
ansible-playbook -i test-inventory.yml playbook.yml --skip-tags k3s

# 검증
ansible all -i test-inventory.yml -a "docker --version"
ansible all -i test-inventory.yml -a "docker run hello-world"
```

### 시나리오 2: k3s만 설치

```bash
# playbook.yml에서 docker role 주석 처리
ansible-playbook -i test-inventory.yml playbook.yml --skip-tags docker

# 검증
ansible all -i test-inventory.yml -a "kubectl get nodes"
ansible all -i test-inventory.yml -a "kubectl get pods -A"
```

### 시나리오 3: 전체 설치

```bash
# 전체 플레이북 실행
ansible-playbook -i test-inventory.yml playbook.yml

# 통합 검증
ansible all -i test-inventory.yml -a "docker --version && kubectl version --client"
```

## 🐛 실패 케이스 테스트

### 케이스 1: 네트워크 연결 실패

```bash
# VM 방화벽 설정
ansible all -i test-inventory.yml -a "sudo ufw enable"
ansible all -i test-inventory.yml -a "sudo ufw deny 22"

# 예상: 연결 실패
ansible all -i test-inventory.yml -m ping
# 결과: UNREACHABLE

# 복구
ansible all -i test-inventory.yml -a "sudo ufw allow 22"
```

### 케이스 2: 권한 문제

```bash
# sudo 권한 제거 (테스트용)
# 예상: Docker 설치 실패

# 복구: --ask-become-pass 사용
ansible-playbook -i test-inventory.yml playbook.yml --ask-become-pass
```

### 케이스 3: Swap이 활성화된 경우

```bash
# Swap 활성화
ansible all -i test-inventory.yml -a "sudo swapon -a"

# k3s 설치 시도
# 예상: 플레이북이 자동으로 swap 비활성화

# 검증
ansible all -i test-inventory.yml -a "swapon --show"
# 결과: 비어있어야 함
```

## 📊 성능 테스트

### 병렬 실행 시간 측정

```bash
# 순차 실행 (forks=1)
time ansible-playbook -i test-inventory.yml playbook.yml -f 1

# 병렬 실행 (forks=10)
time ansible-playbook -i test-inventory.yml playbook.yml -f 10

# 차이 비교
```

### 멱등성 테스트

```bash
# 첫 실행
ansible-playbook -i test-inventory.yml playbook.yml

# 두 번째 실행 (변경사항이 없어야 함)
ansible-playbook -i test-inventory.yml playbook.yml

# 출력에서 "changed=0"인지 확인
```

## 🔍 디버깅 기법

### 1. 특정 태스크만 실행

```bash
ansible-playbook -i test-inventory.yml playbook.yml \
  --start-at-task="Install Docker CE"
```

### 2. 변수 확인

```bash
# 특정 호스트의 변수 출력
ansible vm-01 -i test-inventory.yml -m debug -a "var=hostvars[inventory_hostname]"

# 그룹 변수 확인
ansible all -i test-inventory.yml -m debug -a "var=docker_version"
```

### 3. 태스크 결과 저장

```bash
ansible-playbook -i test-inventory.yml playbook.yml \
  --extra-vars="register_results=true" \
  > playbook_output.txt 2>&1
```

### 4. Step-by-Step 실행

```bash
ansible-playbook -i test-inventory.yml playbook.yml --step
```

## 🧹 롤백 절차

### 완전 롤백 (초기 상태로 복원)

```bash
# 1. k3s 제거
ansible all -i test-inventory.yml -a "/usr/local/bin/k3s-uninstall.sh" --become

# 2. Docker 제거
ansible all -i test-inventory.yml -a "sudo apt purge -y docker-ce docker-ce-cli containerd.io"
ansible all -i test-inventory.yml -a "sudo rm -rf /var/lib/docker /etc/docker"
ansible all -i test-inventory.yml -a "sudo rm -rf /var/lib/rancher"

# 3. 프로젝트 디렉토리 삭제
ansible all -i test-inventory.yml -a "rm -rf ~/ssboard"

# 4. 패키지 정리
ansible all -i test-inventory.yml -a "sudo apt autoremove -y"
```

### 부분 롤백 (k3s만 제거)

```bash
ansible all -i test-inventory.yml -a "/usr/local/bin/k3s-uninstall.sh" --become
ansible all -i test-inventory.yml -a "sudo rm -rf /var/lib/rancher"
```

## 📈 모니터링

### 실시간 리소스 모니터링

```bash
# CPU/메모리 사용률
ansible all -i test-inventory.yml -a "top -bn1 | head -20"

# 디스크 사용률
ansible all -i test-inventory.yml -a "df -h"

# 네트워크 연결
ansible all -i test-inventory.yml -a "ss -tulpn"

# Docker 리소스
ansible all -i test-inventory.yml -a "docker stats --no-stream"

# k3s Pod 상태
ansible all -i test-inventory.yml -a "kubectl top pods -A" --become
```

## 🎯 프로덕션 전 최종 체크리스트

- [ ] 모든 VM에 대해 ping 테스트 통과
- [ ] Docker 버전 일관성 확인
- [ ] k3s 버전 일관성 확인
- [ ] 모든 노드 Ready 상태
- [ ] Docker 이미지 다운로드 완료
- [ ] 프로젝트 파일 정상 클론
- [ ] 로그 파일 확인 (에러 없음)
- [ ] 멱등성 테스트 통과 (2회 실행)
- [ ] 롤백 테스트 성공
- [ ] 문서 업데이트 완료

## 💾 백업 및 스냅샷

### VM 스냅샷 생성 (클라우드별)

**AWS EC2:**
```bash
aws ec2 create-snapshot --volume-id vol-xxxxx --description "Before Ansible"
```

**GCP:**
```bash
gcloud compute disks snapshot DISK_NAME --snapshot-names=before-ansible
```

**Azure:**
```bash
az snapshot create --resource-group MyResourceGroup --name before-ansible --source MyVM
```

## 📝 테스트 보고서 템플릿

```markdown
# Ansible 플레이북 테스트 보고서

## 테스트 정보
- 날짜: YYYY-MM-DD
- 테스터: [이름]
- 환경: [Vagrant/AWS/GCP/Azure]
- VM 수: [개수]

## 테스트 결과
- [ ] 연결 테스트 통과
- [ ] Docker 설치 성공
- [ ] k3s 설치 성공
- [ ] 프로젝트 클론 성공
- [ ] 멱등성 확인

## 발견된 이슈
1. [이슈 설명]
   - 원인: [원인]
   - 해결: [해결 방법]

## 성능 측정
- 총 실행 시간: [분:초]
- VM당 평균 시간: [초]
- 병렬도: [forks 수]

## 권장사항
[개선 제안사항]
```

---

**테스트 문의**: Issues 섹션에 남겨주세요!

