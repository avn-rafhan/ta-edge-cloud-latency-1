# Rencana dan Skenario Pengujian Komprehensif untuk Penelitian Tugas Akhir

## Judul Penelitian
Perbandingan Kinerja Latensi antara Arsitektur Edge Computing dan Cloud Computing Menggunakan Metode Simulasi Jaringan Berbasis Kontainer

---

## 1. Landasan Berpikir Kritis & Problem Solving (Metodologi)

### 1.1 Proses Berpikir Kritis dalam Menentukan Variabel Pengujian

Proses penentuan variabel pengujian dalam penelitian ini dilakukan secara sistematis melalui pendekatan berpikir kritis agar hasil simulasi benar-benar relevan, tidak mengandung bias, dan mampu menjawab rumusan masalah secara ilmiah. Langkah-langkah yang digunakan adalah sebagai berikut:

1. Menetapkan masalah penelitian secara eksplisit.
   - Penelitian ini berfokus pada perbandingan kinerja latensi antara arsitektur Edge Computing dan Cloud Computing.
   - Karena latensi sangat dipengaruhi oleh jarak komputasi, kondisi jaringan, dan karakteristik beban kerja, maka variabel yang dipilih harus mencerminkan faktor-faktor tersebut secara langsung.

2. Mengidentifikasi variabel independen, dependen, dan kontrol.
   - Variabel bebas (independent variables): beban data/workload, kondisi jaringan simulasi, dan karakteristik arsitektur (Edge vs Cloud).
   - Variabel terikat (dependent variables): latensi, jitter, throughput, packet delivery ratio, serta resource utilization CPU/RAM.
   - Variabel kontrol: jenis aplikasi, ukuran kontainer, jumlah node, durasi pengujian, metode pengiriman paket, dan konfigurasi perangkat keras virtual yang sama.

3. Menguji hubungan sebab-akibat secara logis.
   - Jika jarak komputasi ke node pemrosesan semakin dekat, maka waktu propagasi jaringan cenderung lebih kecil.
   - Jika kondisi jaringan mengalami delay, jitter, atau packet loss, maka efek tersebut akan lebih terasa pada arsitektur Cloud yang mengandalkan jalur komunikasi yang lebih panjang.
   - Dengan demikian, hasil observasi dapat dikaitkan secara rasional dengan prinsip jaringan terdistribusi dan arsitektur komputasi modern.

4. Memastikan setiap variabel dapat diukur secara teknis.
   - Variabel yang dipilih tidak boleh bersifat abstrak atau sulit diobservasi.
   - Semua metrik harus dapat diambil dari lingkungan simulasi berbasis kontainer, misalnya melalui alat seperti ping, iperf3, tc/netem, docker stats, dan sistem monitoring berbasis container.

5. Menggunakan pendekatan hipotesis yang terukur.
   - Hipotesis penelitian dapat dirumuskan sebagai: arsitektur Edge Computing memberikan latensi lebih rendah dibanding Cloud Computing, terutama pada skenario dengan workload sedang hingga berat dan kondisi jaringan yang tidak ideal.

### 1.2 Memecahkan Masalah Bias Pengujian agar Simulasi Representatif

Bias pengujian merupakan tantangan utama dalam simulasi karena hasil yang diperoleh bisa saja tidak mencerminkan kondisi riil. Untuk mengurangi bias, beberapa langkah berikut diterapkan:

1. Mengontrol faktor yang tidak relevan.
   - Semua kontainer dijalankan pada host yang sama atau lingkungan virtual yang setara agar perbedaan performa tidak semata-mata disebabkan oleh spesifikasi perangkat keras yang berbeda.
   - Konfigurasi CPU, RAM, dan sistem operasi internal kontainer dibuat konsisten.

2. Menggunakan desain eksperimen yang terulang.
   - Setiap skenario diuji beberapa kali (misalnya 5-10 kali replikasi) untuk mengurangi efek noise dan fluktuasi acak.
   - Nilai rata-rata, median, dan deviasi standar digunakan sebagai dasar analisis.

