#!/bin/bash

# Ansible Playbook Runner
# Automated setup script with pre-flight checks

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Ansible Playbook Runner"
echo "======================================"
echo ""

# Function to check command existence
check_command() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}✓ $1 is installed${NC}"
    return 0
  else
    echo -e "${RED}✗ $1 is not installed${NC}"
    return 1
  fi
}

# Pre-flight checks
echo -e "${BLUE}Running pre-flight checks...${NC}"
echo ""

# Check Ansible
if ! check_command ansible; then
  echo ""
  echo "Installing Ansible..."
  if [ -f /etc/debian_version ]; then
    sudo apt update
    sudo apt install -y ansible
  elif [ -f /etc/redhat-release ]; then
    sudo yum install -y ansible
  else
    echo -e "${RED}Please install Ansible manually${NC}"
    exit 1
  fi
fi

# Check ansible-playbook
check_command ansible-playbook || exit 1

# Check SSH key
echo ""
if [ -f ~/.ssh/ssboard ]; then
  echo -e "${GREEN}✓ SSH key found${NC}"
else
  echo -e "${RED}✗ SSH key not found${NC}"
  echo "Please generate an SSH key:"
  echo "  ssh-keygen -t rsa -b 4096"
  exit 1
fi

# Check inventory file
echo ""
if [ -f inventory.yml ]; then
  echo -e "${GREEN}✓ inventory.yml found${NC}"
else
  echo -e "${RED}✗ inventory.yml not found${NC}"
  echo "Please create inventory.yml first"
  exit 1
fi

# Check playbook file
if [ -f playbook.yml ]; then
  echo -e "${GREEN}✓ playbook.yml found${NC}"
else
  echo -e "${RED}✗ playbook.yml not found${NC}"
  echo "Please create playbook.yml first"
  exit 1
fi

echo ""
echo "======================================"
echo "Validating Inventory"
echo "======================================"
ansible-inventory -i inventory.yml --list

echo ""
echo "======================================"
echo "Testing Connections"
echo "======================================"
echo ""
echo "Testing SSH connectivity to all hosts..."

if ansible all -i inventory.yml -m ping; then
  echo ""
  echo -e "${GREEN}✓ All hosts are reachable${NC}"
else
  echo ""
  echo -e "${RED}✗ Some hosts are not reachable${NC}"
  echo ""
  echo "Please ensure:"
  echo "  1. SSH keys are distributed (run ./setup-ssh.sh)"
  echo "  2. All VMs are running"
  echo "  3. inventory.yml has correct IP addresses"
  echo ""
  read -p "Do you want to continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "======================================"
echo "Running Ansible Playbook"
echo "======================================"
echo ""

# Ask for confirmation
read -p "This will setup Docker and k3s on all VMs. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo -e "${BLUE}Starting playbook execution...${NC}"
echo ""

# Run playbook with options
ANSIBLE_LOG_PATH=ansible.log \
ansible-playbook \
  -i inventory.yml \
  playbook.yml \
  --ask-become-pass \
  "$@"

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "======================================"
  echo -e "${GREEN}✓ Playbook completed successfully!${NC}"
  echo "======================================"
  echo ""
  echo "Next steps:"
  echo "  1. Verify Docker: ansible all -i inventory.yml -a 'docker --version'"
  echo "  2. Verify k3s: ansible all -i inventory.yml -a 'kubectl get nodes'"
  echo "  3. SSH to a VM and check: ssh ubuntu@192.168.1.101"
  echo ""
  echo "Log file: ansible.log"
else
  echo ""
  echo "======================================"
  echo -e "${RED}✗ Playbook failed${NC}"
  echo "======================================"
  echo ""
  echo "Check the logs for details: ansible.log"
  echo "You can re-run this script after fixing the issues."
  exit 1
fi

