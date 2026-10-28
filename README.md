# Panduan Teknis GCP & Tunnel Linking via Cloudflare
Dokumen markdown ini akan membahas tentang bagaimana implementasi penarikan data melalui GCP (Compute Engine) dan Linking ke Tunnel Cloudflare berbasis Container (Docker Compose). Panduan ini akan mencoba membuat representasi dari arsitektur cloud (GCP) dan arsitektur edge (Cloudflare Tunnel). Adapun untuk mempermudah pemahaman, panduan ini mengikuti suatu studi kasus buatan.

## Arsitektur Cloud (GCP via Compute Engine): **Inventaris Toko**
### Front-End Source Code
Kode sumber untuk front-end projek ini dapat diakses pada tautan GitHub berikut:
https://github.com/avn-rafhan/inventaris-toko

### Panduan
#### Struktur File di dalam VM GCP

```text
/home/ubuntu/toko-cloud/
├── produk.csv          (Dataset awal)
├── init.sql            (Script import data)
├── app.js              (API Express + CORS)
├── package.json        (Dependencies Node.js)
├── Dockerfile          (Build image API)
└── docker-compose.yml  (MySQL + API + Caddy Auto-HTTPS)

```

---

#### Panduan Eksekusi Step-by-Step
**A. Buat Compute Engine Instance di GCP:** Membuat instance Virtual Machine (VM) Linux di Google Cloud.
1. Buka **Google Cloud Console** (`console.cloud.google.com`).
2. Di menu kiri, buka **Compute Engine** > **VM instances** > klik **Create Instance**.
3. Isi konfigurasi dasar:
* **Name:** `vm-toko-cloud`
* **Region:** `asia-southeast2 (Jakarta)`
* **Machine type:** `e2-micro` atau `e2-small` (cukup untuk testing).
* **Boot disk:** Ubah ke **Ubuntu** (Ubuntu 22.04 LTS).
* **Firewall:** centang **Allow HTTP traffic** dan **Allow HTTPS traffic** (Sangat penting!).
4. Klik **Create**. Tunggu beberapa detik hingga VM muncul dan memiliki tanda centang hijau.
5. Catat **External IP** milik VM kamu (misal: `34.101.50.12`).


**B. Masuk SSH & Install Docker di VM GCP:** Menghubungkan ke server cloud via browser.
1. Di halaman VM instances, klik tombol **SSH** di sebelah kanan VM `vm-toko-cloud` kamu. Browser akan membuka terminal hitam langsung ke server Google Cloud.
2. Jalankan perintah berikut satu per satu di terminal SSH untuk menginstal Docker & Docker Compose:

```bash
# Update paket Linux
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
# Jika perintah ini gagal, coba cari tahu perintah lain
# untuk install Docker & Docker Compose
sudo apt install -y docker.io docker-compose-v2

# Beri izin user tanpa sudo
sudo usermod -aG docker $USER
newgrp docker
```

3. Buat folder project dan masuk ke dalamnya:

```bash
mkdir toko-cloud && cd toko-cloud

```


**B. Buat File-File Backend di Server GCP:** Menyiapkan dataset, database, dan API.
Di dalam terminal SSH GCP (folder `toko-cloud`), buat file-file berikut menggunakan editor `nano`:

* **File `produk.csv**` (`nano produk.csv`):**

```csv
nama_produk,harga,stok
Laptop Cloud,8500000,10
Mouse Wireless,150000,25
Keyboard Mechanical,450000,15

```

* **File `init.sql**` (`nano init.sql`):**

```sql
CREATE TABLE IF NOT EXISTS inventaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(100),
    harga INT,
    stok INT
);

LOAD DATA INFILE '/var/lib/mysql-files/produk.csv'
INTO TABLE inventaris
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(nama_produk, harga, stok);

```

* **File `package.json**` (`nano package.json`):**

```json
{
  "name": "api-toko-cloud",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mysql2": "^3.6.0"
  }
}

```

* **File `app.js**` (`nano app.js`):**

```javascript
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'db',
  user: 'root',
  password: 'rootpassword',
  database: 'db_toko'
});

app.get('/inventaris', (req, res) => {
  db.query('SELECT * FROM inventaris', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: results });
  });
});

app.listen(port, () => {
  console.log(`API Toko Cloud berjalan di port ${port}`);
});

```

