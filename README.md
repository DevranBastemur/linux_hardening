# Linux Hardening Script Generator

Sistem yoneticileri icin web tabanli, interaktif Linux sunucu sikistirma araci.

## Calistirma

```bash
cd hardening-tool
sudo python3 app.py
# Tarayicida: http://localhost:8080
```

## Ozellikler

- **3 Hazir Paket**: Temel Guvenlik / Agresif Sikistirma / Web Sunucusu
- **Canli Onizleme**: Secim yapildikca bash script aninda guncellenir
- **Sistem Taramasi**: Calistirilan makinenin SUID, world-writable, sahipsiz dosyalarini, parolasiz hesaplarini tarar
- **Syntax Highlight**: Terminal onizlemede renkli kod gorunumu
- **Disa Aktarma**: Panoya kopyala veya .sh olarak indir

## Dizin Yapisi

```
hardening-tool/
├── app.py                    # Python HTTP sunucusu + script uretici
├── static/
│   ├── css/style.css         # Ozel stiller
│   └── js/
│       ├── packages.js       # Hazir paket tanimlari
│       ├── scanner.js        # Sistem tarama API
│       ├── generator.js      # Script uretme + preview
│       └── ui.js             # DOM / accordion / toast
└── templates/
    ├── index.html            # Ana sayfa (partial'lardan derlenir)
    ├── footer.html           # Toast + JS linkleri
    └── partials/
        ├── header.html
        ├── packages.html
        ├── form_ssh.html
        ├── form_kernel.html
        ├── form_permissions.html
        ├── form_users.html
        ├── form_modules.html
        ├── form_firewall.html
        ├── form_audit.html
        ├── scan_results.html
        └── preview_panel.html
```

## Gereksinimler

- Python 3.6+
- sudo yetkisi (sistem taramasi icin)
- Kali Linux / Debian / Ubuntu
