// ============================================================
// UI / DOM ISLEMLERI
// ============================================================

// Paket secimi
function selectPackage(pkg, el) {
  document.querySelectorAll(".pkg-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");

  if (pkg === "none") {
    resetAll();
    return;
  }
  applyPackage(pkg);   // packages.js
  updatePreview();     // generator.js
}

// Tum formu sifirla
function resetAll() {
  document.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false);
  const tries = document.getElementById("ssh_max_tries");
  if (tries) tries.value = 3;
  updatePreview();
}

// Accordion ac/kapat
function toggleSection(id) {
  const body = document.getElementById(id);
  if (!body) return;
  body.classList.toggle("collapsed");
  // Ok ikonunu cevir
  const sectionId = id.replace("-body", "");
  const arrow = document.querySelector(`[data-section="${sectionId}"] .arrow-icon`);
  if (arrow) arrow.classList.toggle("rotate-180");
}

// Toast bildirimi
function showToast(msg, type = "success") {
  const toast    = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  const toastIcon= document.getElementById("toast-icon");

  const icons = {
    success: `<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>`,
    error:   `<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>`,
    warn:    `<svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
              </svg>`,
  };

  toastMsg.textContent = msg;
  if (toastIcon) toastIcon.innerHTML = icons[type] || icons.success;

  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// Sayfa yuklenince
document.addEventListener("DOMContentLoaded", () => {
  // Tum section'lari acik baslat
  document.querySelectorAll(".section-body").forEach(b => {
    b.classList.remove("collapsed");
  });

  // Scan results gizli baslat
  const scanSection = document.getElementById("scan-results-section");
  if (scanSection) scanSection.style.display = "none";

  // Ilk preview guncelle (bos gosterecek)
  updatePreview();

  console.log("[*] Hardening Tool hazir.");
});
