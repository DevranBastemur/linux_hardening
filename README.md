<div align="center">
  <h1>🛡️ Linux Hardening & Auditing Panel</h1>
  <p><b>Sistem Yöneticileri ve Blue Team Uzmanları İçin İnteraktif Sıkılaştırma Aracı</b></p>
  
  ![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat-square&logo=python)
  ![Linux](https://img.shields.io/badge/OS-Linux-yellow?style=flat-square&logo=linux)
  ![Security](https://img.shields.io/badge/Security-Blue_Team-success?style=flat-square&logo=security)
</div>

<br>

## 📖 Proje Hakkında

**Linux Hardening & Auditing Panel**, hedef Linux sistemlerindeki yapılandırma zafiyetlerini canlı olarak analiz eden ve tespit edilen bulgulara yönelik otomatik iyileştirme (remediation) betikleri üreten web tabanlı bir güvenlik aracıdır. 

Yüzeysel taramaların aksine, sistemin çekirdek ayarlarına (Kernel), ağ filtrelemesine (UFW) ve izleme mekanizmalarına (Auditd) doğrudan müdahale edebilme yeteneğine sahiptir. Saniyeler içinde sisteminizin risk haritasını çıkarır ve size özel bir bash betiği derler.

## ✨ Temel Özellikler

* 🔍 **Canlı Zafiyet Analizi:** * SUID/SGID yetkisine sahip kritik dosyaların tespiti.
  * Sahipsiz (Orphaned) ve World-Writable dosyaların analizi.
  * Parolasız veya UİD 0 (Root) haklarına sahip gizli hesapların denetimi.
* 🛡️ **Dinamik Güvenlik Profilleri:**
  * 🟢 **Temel Güvenlik:** Sistem işleyişini bozmadan uygulanan Kernel ve SSH sıkılaştırmaları.
  * 🔴 **Agresif Sıkıştırma:** Kritik sunucular için katı erişim kontrolleri ve modül karalisteleri (Zero-Trust yaklaşımı).
  * 🌐 **Web Sunucusu:** HTTP/HTTPS yayın yapan sunuculara özel ağ filtreleme kuralları.
* ⚙️ **Modüler Müdahale:** İhtiyaca göre UFW kurallarını yazma, Auditd loglamasını aktifleştirme veya şüpheli SUID yetkilerini geri alma gibi işlemleri tek tek (granular) seçebilme imkanı.
* 📜 **Şeffaf Betik Önizlemesi (Dry-Run):** Arayüz üzerinden seçilen tüm aksiyonlar, arka planda anlık olarak bir `.sh` dosyasına dönüştürülür. Kullanıcı, sisteminde neyin değişeceğini satır satır görerek uygulayabilir.

---

## 🛠️ Gereksinimler

* **İşletim Sistemi:** Debian/Ubuntu veya Kali Linux tabanlı dağıtımlar
* **Dil:** Python 3.x
* **Yetki:** `sudo` (Sistem çekirdeği ve servis yapılandırmaları için root yetkileri zorunludur)

---
<img width="607" height="160" alt="image" src="https://github.com/user-attachments/assets/75b217ae-6f54-4609-a986-ebde56ff2163" />

başlatıyorsunuz size bir web te çalıştırmanız için link veriyor.

<img width="1024" height="442" alt="image" src="https://github.com/user-attachments/assets/36e00c47-31f6-41a7-a055-2ee14b0d8a78" />

ara yüzün sağ üstünden tarama başlatabiliyorsunuz sisteminizi taradıktan sonra size 3 farklı öneride bulunuyor öneriler arasında kendinize uygun olanı seçiyorsunuz alt kısımdanda istediğiniz şekilde özelleştirebiliyorsunuz. en sonda ister kopyalayın isterseniz .sh dosyasını inidirn istersenizde direk tek tuşlaya uygulayabilirsiniz.