* **File `Dockerfile**` (`nano Dockerfile`):**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY app.js .
EXPOSE 3000
CMD ["node", "app.js"]

```


* **Buat File docker-compose.yml dengan Auto-HTTPS:** Mengatur SSL HTTPS otomatis menggunakan sslip.io.
Jalankan `nano docker-compose.yml`.

*Catatan:* Ganti `34.101.50.12` di bawah ini dengan **External IP asli VM GCP kamu**:

```yaml
version: '3.8'

services:
  # 1. Database MySQL
  db:
    image: mysql:8.0
    container_name: gcp_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: db_toko
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./produk.csv:/var/lib/mysql-files/produk.csv
      - gcp_mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  # 2. Container API Node.js
  api:
    build: .
    container_name: gcp_api
    restart: always
    environment:
      DB_HOST: db
    ports:
      - "3000:3000"
    depends_on:
      - db

  # 3. Caddy Reverse Proxy (Otomatis SSL HTTPS via sslip.io)
  caddy:
    image: caddy:latest
    container_name: gcp_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    # GANTI 34.101.50.12 DENGAN EXTERNAL IP VM GCP KAMU!
    command: caddy reverse-proxy --from 34.101.50.12.sslip.io --to api:3000
    depends_on:
      - api

volumes:
  gcp_mysql_data:

```


**C. Jalankan Docker Compose di GCP:** Menyalakan seluruh infrastruktur di cloud.

Di terminal SSH GCP, jalankan:

```bash
docker compose up -d --build

