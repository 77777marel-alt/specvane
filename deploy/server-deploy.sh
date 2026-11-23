#!/usr/bin/env bash
# Выкладка новой версии Specvane на сервер. Вызывается из workflow "Deploy to Fornex".
set -euo pipefail
REL="$1"
BASE=/srv/specvane
mkdir -p "$BASE/releases/$REL" "$BASE/shared"
tar -xzf "/tmp/specvane-$REL.tgz" -C "$BASE/releases/$REL"
rm -f "/tmp/specvane-$REL.tgz"
chown -R app:app "$BASE/releases/$REL"

install -m 644 /tmp/specvane.service /etc/systemd/system/specvane.service
install -m 644 /tmp/Caddyfile /etc/caddy/Caddyfile

# старый кеш страниц (> 3 дней) чистим каждую ночь, чтобы не забить диск
echo '17 4 * * * root find /srv/specvane/releases -path "*/.next/cache/*" -type f -mmin +4320 -delete' > /etc/cron.d/specvane-cache

ln -sfn "$BASE/releases/$REL" "$BASE/current"
systemctl daemon-reload
systemctl enable specvane >/dev/null
systemctl restart specvane
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy || systemctl restart caddy

code=000
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/en || true)
  [ "$code" = 200 ] && break
  sleep 2
done
echo "health /en: $code"

# оставляем 3 последние версии
ls -1dt "$BASE"/releases/* | tail -n +4 | xargs -r rm -rf

systemctl --no-pager --lines=15 status specvane || true
free -h; df -h /
[ "$code" = 200 ]
