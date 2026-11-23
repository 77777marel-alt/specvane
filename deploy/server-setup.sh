#!/usr/bin/env bash
# Первичная настройка VPS Fornex (Ubuntu 24.04) для сайтов на Next.js.
# Запускается из GitHub Actions: workflow "Server setup". Можно запускать повторно.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "== swap 3G"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 3G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf && sysctl -p /etc/sysctl.d/99-swappiness.conf

echo "== packages"
apt-get update -y
apt-get -y -o Dpkg::Options::=--force-confold upgrade
apt-get install -y ufw fail2ban unattended-upgrades curl ca-certificates gnupg rsync \
  debian-keyring debian-archive-keyring apt-transport-https

echo "== firewall (22, 80, 443)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== ssh: only keys, no passwords"
# 00- so it wins over 50-cloud-init.conf (first value wins in sshd)
cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
sshd -t && systemctl reload ssh

echo "== journald limit"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' > /etc/systemd/journald.conf.d/size.conf
systemctl restart systemd-journald

echo "== timezone"
timedatectl set-timezone Europe/Athens

echo "== Node.js 22"
if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "== Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "== app user and folders"
id app >/dev/null 2>&1 || useradd -m -s /bin/bash app
mkdir -p /srv/specvane && chown app:app /srv/specvane

echo "== SETUP_DONE"
node -v; caddy version; free -h; df -h /; ufw status
grep -E '^(PasswordAuthentication|PermitRootLogin)' /etc/ssh/sshd_config.d/*.conf || true
