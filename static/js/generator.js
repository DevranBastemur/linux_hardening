// ============================================================
// SCRIPT URETICI - FORM OKUMA + API CAGRISI
// ============================================================

// Form'dan tum parametreleri topla
function collectParams() {
  return {
    ssh: {
      disable_root:            chk("ssh_disable_root"),
      disable_password:        chk("ssh_disable_password"),
      max_auth_tries:          val("ssh_max_tries"),
      disable_x11:             chk("ssh_disable_x11"),
      disable_agent_forwarding:chk("ssh_disable_agent"),
      login_grace_time:        chk("ssh_login_grace"),
    },
    kernel: {
      aslr:                chk("kernel_aslr"),
      disable_ipv6:        chk("kernel_ipv6"),
      syn_cookies:         chk("kernel_syn"),
      rp_filter:           chk("kernel_rp"),
      disable_icmp_redirect:chk("kernel_icmp"),
      disable_ip_forward:  chk("kernel_ipfwd"),
      log_martians:        chk("kernel_martians"),
      disable_core_dumps:  chk("kernel_coredump"),
    },
    permissions: {
      fix_critical_perms: chk("perms_critical"),
      fix_suid:           chk("perms_suid"),
      fix_world_writable: chk("perms_ww"),
      fix_orphaned:       chk("perms_orphaned"),
    },
    users: {
      lock_passwordless: chk("users_lock_pw"),
      fix_extra_roots:   chk("users_extra_root"),
      fix_shadow:        chk("users_shadow"),
      password_policy:   chk("users_pw_policy"),
    },
    blacklist_modules: getCheckedModules(),
    firewall: {
      enable_ufw:  chk("fw_enable"),
      allow_ssh:   chk("fw_ssh"),
      allow_http:  chk("fw_http"),
      allow_https: chk("fw_https"),
    },
    audit: {
      enable_auditd:   chk("audit_auditd"),
      log_sudo:        chk("audit_sudo_log"),
      disable_coredump:chk("audit_coredump"),
    },
    // Tarama sonucu secilen dosyalar
    suid_files:          getCheckedScanItems("suid_files"),
    world_writable_files:getCheckedScanItems("world_writable_files"),
    orphaned_files:      getCheckedScanItems("orphaned_files"),
    passwordless_users:  getCheckedScanItems("passwordless_users"),
    extra_root_users:    getCheckedScanItems("extra_root_users"),
  };
}

function chk(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function getCheckedModules() {
  return Array.from(
    document.querySelectorAll("#modules-body input[type=checkbox]:checked")
  ).map(el => el.value);
}

// Debounce - her keypress'te API'yi bogma
let _previewTimer = null;
function updatePreview() {
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(_doUpdatePreview, 120);
}

async function _doUpdatePreview() {
  const params = collectParams();

  // Hicbir sey secilmemisse bos goster
  const hasAny = checkAnySelected(params);
  const empty  = document.getElementById("preview-empty");
  const pre    = document.getElementById("preview-content");

  if (!hasAny) {
    empty.classList.remove("hidden");
    pre.classList.add("hidden");
    document.getElementById("line-count").textContent = "0 satir";
    return;
  }

  try {
    const res    = await fetch("/api/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(params),
    });
    const data   = await res.json();
    const script = data.script || "";

    empty.classList.add("hidden");
    pre.classList.remove("hidden");
    pre.innerHTML = syntaxHighlight(script);

    const lines = script.split("\n").length;
    document.getElementById("line-count").textContent = `${lines} satir`;

    // Guncel scripti global'e kaydet (kopyala/indir icin)
    window._currentScript = script;
  } catch (err) {
    console.error("Preview hatasi:", err);
  }
}

function checkAnySelected(p) {
  if (Object.values(p.ssh).some(v => v && v !== "3" && v !== 3)) return true;
  if (Object.values(p.kernel).some(Boolean)) return true;
  if (Object.values(p.permissions).some(Boolean)) return true;
  if (Object.values(p.users).some(Boolean)) return true;
  if (p.blacklist_modules.length > 0) return true;
  if (p.firewall.enable_ufw) return true;
  if (Object.values(p.audit).some(Boolean)) return true;
  return false;
}

// Basit syntax highlight
function syntaxHighlight(script) {
  return script
    .split("\n")
    .map(line => {
      const esc = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (esc.startsWith("#!"))
        return `<span class="sh-shebang">${esc}</span>`;
      if (esc.startsWith("# ──") || esc.startsWith("# =="))
        return `<span class="sh-section">${esc}</span>`;
      if (esc.startsWith("#"))
        return `<span class="sh-comment">${esc}</span>`;
      if (esc.includes("echo '[+]") || esc.includes('echo "[+]'))
        return `<span class="sh-echo-ok">${esc}</span>`;
      if (esc.includes("echo '[!]") || esc.includes('echo "[!]') ||
          esc.includes("echo '[*]") || esc.includes('echo "[*]'))
        return `<span class="sh-echo-warn">${esc}</span>`;
      if (esc.includes("echo '[!!!]") || esc.includes('echo "[!!!]'))
        return `<span class="sh-echo-err">${esc}</span>`;
      if (esc.startsWith("set ") || esc.startsWith("exec ") ||
          esc.startsWith("LOG_FILE") || esc.startsWith("SSHD") ||
          esc.startsWith("SYSCTL") || esc.startsWith("MODPROBE"))
        return `<span class="sh-var">${esc}</span>`;
      return `<span class="sh-cmd">${esc}</span>`;
    })
    .join("\n");
}

// Panoya kopyala
function copyScript() {
  const script = window._currentScript;
  if (!script) { showToast("Once bir secim yapin!", "warn"); return; }
  navigator.clipboard.writeText(script)
    .then(() => showToast("Script panoya kopyalandi!", "success"))
    .catch(() => showToast("Kopyalama basarisiz.", "error"));
}

// .sh olarak indir
function downloadScript() {
  const script = window._currentScript;
  if (!script) { showToast("Once bir secim yapin!", "warn"); return; }
  const blob = new Blob([script], { type: "text/x-sh" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `hardening_${new Date().toISOString().slice(0,10)}.sh`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Script indirildi!", "success");
}
