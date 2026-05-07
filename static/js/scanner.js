// ============================================================
// SISTEM TARAMA - API CAGRILARI
// ============================================================

let scanData = {};

async function startScan() {
  const btn    = document.getElementById("btn-scan");
  const status = document.getElementById("scan-status");

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner">&#9696;</span> Taranıyor...`;
  status.textContent = "Sistem taranıyor, lutfen bekleyin...";
  status.className = "text-xs text-yellow-400";

  try {
    const res  = await fetch("/api/scan");
    const data = await res.json();
    scanData   = data;

    renderScanResults(data);
    status.textContent = "Tarama tamamlandi ✓";
    status.className   = "text-xs text-green-400";
    showToast("Sistem taramasi tamamlandi!", "success");
  } catch (err) {
    status.textContent = "Tarama basarisiz: " + err.message;
    status.className   = "text-xs text-red-400";
    showToast("Tarama hatasi: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>
      Sistemi Tara`;
  }
}

function renderScanResults(data) {
  const section = document.getElementById("scan-results-section");
  const content = document.getElementById("scan-content");
  section.style.display = "block";

  const blocks = [
    {
      key:   "suid_files",
      title: "Supheli SUID Dosyalari",
      color: "red",
      desc:  "Sistem varsayilanlari gizlendi. Secilenlerden SUID biti kaldirilacak.",
      formKey: "suid_files",
      chkId:   "perms_suid",
    },
    {
      key:   "world_writable",
      title: "World-Writable Dosya/Dizinler",
      color: "orange",
      desc:  "Herkes tarafindan yazilabilir. Secilenler chmod o-w ile duzeltilecek.",
      formKey: "world_writable_files",
      chkId:   "perms_ww",
    },
    {
      key:   "orphaned",
      title: "Sahipsiz (Orphaned) Dosyalar",
      color: "yellow",
      desc:  "Sahibi silinmis hesaplara ait. Secilenler root'a atanacak.",
      formKey: "orphaned_files",
      chkId:   "perms_orphaned",
    },
    {
      key:   "passwordless",
      title: "Parolasiz Hesaplar",
      color: "red",
      desc:  "Bu hesaplar sifresiz giris yapabilir! Secilenler kilitlenecek.",
      formKey: "passwordless_users",
      chkId:   "users_lock_pw",
    },
    {
      key:   "extra_roots",
      title: "UID 0 (Root Yetkili) Ekstra Hesaplar",
      color: "red",
      desc:  "Root disinda UID 0 olan hesaplar kritik guvenlik riskidir!",
      formKey: "extra_root_users",
      chkId:   "users_extra_root",
    },
    {
      key:   "non_shadowed",
      title: "Shadow Olmayan Hesaplar",
      color: "yellow",
      desc:  "Parolasi /etc/passwd icinde kalan hesaplar. pwconv ile duzeltilecek.",
      formKey: null,
      chkId:   "users_shadow",
    },
    {
      key:   "open_ports",
      title: "Acik Portlar",
      color: "blue",
      desc:  "Sistemde dinleyen portlar (bilgi amacli).",
      formKey: null,
      chkId:   null,
    },
    {
      key:   "active_services",
      title: "Calisan Servisler",
      color: "blue",
      desc:  "Aktif systemd servisleri (bilgi amacli).",
      formKey: null,
      chkId:   null,
    },
  ];

  const colorMap = {
    red:    { badge: "bg-red-900 text-red-300",    dot: "bg-red-400",    item: "text-red-300" },
    orange: { badge: "bg-orange-900 text-orange-300", dot: "bg-orange-400", item: "text-orange-300" },
    yellow: { badge: "bg-yellow-900 text-yellow-300", dot: "bg-yellow-400", item: "text-yellow-300" },
    blue:   { badge: "bg-blue-900 text-blue-300",  dot: "bg-blue-400",   item: "text-blue-300" },
  };

  content.innerHTML = "";

  blocks.forEach(block => {
    const items = data[block.key] || [];
    const c     = colorMap[block.color];
    const count = items.length;

    const div = document.createElement("div");
    div.className = "mb-4";
    div.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <div class="w-2 h-2 rounded-full ${c.dot} ${count > 0 ? 'pulse-dot' : ''}"></div>
        <span class="text-sm font-semibold text-white">${block.title}</span>
        <span class="badge ${c.badge}">${count} bulgu</span>
      </div>
      <p class="text-xs text-slate-500 mb-2 ml-4">${block.desc}</p>
      <div class="ml-4 space-y-0.5" id="scan-list-${block.key}"></div>
    `;
    content.appendChild(div);

    const list = document.getElementById("scan-list-" + block.key);

    if (count === 0) {
      list.innerHTML = `<span class="text-xs text-green-500">✓ Temiz</span>`;
      return;
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "scan-file-item";

      if (block.formKey && block.chkId) {
        row.innerHTML = `
          <input type="checkbox" class="scan-check w-3.5 h-3.5"
            data-form-key="${block.formKey}"
            data-chk-id="${block.chkId}"
            value="${escHtml(item)}"
            onchange="onScanCheck(this)">
          <span>${escHtml(item)}</span>`;
      } else {
        row.innerHTML = `<span class="${c.item}">▸</span><span>${escHtml(item)}</span>`;
      }
      list.appendChild(row);
    });
  });

  // Tarama sonrasi preview guncelle
  updatePreview();
}

// Tarama checkboxu degisince ilgili ana checkbox'i da isaretle
function onScanCheck(el) {
  const chkId = el.dataset.chkId;
  if (chkId) {
    const master = document.getElementById(chkId);
    if (master && !master.checked) master.checked = true;
  }
  updatePreview();
}

// Secili tarama dosyalarini topla
function getCheckedScanItems(formKey) {
  return Array.from(
    document.querySelectorAll(`.scan-check[data-form-key="${formKey}"]:checked`)
  ).map(el => el.value);
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