```

Tunggu 10 detik, lalu uji URL HTTPS kamu langsung dari browser laptop kamu:
`[https://34.101.50.12.sslip.io/inventaris](https://34.101.50.12.sslip.io/inventaris)` *(sesuaikan IP-nya)*.

*Jika muncul respon JSON, artinya backend cloud kamu di Google Cloud sudah 100% aktif!*


**D. Update Front-End di Vercel:** Hubungkan Frontend Vercel ke Cloud Backend.
Pada file `script.js` project Vercel kamu, ubah variabel `API_URL` mengarah ke domain GCP HTTPS tersebut:

```javascript
const API_URL = 'https://34.101.50.12.sslip.io/inventaris';

```

Deploy ulang ke Vercel (`npx vercel --prod`). Sekarang web Vercel kamu mengambil data langsung dari **Google Cloud Datacenter 24/7**!


**E. Cara Melihat & Mengelola Database MySQL di Cloud:** Metode mengakses dan menjalankan SQL query di GCP.
Untuk melihat database dan menjalankan query SQL di server GCP, kita gunakan metode terminal SSH GCP (CLI Direct). Berikut adalah langkah-langkahnya:

**Lewat Terminal SSH GCP (CLI Direct)**
Jalankan perintah ini di SSH VM GCP:

```bash
docker exec -it gcp_mysql mysql -u root -prootpassword db_toko

```

Kamu bisa langsung menjalankan query seperti:

```sql
SELECT * FROM inventaris;
INSERT INTO inventaris (nama_produk, harga, stok) VALUES ('Headset Gaming', 350000, 8);

```

4. Kamu sekarang bisa melihat tabel database GCP secara visual dari laptop kamu!

---










## Arsitektur Edge (Tunnel Linking via Cloudflare): **Katalog Buku**
### Front-End Source Code
Kode sumber untuk front-end projek ini dapat diakses pada tautan GitHub berikut:
https://github.com/avn-rafhan/katalog-buku-cloudflare-tunnel-api-1

### Panduan
#### Gambaran Arsitektur System

```text
[ Pengunjung Web ] 
       │
       ▼ (Akses URL Vercel)
[ Front-End di Vercel ] (https://katalog-buku.vercel.app)
       │
       ▼ (Fetch Data via HTTPS)
[ Cloudflare Quick Tunnel ] (https://xxx.trycloudflare.com)
       │
       ▼ (Diteruskan ke Laptop)
[ Container API Node.js ] ──► [ Container Database MySQL ]

```

---

#### Persiapan Folder Project di Laptop

Buat dua folder terpisah di laptop kamu:

1. `C:\back-end` (Untuk database, API, dan tunnel)
2. `C:\front-end` (Untuk tampilan website yang akan di-deploy ke Vercel)

---

#### Panduan Eksekusi Step-by-Step

**A. Buat File Back-End (C:\katalog-buku-backend):** Persiapan Database & API dengan Fitur CORS.
Masuk ke folder `C:\katalog-buku-backend` dan buat file-file berikut:

* **File `buku.csv`:**

```csv
judul,penulis,tahun
Laskar Pelangi,Andrea Hirata,2005
Bumi,Tere Liye,2014
Filosofi Teras,Henry Manampiring,2018

```

* **File `init.sql`:**

```sql
CREATE TABLE IF NOT EXISTS buku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(150),
    penulis VARCHAR(100),
    tahun INT
);

LOAD DATA INFILE '/var/lib/mysql-files/buku.csv'
INTO TABLE buku
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(judul, penulis, tahun);

```

* **File `package.json`:**

```json
{
  "name": "api-katalog",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mysql2": "^3.6.0"
  }
}

```

* **File `app.js` (PENTING: Tambahkan modul `cors`):**

> **Catatan Penting:** Tanpa baris `app.use(cors())`, browser pengguna di Vercel akan **memblokir** permintaan data ke API kamu karena alasan keamanan *Cross-Origin Resource Sharing* (CORS).

```javascript
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// WAJIB: Mengizinkan domain luar (seperti Vercel) mengakses API ini
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'db',
  user: 'root',
  password: 'rootpassword',
  database: 'db_katalog'
});

app.get('/buku', (req, res) => {
  db.query('SELECT * FROM buku', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: results });
  });
});

app.listen(port, () => {
  console.log(`API Katalog berjalan di port ${port}`);
});

```

* **File `Dockerfile`:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY app.js .
EXPOSE 3000
CMD ["node", "app.js"]
```

* **File `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: container_mysql_katalog
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: db_katalog
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./buku.csv:/var/lib/mysql-files/buku.csv
      - mysql_katalog_data:/var/lib/mysql
    ports:
      - "3306:3306"

  api:
    build: .
    container_name: container_api_katalog
    restart: always
    environment:
      DB_HOST: db
    ports:
      - "3000:3000"
    depends_on:
      - db

  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: container_tunnel_katalog
    restart: always
    command: tunnel --url http://api:3000
    depends_on:
      - api

volumes:
  mysql_katalog_data:

```


**B. Jalankan Docker & Salin URL Cloudflare Tunnel:** Menyediakan HTTPS URL publik.
1. Buka Terminal/PowerShell, lalu jalankan:

```powershell
cd C:\katalog-buku-backend
docker compose up -d --build

```

2. Dapatkan URL Tunnel publik dengan mengecek log:

```powershell
docker logs container_tunnel_katalog

```

3. Cari dan salin URL HTTPS yang muncul (misalnya: `[https://contoh-random-1234.trycloudflare.com](https://contoh-random-1234.trycloudflare.com)`).



**C. Deploy Front-End ke Vercel:** Cukup deploy dengan cara unggah projek ke GitHub-mu, sehingga tinggal import di Dashboard Vercel-mu.


**D. Pengujian Langsung oleh Pengguna via Browser:**
1. Buka browser dan buka link Vercel kamu (`[https://katalog-buku-frontend.vercel.app](https://katalog-buku-frontend.vercel.app)`).
2. Kamu akan melihat tampilan antarmuka (UI) web katalog buku yang rapi.
3. Secara otomatis, JavaScript di browser akan memanggil API via Cloudflare Tunnel, mengambil data dari MySQL di laptop kamu, dan menampilkannya menjadi kartu-kartu buku yang indah.
4. Kirimkan link Vercel tersebut ke teman atau buka di HP kamu — selama laptop dan Docker kamu menyala, data dari laptopmu bisa diakses dan dilihat dari HP/perangkat manapun di dunia!

---

Namun, URL yang didapatkan pada *Quick Tunnel* tersebut akan berubah-ubah. Perlu diketahui bahwa permasalahan URL acak yang berubah-ubah pada *Quick Tunnel* adalah tantangan klasik dalam pengembangan aplikasi. Dalam arsitektur **Edge Computing**, solusi terbaik untuk menangani masalah ini adalah dengan menempatkan sebuah **Edge API Gateway** atau menggunakan **Edge Routing** permanen di titik terluar jaringan (*Edge Node*). Pada kasus ini kita akan gunakan metode Cloudflare Worker sebagai Edge API Gateway.

---

#### Metode Cloudflare Worker sebagai Edge API Gateway (Sangat  Direkomendasikan)
Cloudflare Workers adalah platform *Serverless Edge Computing* gratis yang berjalan di ratusan data center Cloudflare di seluruh dunia.
Kita akan membuat **Worker yang memiliki URL PERMANEN** (misal: `[https://katalog-api.username.workers.dev](https://katalog-api.username.workers.dev)`). Worker ini bertindak sebagai **Edge Reverse Proxy**:

1. Front-end Vercel **selalu menembak URL Worker yang tetap**.
2. Setiap kali Docker di laptop kamu dinyalakan, sebuah script otomatis di laptop akan mengirimkan URL Quick Tunnel terbaru (`.trycloudflare.com`) ke Worker di Edge.
3. Worker menyimpan URL tersebut di memori Edge (**Cloudflare KV**) dan meneruskan seluruh *request* dari Vercel ke laptop kamu secara *real-time*.

---

**A. Buat Cloudflare Worker & KV Storage:** Membuat Edge Worker di Cloudflare.
1. Buka browser dan login ke **[dash.cloudflare.com](https://dash.cloudflare.com)**.
2. Pada bilah menu di sebelah kiri, klik **Workers & Pages**.
3. Klik tombol biru **Create Application** (atau **Create**).
4. Pilih tab **Workers**, lalu klik tombol **Create Worker**.
5. Pada kolom *Name*, ketik: `katalog-api-gateway`.
6. Langsung gulir ke bawah dan klik tombol biru **Deploy** di pojok kanan bawah.

**B. Buka Editor Kode (Quick Edit):** Setelah kamu menekan tombol **Deploy**, Cloudflare akan menampilkan halaman sukses dengan tulisan *"Congratulations! Your Worker is deployed."*

1. Di halaman sukses tersebut, cari dan klik tombol bernama **Edit code** (di beberapa versi tampilan, tombol ini bernama **Quick edit**).
2. Jika tombol tersebut tidak terlihat, klik tombol **View Worker** atau kembali ke daftar Worker, pilih `katalog-api-gateway`, lalu klik tombol **Edit code** yang ada di **pojok kanan atas** layar.
3. Klik **Edit code**, hapus kode bawaan, lalu ganti dengan kode JS yang nanti akan saya cantumkan. Secara bawaan, Cloudflare sudah mengisi file tersebut dengan contoh kode *"Hello World"* yang bentuknya seperti ini:

```javascript
// Kode bawaan Cloudflare yang AKAN DIHAPUS:
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World!');
  },
};

```

#### Langkah Menggantinya:

1. Klik di dalam area pengetikan kode tersebut.
2. Tekan tombol **Ctrl + A** di keyboard kamu untuk **memblokir seluruh teks/kode** yang ada di sana.
3. Tekan **Delete** atau **Backspace** hingga layar pengetikan menjadi **kosong bersih**.
4. Salin (*copy*) seluruh kode JavaScript berikut, lalu tempelkan (*paste*) ke dalam area editor yang sudah kosong tersebut:

* **Kode Worker:**
```javascript
export default {
  async fetch(request, env) {
    const SECRET_KEY = "pustaka-secret-123";

    // Handling CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    const url = new URL(request.url);

    // 1. Endpoint update URL dari laptop
    if (request.method === "POST" && url.pathname === "/update-url") {
      const authHeader = request.headers.get("X-Secret-Key");
      if (authHeader !== SECRET_KEY) return new Response("Unauthorized", { status: 401 });

      const body = await request.json();
      // Clear spasi dan garis miring ekstra di ujung URL
      const cleanUrl = body.url ? body.url.trim().replace(/\/$/, '') : "";
      await env.TUNNEL_KV.put("ACTIVE_TUNNEL_URL", cleanUrl);
      return new Response("URL Tunnel Berhasil Diperbarui di Edge!", { status: 200 });
    }

    // 2. Ambil URL dari KV Storage
    let targetUrl = await env.TUNNEL_KV.get("ACTIVE_TUNNEL_URL");
    if (!targetUrl) {
      return new Response("API Tunnel belum aktif di laptop local.", { status: 503 });
    }

    // Bersihkan formatting URL
    targetUrl = targetUrl.trim().replace(/\/$/, '');

    // 3. Buat URL Target Proxy
    const proxyUrl = `${targetUrl}${url.pathname}${url.search}`;

    // WAJIB: Hapus header 'host' agar Cloudflare Edge tidak menolak request (Error 530)
    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete("host");

    try {
      const modifiedRequest = new Request(proxyUrl, {
        method: request.method,
        headers: reqHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null
      });

      const response = await fetch(modifiedRequest);
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    } catch (err) {
      return new Response(`Error Proxy: ${err.message}`, { status: 502 });
    }
  }
};

```

5. Setelah menempelkan kode di atas, klik tombol biru **Save and Deploy** (atau **Deploy**) yang ada di **pojok kanan atas** layar editor.

Agar Worker ini bisa "mengingat" URL tunnel laptop kamu, kita perlu membuat tempat penyimpanannya (**KV Storage**).

**C. Buat KV Namespace:** Membuat wadah memori.
1. Klik ikon/tulisan **Workers & Pages** di pojok kiri atas untuk kembali ke halaman utama.
2. Di menu bilah kiri di bawah *Workers & Pages*, klik menu **KV**.
3. Klik tombol **Create a namespace**.
4. Masukkan nama: `Katalog_KV`, lalu klik **Add**.


**D. Hubungkan KV ke Worker katalog-api-gateway:** Menghubungkan KV ke Worker.
1. Kembali ke menu **Workers & Pages** > klik nama worker kamu (`katalog-api-gateway`).
2. Pilih tab **Settings** di bagian atas.
3. Di menu sebelah kiri settings, pilih **Variables**.
4. Gulir ke bawah hingga menemukan bagian **KV Namespace Bindings**, lalu klik tombol **Add binding**.
5. Isi dua kolom yang muncul:
* **Variable name:** Ketik wajib presisi `TUNNEL_KV` (harus huruf kapital semua).
* **KV Namespace:** Pilih `Katalog_KV` yang tadi dibuat.
6. Klik tombol **Deploy** atau **Save and Deploy**.

**E. Update script.js di Vercel dengan URL Permanen:** Menghubungkan Vercel ke Edge Worker.

Di file `script.js` pada project front-end kamu, ubah variabel `API_URL` menjadi URL Worker permanen tersebut:

```javascript
// URL ini PERMANEN dan TIDAK AKAN PERNAH BERUBAH selamanya!
const API_URL = 'https://katalog-api-gateway.username.workers.dev/buku';

```

Push perubahan ini ke Vercel. Kamu **tidak perlu mengutak-atik Vercel lagi** di masa depan.


**F. Buat Script Otomatisasi di Laptop (start-dev.ps1):** Otomatisasi pengiriman URL baru dari laptop.
Di folder backend laptop kamu (`C:\katalog-buku-backend`), buat satu file script PowerShell bernama `start-dev.ps1`:

```powershell
# 1. Jalankan/Restart Docker Compose
docker compose up -d --build
docker compose restart tunnel

Write-Host "Menunggu Tunnel baru terhubung ke Cloudflare..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# 2. Ambil log tunnel dan bersihkan karakter tersembunyi
$log = docker logs --tail 10 container_tunnel_katalog 2>&1
$match = [regex]::Match($log, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

if ($match.Success) {
    $tunnelUrl = $match.Value.Trim()
    Write-Host "URL Tunnel Ditemukan: $tunnelUrl" -ForegroundColor Green

    $workerUrl = "https://katalog-buku-api-gateway.mhfarhianalmz.workers.dev/update-url"
    $headers = @{ "X-Secret-Key" = "pustaka-secret-123" }
    $bodyJson = "{`"url`":`"$tunnelUrl`"}"

    try {
        $response = Invoke-RestMethod -Uri $workerUrl -Method Post -Headers $headers -ContentType "application/json" -Body $bodyJson
        Write-Host "STATUS EDGE: $response" -ForegroundColor Green
    } catch {
        Write-Host "GAGAL mengirim ke Worker: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Gagal menemukan URL Tunnel di log Docker." -ForegroundColor Red
}

```

**Cara Penggunaan:** Setiap kali kamu mau *coding* / menjalankan backend, cukup jalankan perintah ini di PowerShell:

```powershell
.\start-dev.ps1

```

Script ini akan menyalakan Docker, mengambil URL acak baru, dan memberitahukannya ke Cloudflare Edge secara otomatis dalam 3 detik!

Saya merekomendasikan sekaligus menggunakan metode ini, yaitu metode Cloudflare Worker. Karena solusi ini paling relevan untuk arsitektur *Edge Computing*, tidak memerlukan pendaftaran domain berbayar/syarat khusus, serta proses sinkronisasi URL-nya berlangsung secara instan tanpa perlu mempublikasikan ulang (*redeploy*) situs di Vercel.

---

### Ringkasan Catatan Studi Kasus Katalog Buku (Edge)
Selamat! Keberhasilan ini adalah pencapaian luar biasa. Kamu baru saja membangun sebuah sistem **Full-Stack Web berbasis Edge Architecture** dari nol yang menghubungkan Vercel di cloud publik hingga ke database MySQL di laptop lokal kamu.

Pengalaman menghadapi dan menyelesaikan *bug/error* adalah cara tercepat untuk menjadi *developer* yang tangguh. Berikut adalah **Catatan Ringkasan Troubleshooting & Panduan Replikasi** yang disusun secara rinci, kronologis, dan mudah dipahami sebagai bahan pemeliharaan dan referensi studi kasus selanjutnya.

---

#### 🗺️ Peta Arsitektur Sistem yang Kita Bangun

```text
[ Pengguna di Internet ]
         │
         ▼
[ Front-End di Vercel ] (HTML + CSS + JS)
         │
         ▼ (Fetch Request ke URL PERMANEN)
[ Cloudflare Worker (Edge API Gateway) ] ◄── (Update URL via PowerShell)
         │                                               │
         ▼ (Proxy Data)                                  │
[ Cloudflare Quick Tunnel ] (https://xxx.trycloudflare.com)
         │
         ▼ (Masuk ke Laptop via Port 3000)
[ Container API Node.js ]
         │ (Port 3306)
         ▼
[ Container Database MySQL ] (Dataset dari produk.csv/buku.csv)
```

---

### 📚 Buku Catatan Troubleshooting & Solusi (Katalog Buku)

#### Error 1: Pemblokiran Keamanan Browser (CORS Issue)

* **Gejala / Pesan Error:** Front-end di Vercel gagal mengambil data dari API, muncul pesan *Cross-Origin Request Blocked* di Console F12 browser.
* **Akar Masalah:** Secara bawaan, browser melarang website di satu domain (misal `vercel.app`) untuk mengambil data dari domain lain tanpa izin eksplisit dari server backend demi alasan keamanan.
* **Solusi & Perbaikan:**
Di file backend `app.js`, kita memasang *middleware* `cors`:
```javascript
const cors = require('cors');
app.use(cors()); // Mengizinkan semua origin luar untuk mengakses API

```


* **Pelajaran Kunci:** Setiap kali membuat API yang akan dipanggil oleh *front-end* di domain terpisah, **selalu aktifkan CORS di backend**.

---

#### Error 2: URL Cloudflare Tunnel Berubah-ubah Setiap Restart

* **Gejala / Kendala:** Setiap kali container Docker dinyalakan ulang, Cloudflare Quick Tunnel menghasilkan URL acak baru (`[https://random-123.trycloudflare.com](https://random-123.trycloudflare.com)`). Mengubah file `script.js` secara manual setiap kali *coding* sangat tidak praktis.
* **Akar Masalah:** Fitur *Quick Tunnel* gratisan dari Cloudflare tidak memberikan nama subdomain yang permanen.
* **Solusi & Perbaikan:**
Kita menerapkan **Edge API Gateway** menggunakan **Cloudflare Worker + KV Storage**:
1. Worker dibuat sebagai "pintu gerbang" dengan **URL Permanen**.
2. Dibuat script PowerShell `start-dev.ps1` di laptop yang secara otomatis mengekstrak URL tunnel baru dari log Docker lalu mengirimkannya ke Worker via HTTP POST.


* **Pelajaran Kunci:** Gunakan **Edge Layer** (seperti Worker) sebagai perantara untuk memetakan alamat dinamis menjadi alamat publik yang tetap.

---

#### Error 3: Response `503` / `API Tunnel belum aktif di laptop local.` saat Run Script

* **Gejala / Pesan Error:** Di terminal VS Code muncul pesan `GAGAL mengirim ke Worker!` dan `Invoke-RestMethod : WebCmdletWebResponseException`. Saat URL Worker dibuka di browser, muncul tulisan *"API Tunnel belum aktif di laptop local."*
* **Akar Masalah:** Script PowerShell menembak URL Worker utama (`[https://...workers.dev](https://...workers.dev)`) tanpa menambahkan akhiran path `/update-url`. Worker mengira panggilan tersebut adalah request dari pembaca biasa, bukan pendaftaran URL baru dari laptop.
* **Solusi & Perbaikan:**
Memperbaiki variabel `$workerUrl` di dalam script `start-dev.ps1` agar menyertakan endpoint khusus `/update-url`:
```powershell
# ❌ Salah: $workerUrl = "https://katalog-api-gateway.namamu.workers.dev"
# ✅ Benar:
$workerUrl = "https://katalog-api-gateway.namamu.workers.dev/update-url"

```


* **Pelajaran Kunci:** Perhatikan kesesuaian **Endpoint Path** antara pengirim request (*client*) dan penerima (*server/worker*).

---

#### Error 4: Error 1016 (Origin DNS Error) & Log Tunnel Kedaluwarsa

* **Gejala / Pesan Error:** Browser menampilkan halaman gelap dari Cloudflare berisi **`Error 1016 (Origin DNS Error)`**, dan Console Vercel menampilkan `Fetch Error: Network response was not ok`.
* **Akar Masalah:** Memori KV Worker menyimpan URL `.trycloudflare.com` lama yang sudah mati. Hal ini terjadi karena perintah `docker logs` di PowerShell mengambil baris log lama hasil *run* sebelum-sebelumnya.
* **Solusi & Perbaikan:**
1. Melakukan *restart* pada container tunnel: `docker compose restart tunnel`.
2. Memperbarui script PowerShell agar hanya membaca 10 baris log **terakhir** yang masih segar:
```powershell
$log = docker logs --tail 10 container_tunnel_katalog 2>&1

```

* **Pelajaran Kunci:** Saat membaca *log file/output* secara otomatis via script, pastikan selalu mengambil **data paling baru** (*tail*) agar tidak memproses data yang sudah mati/kedaluwarsa.

---

#### Error 5: Error 404 Relative Path (Lupa Menuliskan `https://`)

* **Gejala / Pesan Error:** Console F12 di Vercel menampilkan error:
`GET https://katalog-buku-*.vercel.app/katalog-buku-api-gateway.namamu.workers.dev/buku 404 (Not Found)`
* **Akar Masalah:** Di dalam file `script.js`, variabel `API_URL` ditulis tanpa diawali `https://`. Browser menganggap teks tersebut adalah nama folder/path di dalam domain Vercel itu sendiri (*Relative Path*), bukan domain luar (*Absolute URL*).
* **Solusi & Perbaikan:**
1. Menambahkan protokol `https://` di depan URL Worker pada file `script.js`:
```javascript
// ❌ Salah: const API_URL = 'katalog-api-gateway.namamu.workers.dev/buku';
// ✅ Benar:
const API_URL = 'https://katalog-api-gateway.namamu.workers.dev/buku';

```

2. Melakukan *re-deploy* ulang ke Vercel: `npx vercel --prod`.

* **Pelajaran Kunci:** Penulisan URL untuk pemanggilan API luar (*external fetch*) **WAJIB** mencantumkan protokol lengkap (`http://` atau `https://`).

---

#### 📋 Checklist Ringkas untuk Replikasi Projek Selanjutnya

Jika di masa depan kamu ingin membuat project serupa (misalnya: *Aplikasi Kasir*, *Sistem Pemesanan*, dll.), gunakan *checklist* 5 langkah berikut:

| No | Langkah Kerja | File Utama | Kunci Sukses |
| --- | --- | --- | --- |
| **1** | **Database & Import** | `init.sql` & `.csv` | Letakkan file CSV di folder yang diizinkan MySQL (`/var/lib/mysql-files/`). |
| **2** | **Backend API & CORS** | `app.js` | Selalu tambahkan `app.use(cors())` di Express. |
| **3** | **Dockerize** | `docker-compose.yml` | Hubungkan service `db`, `api`, dan `tunnel` dalam satu jaringan internal. |
| **4** | **Edge Gateway** | Cloudflare Worker + KV | Pastikan nama *binding* KV di Settings bernama `TUNNEL_KV` dan script menembak `/update-url`. |
| **5** | **Front-End Deployment** | `script.js` & Vercel | Pastikan `API_URL` diawali `https://` dan diakhiri `/buku` (atau nama endpoint-mu). |

---