3. Menyamakan beban kerja antar arsitektur.
   - Sama-sama diberi workload yang identik, baik dari segi jumlah request, ukuran payload, maupun pola trafik.
   - Hal ini memastikan perbandingan antara Edge dan Cloud valid.

4. Menyertakan skenario kondisi jaringan yang realistis.
   - Simulasi tidak hanya menggunakan jaringan ideal.
   - Delay, bandwidth constraints, jitter, dan packet loss dimasukkan secara bertahap untuk menciptakan kondisi yang menyerupai dunia nyata.

5. Memastikan representasi topologi yang dekat dengan kondisi riil.
   - Edge dapat direpresentasikan sebagai node yang lebih dekat dengan pengguna atau sumber data, sedangkan Cloud direpresentasikan sebagai node yang lebih jauh dengan lebih banyak hop.
   - Dengan demikian, perbedaan jarak logis dan fisik dapat diukur secara lebih otentik.

6. Menghindari overfitting terhadap satu kondisi.
   - Penelitian ini tidak bergantung pada satu skenario saja, melainkan menggunakan beberapa skenario berbeda dari ringan hingga stress-test.
   - Hal ini membuat hasil lebih kuat secara ilmiah dan lebih mampu di-generalize.

---

## 2. Rancangan Skenario Pengujian & Tabel

### 2.1 Variabel yang Digunakan

Variabel bebas yang digunakan dalam penelitian ini meliputi:

- Beban data/workload: jumlah records, ukuran payload, dan tingkat concurrency.
- Kondisi jaringan simulasi: delay, bandwidth, jitter, dan packet loss.
- Karakteristik arsitektur: jarak hop, posisi komputasi, serta jumlah titik transit.

Variabel terikat yang diamati meliputi:

- Latency (rata-rata, minimum, maksimum, dan p95/p99).
- Jitter.
- Network throughput.
- Packet delivery ratio.
- CPU dan RAM utilization dari kontainer.

### 2.2 Tabel Skenario Pengujian

| ID Skenario | Parameter Pengujian | Metrik yang Diukur | Tujuan Pengujian |
|---|---|---|---|
| S1 | Baseline ringan: 100-500 records, payload kecil (256 KB), bandwidth cukup, delay stabil (0-5 ms), jitter rendah, packet loss 0% | Latensi rata-rata, jitter, throughput, CPU/RAM overhead | Mengetahui performa dasar Edge vs Cloud pada kondisi ideal dan membangun baseline awal penelitian |
| S2 | Beban menengah: 1.000-5.000 records, payload sedang (1-2 MB), bandwidth terbatas (2-4 Mbps), delay moderat (20-30 ms), jitter 3-5 ms, packet loss 0,5% | Latensi rata-rata, p95 latency, jitter, throughput, packet delivery ratio | Menguji efek jaringan yang lebih realistis terhadap kedua arsitektur dan melihat apakah Edge tetap unggul saat kondisi mulai menurun |
| S3 | Stress-test: 10.000+ records, payload besar (5-10 MB), bandwidth sangat terbatas (1 Mbps), delay tinggi (50-80 ms), jitter 10-15 ms, packet loss 1-2% | Latensi maksimum, jitter, throughput, packet delivery ratio, CPU/RAM utilization | Menilai ketahanan sistem di bawah beban berat dan mengukur seberapa besar Edge mampu mempertahankan performa saat Cloud mulai tertekan |
| S4 | Burst traffic & kondisi dinamis: traffic tiba secara burst, payload bervariasi, bandwidth berubah-ubah, delay dan jitter bersifat fluktuatif, packet loss 1-3% | Latensi fluktuatif, jitter, packet delivery ratio, throughput, resource utilization | Meniru kondisi real-world seperti lonjakan trafik, gangguan jaringan temporer, dan variasi beban pengguna secara dinamis |

### 2.3 Penjelasan Rancangan Skenario

Skenario yang dipilih tidak hanya mencerminkan perbedaan beban kerja, tetapi juga memadukan variasi kondisi jaringan dan karakteristik arsitektur. Hal ini penting karena penelitian latensi tidak dapat dipahami secara utuh hanya dengan satu kondisi ideal. Dengan empat skenario yang berbeda, penelitian ini mampu menunjukkan:

