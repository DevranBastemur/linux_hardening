#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Linux Sunucu Sikistirma Script Olusturucu
Calistirma: sudo python3 app.py
Erisim:     http://localhost:8080
"""

import http.server
import socketserver
import subprocess
import urllib.parse
import json
import os
import mimetypes

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SUID_WHITELIST = {
    "/usr/bin/passwd", "/usr/bin/chfn", "/usr/bin/chsh",
    "/usr/bin/gpasswd", "/usr/bin/newgrp", "/usr/bin/sudo",
    "/usr/bin/mount", "/usr/bin/umount", "/usr/bin/pkexec",
    "/usr/lib/dbus-1.0/dbus-daemon-launch-helper",
    "/usr/lib/openssh/ssh-keysign", "/usr/bin/at",
    "/usr/lib/policykit-1/polkit-agent-helper-1",
    "/usr/bin/su", "/usr/bin/fusermount", "/usr/bin/fusermount3",
    "/usr/sbin/pppd", "/usr/bin/ping", "/usr/bin/traceroute6",
    "/usr/lib/eject/dmcrypt-get-device",
}


def run_cmd(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return [l.strip() for l in r.stdout.splitlines() if l.strip()]
    except Exception:
        return []


def get_system_scan():
    data = {}
    all_suid = run_cmd("find / -perm -4000 -type f 2>/dev/null")
    data["suid_files"] = [f for f in all_suid if f not in SUID_WHITELIST]
    data["world_writable"] = run_cmd(
        r"find / -xdev -user root \( -perm -0002 -a ! -perm -1000 \) -print 2>/dev/null | head -30"
    )
    data["orphaned"] = run_cmd(
        r"find / -xdev \( -nouser -o -nogroup \) -print 2>/dev/null | head -30"
    )
    data["passwordless"] = run_cmd(
        "awk -F: '$2 == \"\" { print $1 }' /etc/shadow 2>/dev/null"
    )
    data["extra_roots"] = run_cmd(
        "awk -F: '{if ($3==0 && $1!=\"root\") print $1}' /etc/passwd"
    )
    data["non_shadowed"] = run_cmd(
        "awk -F: '($2 != \"x\") { print $1 }' /etc/passwd"
    )
    data["open_ports"] = run_cmd(
        "ss -tlnp 2>/dev/null | tail -n +2 | awk '{print $4, $6}' | head -20"
    )
    data["active_services"] = run_cmd(
        "systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | awk '{print $1}' | head -20"
    )
    return data


def generate_script(p):
    lines = [
        "#!/bin/bash",
        "# ============================================================",
        "# Linux Sunucu Sikistirma Scripti",
        "# Olusturulma: $(date)",
        "# UYARI: Bu scripti calistirmadan once yedek alin!",
        "# ============================================================",
        "",
        "set -euo pipefail",
        'LOG_FILE="/var/log/hardening_$(date +%Y%m%d_%H%M%S).log"',
        'exec > >(tee -a "$LOG_FILE") 2>&1',
        "",
        'echo "[*] Sikistirma islemi basliyor: $(date)"',
        'echo "[*] Log dosyasi: $LOG_FILE"',
        "",
    ]

    # SSH
    ssh = p.get("ssh", {})
    if any(ssh.values()):
        lines += [
            "# ── SSH Sikistirma ──────────────────────────────────────────",
            'echo "[*] SSH ayarlari guncelleniyor..."',
            'SSHD_CFG="/etc/ssh/sshd_config"',
            'cp "$SSHD_CFG" "${SSHD_CFG}.bak_$(date +%Y%m%d)"',
            "",
        ]
        if ssh.get("disable_root"):
            lines += [
                "sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' \"$SSHD_CFG\"",
                "grep -q 'PermitRootLogin' \"$SSHD_CFG\" || echo 'PermitRootLogin no' >> \"$SSHD_CFG\"",
                "echo '[+] Root SSH girisi kapatildi.'",
            ]
        if ssh.get("disable_password"):
            lines += [
                "sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' \"$SSHD_CFG\"",
                "grep -q 'PasswordAuthentication' \"$SSHD_CFG\" || echo 'PasswordAuthentication no' >> \"$SSHD_CFG\"",
                "echo '[+] Parola ile SSH girisi kapatildi.'",
            ]
        if ssh.get("max_auth_tries"):
            v = int(ssh["max_auth_tries"])
            lines += [
                f"sed -i 's/^#*MaxAuthTries.*/MaxAuthTries {v}/' \"$SSHD_CFG\"",
                f"grep -q 'MaxAuthTries' \"$SSHD_CFG\" || echo 'MaxAuthTries {v}' >> \"$SSHD_CFG\"",
                f"echo '[+] MaxAuthTries {v} olarak ayarlandi.'",
            ]
        if ssh.get("disable_x11"):
            lines += [
                "sed -i 's/^#*X11Forwarding.*/X11Forwarding no/' \"$SSHD_CFG\"",
                "grep -q 'X11Forwarding' \"$SSHD_CFG\" || echo 'X11Forwarding no' >> \"$SSHD_CFG\"",
                "echo '[+] X11 Forwarding kapatildi.'",
            ]
        if ssh.get("disable_agent_forwarding"):
            lines += [
                "sed -i 's/^#*AllowAgentForwarding.*/AllowAgentForwarding no/' \"$SSHD_CFG\"",
                "grep -q 'AllowAgentForwarding' \"$SSHD_CFG\" || echo 'AllowAgentForwarding no' >> \"$SSHD_CFG\"",
                "echo '[+] Agent Forwarding kapatildi.'",
            ]
        if ssh.get("login_grace_time"):
            lines += [
                "sed -i 's/^#*LoginGraceTime.*/LoginGraceTime 30/' \"$SSHD_CFG\"",
                "grep -q 'LoginGraceTime' \"$SSHD_CFG\" || echo 'LoginGraceTime 30' >> \"$SSHD_CFG\"",
                "echo '[+] LoginGraceTime 30s olarak ayarlandi.'",
            ]
        lines += ["systemctl restart sshd && echo '[+] SSH servisi yeniden baslatildi.'", ""]

    # Kernel
    kernel = p.get("kernel", {})
    if any(kernel.values()):
        lines += [
            "# ── Kernel ve Ag Optimizasyonu ──────────────────────────────",
            'echo "[*] Kernel parametreleri ayarlaniyor..."',
            'SYSCTL_CFG="/etc/sysctl.d/99-hardening.conf"',
            "",
        ]
        params = []
        if kernel.get("aslr"):
            params.append("kernel.randomize_va_space = 2")
        if kernel.get("disable_ipv6"):
            params += ["net.ipv6.conf.all.disable_ipv6 = 1",
                       "net.ipv6.conf.default.disable_ipv6 = 1",
                       "net.ipv6.conf.lo.disable_ipv6 = 1"]
        if kernel.get("syn_cookies"):
            params.append("net.ipv4.tcp_syncookies = 1")
        if kernel.get("rp_filter"):
            params += ["net.ipv4.conf.all.rp_filter = 1",
                       "net.ipv4.conf.default.rp_filter = 1"]
        if kernel.get("disable_icmp_redirect"):
            params += ["net.ipv4.conf.all.accept_redirects = 0",
                       "net.ipv4.conf.default.accept_redirects = 0",
                       "net.ipv6.conf.all.accept_redirects = 0"]
        if kernel.get("disable_ip_forward"):
            params.append("net.ipv4.ip_forward = 0")
        if kernel.get("log_martians"):
            params += ["net.ipv4.conf.all.log_martians = 1",
                       "net.ipv4.conf.default.log_martians = 1"]
        if kernel.get("disable_core_dumps"):
            params.append("fs.suid_dumpable = 0")
        if params:
            lines.append("cat > \"$SYSCTL_CFG\" << 'EOF'")
            lines.append("# Hardening sysctl parametreleri")
            lines += params
            lines.append("EOF")
            lines.append("sysctl -p \"$SYSCTL_CFG\" && echo '[+] Sysctl parametreleri uygulandi.'")
        lines.append("")

    # Permissions
    perms = p.get("permissions", {})
    if any(perms.values()):
        lines += [
            "# ── Dosya Izinleri ve SUID ──────────────────────────────────",
            'echo "[*] Dosya izinleri duzenleniyor..."',
            "",
        ]
        if perms.get("fix_critical_perms"):
            lines += [
                "chmod 644 /etc/passwd  && echo '[+] /etc/passwd: 644'",
                "chmod 640 /etc/shadow  && echo '[+] /etc/shadow: 640'",
                "chmod 644 /etc/group   && echo '[+] /etc/group: 644'",
                "chmod 600 /etc/gshadow && echo '[+] /etc/gshadow: 600'",
                "chmod 700 /root        && echo '[+] /root: 700'",
                "chmod 600 /etc/crontab && echo '[+] /etc/crontab: 600'",
                "chmod 700 /etc/cron.d /etc/cron.daily /etc/cron.weekly /etc/cron.monthly 2>/dev/null || true",
            ]
        if perms.get("fix_suid"):
            for f in p.get("suid_files", []):
                f = f.strip()
                if f:
                    lines.append(f"chmod u-s '{f}' && echo '[-] SUID kaldirildi: {f}'")
        if perms.get("fix_world_writable"):
            for f in p.get("world_writable_files", []):
                f = f.strip()
                if f:
                    lines.append(f"chmod o-w '{f}' && echo '[+] World-write kaldirildi: {f}'")
        if perms.get("fix_orphaned"):
            for f in p.get("orphaned_files", []):
                f = f.strip()
                if f:
                    lines.append(f"chown root:root '{f}' && chmod 644 '{f}' && echo '[+] Sahipsiz dosya duzeltildi: {f}'")
        lines.append("")

    # Users
    users = p.get("users", {})
    if any(users.values()):
        lines += [
            "# ── Kullanici Guvenligi ─────────────────────────────────────",
            'echo "[*] Kullanici guvenligi ayarlaniyor..."',
            "",
        ]
        if users.get("lock_passwordless"):
            for u in p.get("passwordless_users", []):
                u = u.strip()
                if u:
                    lines.append(f"passwd -l '{u}' && echo '[!] Parolasiz hesap kilitlendi: {u}'")
        if users.get("fix_extra_roots"):
            for u in p.get("extra_root_users", []):
                u = u.strip()
                if u:
                    lines.append(f"echo '[!!!] Manuel kontrol: UID 0 kullanici -> {u}'")
        if users.get("fix_shadow"):
            lines.append("pwconv && echo '[+] Shadow senkronizasyonu yapildi.'")
        if users.get("password_policy"):
            lines += [
                "if dpkg -l libpam-pwquality &>/dev/null; then",
                "  sed -i 's/^# minlen.*/minlen = 12/' /etc/security/pwquality.conf 2>/dev/null || true",
                "  echo '[+] Minimum parola uzunlugu 12 yapildi.'",
                "fi",
            ]
        lines.append("")

    # Modules
    modules = p.get("blacklist_modules", [])
    if modules:
        module_map = {
            "bluetooth": "bluetooth", "joydev": "joydev", "soundcore": "soundcore",
            "usb_storage": "usb-storage", "firewire": "firewire-core",
            "thunderbolt": "thunderbolt", "cramfs": "cramfs", "freevxfs": "freevxfs",
            "jffs2": "jffs2", "hfs": "hfs", "hfsplus": "hfsplus",
            "squashfs": "squashfs", "udf": "udf", "dccp": "dccp",
            "sctp": "sctp", "rds": "rds", "tipc": "tipc",
        }
        lines += [
            "# ── Modul Karaliste ─────────────────────────────────────────",
            'echo "[*] Gereksiz kernel modulleri karalisteye aliniyor..."',
            'MODPROBE_CFG="/etc/modprobe.d/hardening.conf"',
            "cat >> \"$MODPROBE_CFG\" << 'EOF'",
            "# Hardening - Gereksiz moduller",
        ]
        for mod in modules:
            lines.append(f"install {module_map.get(mod, mod)} /bin/true")
        lines += ["EOF", "echo '[+] Modul karaliste guncellendi.'", ""]

    # Firewall
    fw = p.get("firewall", {})
    if fw.get("enable_ufw"):
        lines += [
            "# ── Firewall (UFW) ──────────────────────────────────────────",
            'echo "[*] Firewall ayarlaniyor..."',
            "if command -v ufw &>/dev/null; then",
            "  ufw --force reset",
            "  ufw default deny incoming",
            "  ufw default allow outgoing",
        ]
        if fw.get("allow_ssh"):   lines.append("  ufw allow ssh")
        if fw.get("allow_http"):  lines.append("  ufw allow 80/tcp")
        if fw.get("allow_https"): lines.append("  ufw allow 443/tcp")
        lines += [
            "  ufw --force enable",
            "  echo '[+] UFW aktif edildi.'",
            "else",
            "  echo '[!] UFW bulunamadi, atlaniyor.'",
            "fi",
            "",
        ]

    # Audit
    audit = p.get("audit", {})
    if any(audit.values()):
        lines += [
            "# ── Denetim ve Loglama ──────────────────────────────────────",
            'echo "[*] Denetim ayarlari yapiliyor..."',
            "",
        ]
        if audit.get("enable_auditd"):
            lines += [
                "if ! command -v auditd &>/dev/null; then",
                "  apt-get install -y auditd audispd-plugins 2>/dev/null || true",
                "fi",
                "systemctl enable auditd && systemctl start auditd",
                "echo '[+] auditd aktif edildi.'",
            ]
        if audit.get("log_sudo"):
            lines += [
                "echo 'Defaults logfile=/var/log/sudo.log' >> /etc/sudoers.d/hardening 2>/dev/null || true",
                "echo '[+] Sudo loglama aktif edildi.'",
            ]
        if audit.get("disable_coredump"):
            lines += [
                "echo '* hard core 0' >> /etc/security/limits.d/hardening.conf",
                "echo '* soft core 0' >> /etc/security/limits.d/hardening.conf",
                "echo '[+] Core dump kapatildi.'",
            ]
        lines.append("")

    lines += [
        "# ── Tamamlandi ──────────────────────────────────────────────────",
        'echo ""',
        'echo "[*] ============================================"',
        'echo "[*] Sikistirma tamamlandi: $(date)"',
        'echo "[*] Log: $LOG_FILE"',
        'echo "[*] ============================================"',
        'echo "[!] Degisikliklerin tam etkili olmasi icin sistemi yeniden baslatmaniz onerilir."',
    ]
    return "\n".join(lines)


class HardeningHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Sessiz log

    def serve_file(self, filepath, content_type):
        try:
            with open(filepath, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-type", content_type)
            self.send_header("Content-Length", len(data))
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()

    def send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            self.serve_file(os.path.join(BASE_DIR, "templates", "index.html"), "text/html; charset=utf-8")
        elif path.startswith("/static/"):
            rel = path.lstrip("/")
            full = os.path.join(BASE_DIR, rel)
            mime, _ = mimetypes.guess_type(full)
            self.serve_file(full, mime or "application/octet-stream")
        elif path == "/api/scan":
            print("[*] Sistem taramasi basliyor...")
            data = get_system_scan()
            print("[+] Tarama tamamlandi.")
            self.send_json(data)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")

        if parsed.path == "/api/generate":
            try:
                params = json.loads(body)
            except Exception:
                self.send_json({"error": "Gecersiz JSON"}, 400)
                return
            script = generate_script(params)
            self.send_json({"script": script})

        elif parsed.path == "/api/execute":
            try:
                data = json.loads(body)
            except Exception:
                self.send_json({"error": "Gecersiz JSON"}, 400)
                return
            script_content = data.get("script", "")
            if not script_content.strip():
                self.send_json({"error": "Script bos"}, 400)
                return
            # Gecici dosyaya yaz ve calistir
            import tempfile, stat
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".sh", delete=False, prefix="/tmp/hardening_"
            ) as tf:
                tf.write(script_content)
                tmp_path = tf.name
            try:
                os.chmod(tmp_path, stat.S_IRWXU)
                result = subprocess.run(
                    ["bash", tmp_path],
                    capture_output=True, text=True, timeout=300
                )
                output = result.stdout
                if result.stderr:
                    output += "\n--- STDERR ---\n" + result.stderr
                self.send_json({
                    "output": output,
                    "returncode": result.returncode
                })
            except subprocess.TimeoutExpired:
                self.send_json({"output": "HATA: Script 300 saniye limitini asti.", "returncode": -1})
            except Exception as e:
                self.send_json({"output": f"HATA: {str(e)}", "returncode": -1})
            finally:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

        else:
            self.send_response(404)
            self.end_headers()


socketserver.TCPServer.allow_reuse_address = True
print(f"[*] Linux Hardening Panel baslatiliyor: http://localhost:{PORT}")
print("[*] Durdurmak icin: Ctrl+C")
with socketserver.TCPServer(("", PORT), HardeningHandler) as httpd:
    httpd.serve_forever()
