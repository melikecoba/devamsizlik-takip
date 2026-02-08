# 🏃‍♂️ KAÇTIM HOCAM

> **"Firari tespit edildi!"**

**KAÇTIM HOCAM**, üniversite öğrencilerinin korkulu rüyası olan devamsızlık takibini eğlenceli ve sosyal bir hale getiren web tabanlı bir uygulamadır. Sadece devamsızlık saymakla kalmaz, arkadaşlarınızla sosyalleşmenizi sağlar ve ders geçme hedeflerinizi hesaplar.


## 🌟 Özellikler

### 📚 Ders & Devamsızlık Yönetimi

* **Ders Ekleme:** Ders adı ve devamsızlık hakkı (limit) belirleyerek derslerinizi oluşturun.
* **Hızlı Takip:** Tek tıkla "Yok Yazıldım" veya "Story Attım" seçeneği.
* **Görsel Hafıza:** Devamsızlık yaparken (Story modunda) o anın fotoğrafını yükleyip anı biriktirme.
* **Akıllı Uyarılar:** Limitiniz azaldığında renkli uyarılar (Yeşil -> Sarı -> Kırmızı).
* **Sonsuz Hak:** Devamsızlık hakkı olmayan dersler için `∞` gösterimi.

### 🧮 Akıllı Not Hesaplama

* **Kişiselleştirilebilir Sistem:** Profilinizden okulunuzun vize/final etkileme oranlarını ve geçme notunu ayarlayın.
* **Hedef Hesaplama:** Vize notunuzu girin, sistem finalden **en az** kaç almanız gerektiğini hesaplasın.
* **Durum Analizi:** "Zaten geçiyorsun" veya "Büte kaldın" gibi anlık geri bildirimler.

### 🌍 Sosyal Akış (Feed)

* **Arkadaş Takibi:** Diğer öğrencileri aratın ve takip edin.
* **Ana Sayfa Akışı:** Arkadaşlarınızın hangi dersten "kaçtığını" veya "yok yazıldığını" görün.
* **Etkileşim:** Gönderileri beğenin (❤️) ve yorum yapın (💬).
* **Bildirimler:** Biri sizi takip ettiğinde veya etkileşim kurduğunda bildirim alın.

### 📱 Teknik Özellikler

* **Responsive Tasarım:** Hem masaüstü hem de mobil cihazlarda (App hissiyatı veren arayüz) sorunsuz çalışır.
* **PWA Uyumlu:** Telefondan tarayıcı üzerinden girilse bile mobil uygulama deneyimi sunar.

## 🛠️ Kullanılan Teknolojiler

Bu proje **Serverless** mimari kullanılarak geliştirilmiştir.

* **Frontend:**
* HTML5 & CSS3
* Bootstrap 5 (UI Framework)
* JavaScript (ES6+)


* **Backend & Database:**
* **Supabase:**
* **PostgreSQL:** Veritabanı yönetimi.
* **Auth:** E-posta/Şifre ile güvenli kullanıcı girişi.
* **Storage:** Profil resimleri ve anı fotoğrafları (Story) için dosya depolama.
* **Realtime:** Anlık veri akışı.





## 🗄️ Veritabanı Yapısı (Supabase)

Proje ilişkisel veritabanı yapısı üzerine kurulmuştur:

* `profiles`: Kullanıcı bilgileri, avatar, not sistemi ayarları.
* `lessons`: Kullanıcının dersleri ve limitleri.
* `logs`: Devamsızlık kayıtları (Fotoğraflı/Fotoğrafsız).
* `friendships`: Takipçi/Takip edilen ilişkisi.
* `likes` & `comments`: Sosyal etkileşimler.
* `notifications`: Bildirim sistemi.



## 📸 Ekran Görüntüleri

| Mobil Görünüm | Masaüstü Görünüm |
| --- | --- |
|  |  |

## 🔗 Canlı Demo

Projeyi canlı incelemek için: [Buraya Tıklayın]([https://www.google.com/search?q=https://melikecoba.github.io/devamsizlik-takip/](https://melikecoba.github.io/devamsizlik-takip/))

---

*Bu proje, üniversite hayatını biraz daha eğlenceli hale getirmek için geliştirilmiştir.* 🎓✨