- apakah Edge selalu unggul,
- seberapa besar selisihnya pada kondisi normal,
- dan apakah keuntungan Edge semakin terasa ketika kondisi jaringan memburuk.

Kondisi ini sangat relevan untuk menjawab pertanyaan ilmiah tentang kapan dan mengapa Edge Computing menjadi lebih efektif dibanding Cloud Computing.

---

## 3. Metrik Tambahan yang Valid & Implementable secara Teknis

Selain latensi, penelitian ini juga memerlukan metrik tambahan yang valid dan dapat diambil secara teknis dalam lingkungan simulasi berbasis kontainer. Metrik-metrik berikut sangat layak digunakan karena mudah diukur dan memiliki hubungan langsung dengan performa sistem.

### 3.1 Jitter

Jitter adalah variasi delay antar paket dalam satu aliran komunikasi. Metrik ini penting karena sistem real-time dan aplikasi interaktif sangat sensitif terhadap perubahan delay yang tidak konsisten.

- Mengapa penting: jitter yang tinggi menandakan ketidakstabilan jaringan.
- Cara mengambil data: dapat diukur dari hasil pengukuran delay paket secara periodik menggunakan ping, iperf3, atau alat monitoring jaringan dalam kontainer.
- Implementasi teknis: setiap paket dikirim dalam interval tertentu, lalu selisih delay antar paket dihitung dan direkam.

### 3.2 Network Throughput

Throughput adalah jumlah data yang berhasil ditransfer per satuan waktu. Metrik ini memperlihatkan efektivitas pemanfaatan jalur jaringan.

- Mengapa penting: sistem yang memiliki latensi rendah belum tentu memiliki throughput yang baik.
- Cara mengambil data: dapat diukur menggunakan iperf3 antara container client dan server.
- Implementasi teknis: throughput dinilai dalam Mbps atau MB/s selama durasi pengujian tertentu.

### 3.3 Packet Delivery Ratio (PDR)

Packet Delivery Ratio adalah rasio jumlah paket yang berhasil diterima terhadap jumlah paket yang dikirim.

- Mengapa penting: PDR menunjukkan seberapa handal komunikasi jaringan dalam kondisi tertentu.
- Cara mengambil data: dapat dihitung dari log pengiriman dan penerimaan paket, atau dari hasil monitoring jaringan.
- Implementasi teknis: setiap paket diberi nomor urut atau timestamp; paket yang gagal sampai ke tujuan dihitung sebagai loss.

### 3.4 Resource Utilization (CPU dan RAM Overhead pada Kontainer)

Metrik ini penting untuk memastikan bahwa performa yang baik tidak hanya berasal dari optimisasi jaringan, tetapi juga tidak mengorbankan efisiensi sumber daya komputasi.

- Mengapa penting: sistem yang cepat namun boros sumber daya tidak selalu efisien untuk diterapkan secara luas.
- Cara mengambil data: dapat diambil melalui docker stats, cgroup metrics, atau alat monitoring seperti Prometheus + cAdvisor.
- Implementasi teknis: CPU usage (%) dan memory usage (MB/%) direkam selama pengujian berlangsung.

### 3.5 Metrik Tambahan yang Direkomendasikan

Selain empat metrik utama di atas, penelitian ini juga dapat menambahkan:

- P95/P99 latency untuk melihat tail latency.
- Retry count atau failed request count.
- Durasi eksekusi tugas per request.

Metrik-metrik ini sangat relevan karena pada sistem terdistribusi, performa tidak hanya ditentukan oleh rata-rata, tetapi juga oleh kejadian ekstrem yang sering kali lebih penting dalam praktik nyata.

---

## 4. Narasi Simulasi Sidang Tugas Akhir (Academic Defense)

### 4.1 Skrip Narasi Sidang

