#!/bin/bash

# Setup SSH keys for all VMs
# This script copies your SSH public key to all VMs for password-less authentication

set -e

# Configuration
USERNAME="ubuntu"
SSH_KEY="${HOME}/.ssh/id_rsa.pub"

# VM IP addresses (customize these)
VMS=(
  "192.168.1.101"
  "192.168.1.102"
  "192.168.1.103"
  "192.168.1.104"
  "192.168.1.105"
  "192.168.1.106"
  "192.168.1.107"
  "192.168.1.108"
  "192.168.1.109"
  "192.168.1.110"
  "192.168.1.111"
  "192.168.1.112"
  "192.168.1.113"
  "192.168.1.114"
  "192.168.1.115"
  "192.168.1.116"
  "192.168.1.117"
  "192.168.1.118"
  "192.168.1.119"
  "192.168.1.120"
)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "SSH Key Distribution Script"
echo "======================================"
echo ""

# Check if SSH key exists
if [ ! -f "${SSH_KEY}" ]; then
  echo -e "${RED}Error: SSH public key not found at ${SSH_KEY}${NC}"
  echo "Please generate an SSH key pair first:"
  echo "  ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'"
  exit 1
fi

echo -e "${GREEN}Found SSH key: ${SSH_KEY}${NC}"
echo ""

# Check if sshpass is available (optional, for password-based auth)
SSHPASS_AVAILABLE=false
if command -v sshpass &> /dev/null; then
  SSHPASS_AVAILABLE=true
  echo -e "${GREEN}sshpass is available for automated password entry${NC}"
else
  echo -e "${YELLOW}sshpass not found. You'll need to enter passwords manually.${NC}"
  echo "Install it with: sudo apt install sshpass (optional)"
fi

echo ""
read -p "Press Enter to start distributing SSH keys to ${#VMS[@]} VMs..."
echo ""

# Counter for success/failure
SUCCESS=0
FAILED=0
FAILED_VMS=()

# Loop through all VMs
for VM in "${VMS[@]}"; do
  echo -e "${YELLOW}Setting up ${VM}...${NC}"
  
  # Try to copy SSH key
  if ssh-copy-id -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${USERNAME}@${VM}" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully configured ${VM}${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}✗ Failed to configure ${VM}${NC}"
    ((FAILED++))
    FAILED_VMS+=("${VM}")
  fi
  
  echo ""
done

# Summary
echo "======================================"
echo "Summary"
echo "======================================"
echo -e "${GREEN}Successful: ${SUCCESS}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"

if [ ${FAILED} -gt 0 ]; then
  echo ""
  echo "Failed VMs:"
  for VM in "${FAILED_VMS[@]}"; do
    echo "  - ${VM}"
  done
  echo ""
  echo "Please check:"
  echo "  1. VM is running and accessible"
  echo "  2. SSH service is running on the VM"
  echo "  3. Username and IP address are correct"
  echo "  4. Firewall allows SSH connections"
fi

echo ""
echo "======================================"

if [ ${FAILED} -eq 0 ]; then
  echo -e "${GREEN}All done! You can now run the Ansible playbook.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Verify: ansible all -i inventory.yml -m ping"
  echo "  2. Run playbook: ansible-playbook -i inventory.yml playbook.yml"
  exit 0
else
  echo -e "${YELLOW}Some VMs failed. Fix the issues and run this script again.${NC}"
  exit 1
fi

