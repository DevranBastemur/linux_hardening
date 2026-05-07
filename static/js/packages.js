// ============================================================
// HAZIR PAKET TANIMLARI
// ============================================================

const PACKAGES = {
  basic: {
    label: "Temel Guvenlik",
    description: "SSH + Kernel temel ayarlar",
    ssh: {
      disable_root: true,
      disable_password: false,
      max_auth_tries: 3,
      disable_x11: true,
      disable_agent_forwarding: false,
      login_grace_time: true,
    },
    kernel: {
      aslr: true,
      disable_ipv6: false,
      syn_cookies: true,
      rp_filter: true,
      disable_icmp_redirect: true,
      disable_ip_forward: false,
      log_martians: false,
      disable_core_dumps: false,
    },
    permissions: {
      fix_critical_perms: true,
      fix_suid: false,
      fix_world_writable: false,
      fix_orphaned: false,
    },
    users: {
      lock_passwordless: false,
      fix_extra_roots: false,
      fix_shadow: false,
      password_policy: false,
    },
    blacklist_modules: [],
    firewall: {
      enable_ufw: false,
      allow_ssh: true,
      allow_http: false,
      allow_https: false,
    },
    audit: {
      enable_auditd: false,
      log_sudo: false,
      disable_coredump: false,
    },
  },

  aggressive: {
    label: "Agresif Sikistirma",
    description: "Maksimum guvenlik, tum onlemler",
    ssh: {
      disable_root: true,
      disable_password: true,
      max_auth_tries: 3,
      disable_x11: true,
      disable_agent_forwarding: true,
      login_grace_time: true,
    },
    kernel: {
      aslr: true,
      disable_ipv6: true,
      syn_cookies: true,
      rp_filter: true,
      disable_icmp_redirect: true,
      disable_ip_forward: true,
      log_martians: true,
      disable_core_dumps: true,
    },
    permissions: {
      fix_critical_perms: true,
      fix_suid: true,
      fix_world_writable: true,
      fix_orphaned: true,
    },
    users: {
      lock_passwordless: true,
      fix_extra_roots: true,
      fix_shadow: true,
      password_policy: true,
    },
    blacklist_modules: [
      "bluetooth", "joydev", "soundcore", "usb_storage",
      "firewire", "dccp", "sctp", "rds", "tipc", "cramfs",
    ],
    firewall: {
      enable_ufw: true,
      allow_ssh: true,
      allow_http: false,
      allow_https: false,
    },
    audit: {
      enable_auditd: true,
      log_sudo: true,
      disable_coredump: true,
    },
  },

  webserver: {
    label: "Web Sunucusu",
    description: "HTTP/HTTPS + UFW + SSH",
    ssh: {
      disable_root: true,
      disable_password: false,
      max_auth_tries: 4,
      disable_x11: true,
      disable_agent_forwarding: false,
      login_grace_time: true,
    },
    kernel: {
      aslr: true,
      disable_ipv6: false,
      syn_cookies: true,
      rp_filter: true,
      disable_icmp_redirect: true,
      disable_ip_forward: false,
      log_martians: false,
      disable_core_dumps: false,
    },
    permissions: {
      fix_critical_perms: true,
      fix_suid: false,
      fix_world_writable: false,
      fix_orphaned: false,
    },
    users: {
      lock_passwordless: true,
      fix_extra_roots: false,
      fix_shadow: false,
      password_policy: false,
    },
    blacklist_modules: [],
    firewall: {
      enable_ufw: true,
      allow_ssh: true,
      allow_http: true,
      allow_https: true,
    },
    audit: {
      enable_auditd: true,
      log_sudo: true,
      disable_coredump: false,
    },
  },
};

// Paketi forma uygula
function applyPackage(pkgKey) {
  const p = PACKAGES[pkgKey];
  if (!p) return;

  // SSH
  setChk("ssh_disable_root",     p.ssh.disable_root);
  setChk("ssh_disable_password", p.ssh.disable_password);
  setChk("ssh_disable_x11",      p.ssh.disable_x11);
  setChk("ssh_disable_agent",    p.ssh.disable_agent_forwarding);
  setChk("ssh_login_grace",      p.ssh.login_grace_time);
  setVal("ssh_max_tries",        p.ssh.max_auth_tries);

  // Kernel
  setChk("kernel_aslr",    p.kernel.aslr);
  setChk("kernel_ipv6",    p.kernel.disable_ipv6);
  setChk("kernel_syn",     p.kernel.syn_cookies);
  setChk("kernel_rp",      p.kernel.rp_filter);
  setChk("kernel_icmp",    p.kernel.disable_icmp_redirect);
  setChk("kernel_ipfwd",   p.kernel.disable_ip_forward);
  setChk("kernel_martians",p.kernel.log_martians);
  setChk("kernel_coredump",p.kernel.disable_core_dumps);

  // Permissions
  setChk("perms_critical", p.permissions.fix_critical_perms);
  setChk("perms_suid",     p.permissions.fix_suid);
  setChk("perms_ww",       p.permissions.fix_world_writable);
  setChk("perms_orphaned", p.permissions.fix_orphaned);

  // Users
  setChk("users_lock_pw",    p.users.lock_passwordless);
  setChk("users_extra_root", p.users.fix_extra_roots);
  setChk("users_shadow",     p.users.fix_shadow);
  setChk("users_pw_policy",  p.users.password_policy);

  // Modules
  const allMods = ["bluetooth","joydev","soundcore","usb_storage",
                   "firewire","thunderbolt","cramfs","dccp","sctp","rds","tipc","hfs"];
  allMods.forEach(m => {
    const el = document.getElementById("mod_" + m);
    if (el) el.checked = p.blacklist_modules.includes(m);
  });

  // Firewall
  setChk("fw_enable", p.firewall.enable_ufw);
  setChk("fw_ssh",    p.firewall.allow_ssh);
  setChk("fw_http",   p.firewall.allow_http);
  setChk("fw_https",  p.firewall.allow_https);

  // Audit
  setChk("audit_auditd",   p.audit.enable_auditd);
  setChk("audit_sudo_log", p.audit.log_sudo);
  setChk("audit_coredump", p.audit.disable_coredump);
}

function setChk(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