“Dalam penelitian ini, saya merancang simulasi pengujian untuk membandingkan kinerja latensi antara arsitektur Edge Computing dan Cloud Computing dengan pendekatan berbasis kontainer. Pemilihan desain ini didasarkan pada kebutuhan untuk menguji sistem secara terkontrol, konsisten, dan dapat direplikasi. Saya memilih variabel beban data, kondisi jaringan, dan karakteristik arsitektur sebagai faktor utama karena ketiga elemen tersebut secara langsung memengaruhi latensi. Dengan demikian, penelitian ini tidak hanya mengukur performa secara umum, tetapi juga menguji bagaimana sistem merespons perubahan beban kerja dan gangguan jaringan yang sering terjadi dalam lingkungan nyata.

Saya menggunakan empat skenario pengujian yang mewakili rentang kondisi dari yang ideal hingga yang sangat menantang. Skenario pertama digunakan sebagai baseline, skenario kedua untuk menguji kondisi jaringan yang lebih realistis, skenario ketiga untuk stress-test, dan skenario keempat untuk mensimulasikan fluktuasi trafik dan burst traffic. Pemilihan skenario ini penting karena penelitian yang hanya menggunakan satu kondisi akan menghasilkan kesimpulan yang terlalu sempit dan kurang kuat secara ilmiah. Dengan beberapa skenario, saya dapat mengamati pola performa yang konsisten dan menghindari hasil yang bersifat kebetulan.

Dalam setiap skenario, saya tidak hanya mengukur latensi, tetapi juga metrik tambahan seperti jitter, throughput, packet delivery ratio, dan resource utilization CPU/RAM. Hal ini penting karena latensi saja tidak cukup untuk merepresentasikan kualitas layanan secara menyeluruh. Sebagai contoh, sistem dapat memiliki latensi yang rendah tetapi throughput yang buruk, atau latency yang baik namun konsumsi sumber daya yang tinggi. Dengan pendekatan multi-metrik ini, analisis menjadi lebih komprehensif dan data-driven.

Dengan desain ini, saya berargumen bahwa Edge Computing memiliki keunggulan yang lebih jelas dibanding Cloud Computing terutama pada skenario dengan beban sedang hingga berat dan kondisi jaringan yang tidak ideal. Alasan utamanya adalah Edge Computing dapat memproses data lebih dekat dengan sumber atau pengguna, sehingga mengurangi jumlah hop komunikasi dan mengurangi dampak delay propagasi. Sementara itu, Cloud Computing cenderung bergantung pada koneksi jaringan yang lebih panjang dan lebih rentan terhadap keterbatasan bandwidth serta gangguan. Oleh karena itu, jika hasil pengujian menunjukkan bahwa Edge menghasilkan latensi lebih rendah, jitter lebih stabil, dan packet delivery ratio lebih baik, maka bukti tersebut secara logis memperkuat klaim bahwa Edge Computing lebih sesuai untuk aplikasi yang menuntut respons cepat dan keandalan jaringan yang lebih tinggi.”

### 4.2 Jawaban Kritis terhadap Pertanyaan Dosen Penguji

- Mengapa skenario ini yang dipilih?
  - Karena skenario ini mencakup variasi yang relevan dan representatif, mulai dari kondisi ideal hingga kondisi yang menantang.
  - Dengan demikian, hasil penelitian menjadi lebih valid dan mampu menjelaskan performa sistem dalam berbagai situasi.

- Bagaimana skenario ini membuktikan keunggulan Edge dibanding Cloud?
  - Melalui pengujian yang membandingkan kedua arsitektur dalam kondisi yang sama, tetapi dengan perbedaan jarak komputasi dan jalur komunikasi.
  - Jika Edge menunjukkan latensi lebih rendah, jitter lebih kecil, dan PDR lebih tinggi terutama pada skenario berbeban berat dan jaringan tidak ideal, maka keunggulan Edge dapat dibuktikan secara empiris.

---

## Penutup

Dokumen ini menyajikan rancangan penelitian yang sistematis, teknis, dan siap digunakan sebagai dasar penyusunan bab metodologi maupun bab hasil dan pembahasan pada tugas akhir. Rancangan ini menggabungkan pendekatan ilmiah, kontrol bias, dan implementasi teknis yang realistis dalam lingkungan simulasi jaringan berbasis kontainer.
