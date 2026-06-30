#!/usr/bin/env bash
# Provision the isolated edge VM (HAProxy SNI router) on the libvirt host.
# Run this ON the KVM host (techpology1) as a user with sudo.
#
#   sudo ./provision-edge-vm.sh
#
# Result: VM "edge" at 192.168.50.59 (macvtap on the LAN) + a DHCP mgmt NIC on
# the libvirt default network, running HAProxy from ../edge/haproxy.cfg.
# It does NOT change any router/DNS settings - the cutover (pointing the public
# 80/443 forward at 192.168.50.59) is a separate, deliberate step.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
IMG_DIR=/var/lib/libvirt/images
BASE="$IMG_DIR/noble-base.img"
DISK="$IMG_DIR/edge.img"
SEED="$IMG_DIR/edge-seed.iso"
LAN_IF=enp3s0           # host NIC on the 192.168.50.0/24 LAN (macvtap source)
LAN_MAC=52:54:00:60:00:59
MGMT_MAC=52:54:00:60:00:5a

[ -f "$BASE" ] || { echo "Missing $BASE (Ubuntu 24.04 cloud image). Download it first."; exit 1; }

# 1. Build cloud-init user-data (installs haproxy + our config as single source).
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
{
  echo "#cloud-config"
  echo "hostname: edge"
  echo "ssh_pwauth: true"
  echo "chpasswd:"
  echo "  expire: false"
  echo "  list: |"
  echo "    ubuntu:ChangeMe123!"
  echo "package_update: true"
  echo "packages: [haproxy]"
  echo "write_files:"
  echo "  - path: /etc/haproxy/haproxy.cfg"
  echo "    permissions: '0644'"
  echo "    content: |"
  sed 's/^/      /' "$HERE/haproxy.cfg"
  echo "runcmd:"
  echo "  - [ systemctl, enable, haproxy ]"
  echo "  - [ systemctl, restart, haproxy ]"
} > "$WORK/user-data"
cp "$HERE/network-config" "$WORK/network-config"
printf 'instance-id: edge\nlocal-hostname: edge\n' > "$WORK/meta-data"

# 2. Seed ISO + a dedicated overlay disk backed by the base cloud image.
cloud-localds --network-config="$WORK/network-config" "$SEED" "$WORK/user-data" "$WORK/meta-data"
[ -f "$DISK" ] || qemu-img create -f qcow2 -F qcow2 -b "$BASE" "$DISK" 10G

# 3. Create the VM: macvtap on the LAN (static .59) + default net for mgmt.
virt-install \
  --name edge \
  --memory 1024 --vcpus 1 \
  --os-variant ubuntu24.04 \
  --disk path="$DISK",device=disk,bus=virtio \
  --disk path="$SEED",device=cdrom \
  --network type=direct,source="$LAN_IF",source_mode=bridge,model=virtio,mac="$LAN_MAC" \
  --network network=default,model=virtio,mac="$MGMT_MAC" \
  --graphics none --noautoconsole --import

echo "edge VM created. HAProxy will come up after first boot + package install."
echo "Test on the LAN BEFORE any router change:"
echo "  curl -k --resolve mail.caerora.com:443:192.168.50.59 https://mail.caerora.com/ -I"
echo "  curl -k --resolve caerora.com:443:192.168.50.59      https://caerora.com/ -I"
