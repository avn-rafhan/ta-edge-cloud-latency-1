# Tabel Skenario Pengujian yang Disesuaikan dengan Aplikasi Web

## Konteks

Pada proyek ini, parameter yang dapat diatur oleh pengguna melalui antarmuka web hanya berupa jumlah records yang ingin diambil. Karena keterbatasan ini, rancangan skenario pengujian perlu dirancang sedemikian rupa agar tetap representatif, relevan, dan mampu menghasilkan output yang insightful untuk analisis lebih lanjut.

Oleh karena itu, skenario pengujian difokuskan pada variasi jumlah records sebagai faktor utama, sementara kondisi lain seperti jenis trafik, delay, bandwidth, dan karakteristik arsitektur dijaga tetap konsisten atau disimulasikan melalui konfigurasi backend dan lingkungan uji yang terkontrol.

---

## 1. Prinsip Penyusunan Skenario

Skenario yang disusun mempertimbangkan beberapa prinsip berikut:

- Representatif: mengacu pada beban kerja yang umum muncul dalam sistem nyata.
- Relevan: sesuai dengan batasan input pengguna yang tersedia pada aplikasi web.
- Komprehensif: mencakup skala beban dari ringan hingga berat.
- Insightful: mampu menghasilkan pola performa yang dapat dianalisis lebih lanjut melalui grafik, statistik, dan teknik visualisasi lainnya.

Karena user hanya dapat mengatur jumlah records, maka variasi jumlah records menjadi elemen utama dalam desain skenario. Variasi ini kemudian dipadukan dengan kondisi jaringan dan arsitektur komputasi yang tetap terkontrol agar hasil pengujian tetap valid untuk dibandingkan.

---

## 2. Tabel Skenario Pengujian

| ID Skenario | Parameter Pengujian | Kondisi/Variabel yang Ditentukan | Metrik yang Diukur | Tujuan Pengujian |
|---|---|---|---|---|
| S1 | Records kecil | Jumlah records: 100-500; beban ringan; jaringan stabil | Latensi rata-rata, throughput, CPU/RAM overhead | Menilai baseline performa sistem pada beban ringan dan memastikan hasil pengujian berada dalam rentang normal |
| S2 | Records menengah | Jumlah records: 1.000-3.000; beban sedang; jaringan stabil | Latensi rata-rata, p95 latency, jitter, throughput | Mengamati perubahan performa ketika beban meningkat secara moderat dan melihat pola scaling sistem |
| S3 | Records besar | Jumlah records: 5.000-10.000; beban berat; jaringan stabil | Latensi maksimal, jitter, packet delivery ratio, CPU/RAM utilization | Mengukur ketahanan sistem terhadap beban tinggi dan mengidentifikasi titik penurunan performa |
| S4 | Records sangat besar / stress-test | Jumlah records: 10.000+; beban ekstrem; jaringan dengan gangguan ringan (delay/jitter) | Latensi, jitter, packet delivery ratio, throughput, resource utilization | Menilai performa sistem pada kondisi ekstrem dan melihat apakah Edge tetap lebih unggul dibanding Cloud pada beban sangat tinggi |

---

## 3. Penjelasan Skenario

### S1 – Baseline
Skenario ini digunakan untuk memperoleh nilai awal performa sistem. Pada kondisi beban ringan, hasil pengujian seharusnya menunjukkan performa yang paling stabil. Skenario ini penting sebagai acuan sebelum membandingkan sistem pada beban yang lebih besar.

### S2 – Beban Menengah
Skenario ini merepresentasikan kondisi penggunaan yang lebih realistis, di mana aplikasi menerima cukup banyak data namun belum sampai pada batas ekstrem. Skenario ini berguna untuk melihat apakah peningkatan jumlah records menyebabkan latensi naik secara linier atau justru ada perubahan pola yang lebih kompleks.

### S3 – Beban Berat
Skenario ini menguji sistem pada tingkat beban yang lebih tinggi. Tujuannya adalah melihat apakah sistem masih mampu mempertahankan performa yang baik ketika jumlah records meningkat signifikan.

### S4 – Stress Test
Skenario ini penting untuk mengevaluasi batas kemampuan sistem. Dengan beban tinggi dan kondisi jaringan yang sedikit tertekan, hasil pengujian dapat menunjukkan apakah Edge Computing memang memberikan keunggulan yang konsisten ketika sistem berada di bawah tekanan.

---

## 4. Mengapa Skenario Ini Relevan?

Skenario ini relevan karena:

- Memanfaatkan parameter yang benar-benar tersedia pada aplikasi web, yaitu jumlah records.
- Menyediakan variasi beban kerja dari kecil hingga ekstrem.
- Memungkinkan dilakukannya perbandingan performa antara arsitektur Edge dan Cloud dengan tetap menjaga validitas eksperimen.
- Menghasilkan data yang kaya untuk analisis statistik dan visualisasi.

Dengan demikian, meskipun user hanya dapat mengatur satu parameter utama, hasil pengujian tetap dapat menjadi dasar yang kuat untuk menarik kesimpulan ilmiah.

---

## 5. Saran Metode dan Teknik Analisis Hasil Pengujian

Agar hasil pengujian menjadi lebih insightful, analisis tidak cukup dilakukan dengan melihat nilai rata-rata saja. Beberapa metode dan teknik yang direkomendasikan adalah sebagai berikut:

### 5.1 Analisis Statistik Deskriptif
- Rata-rata, median, standar deviasi, minimum, maksimum.
- Berguna untuk memahami distribusi performa antar skenario.

### 5.2 Analisis Perbandingan Antar Skenario
- Membandingkan hasil Edge dan Cloud pada setiap level beban.
- Dapat digunakan untuk melihat apakah selisih performa semakin besar saat beban meningkat.

### 5.3 Visualisasi Grafik
- Line chart untuk menunjukkan hubungan antara jumlah records dan latensi.
- Bar chart untuk membandingkan rata-rata latensi antar skenario.
- Box plot untuk melihat variabilitas distribusi hasil pengujian.
- Scatter plot untuk memetakan hubungan antara beban kerja dan resource utilization.

### 5.4 Analisis Regresi atau Trend Analysis
- Digunakan untuk melihat pola pertumbuhan latensi seiring dengan peningkatan jumlah records.
- Cocok untuk mengidentifikasi apakah hubungan antara beban kerja dan performa bersifat linier atau non-linear.

### 5.5 Analisis Kinerja pada Kondisi Ekstrem
- Menggunakan pendekatan threshold analysis untuk melihat titik di mana performa mulai menurun drastis.
- Sangat berguna untuk menilai batas toleransi sistem.

### 5.6 Analisis Multi-Metrik
- Menggabungkan latensi, throughput, jitter, dan CPU/RAM utilization untuk memberikan gambaran performa yang lebih komprehensif.
- Ini penting karena satu metrik saja tidak mampu mewakili kualitas layanan secara utuh.

### 5.7 Teknik Pembahasan Hasil yang Kuat untuk Sidang
- Gunakan insight berbasis data, bukan hanya opini.
- Soroti pola konsisten, tren peningkatan performa, serta titik kritis ketika sistem mulai tertekan.
- Bandingkan hasil numerik secara eksplisit untuk memperkuat argumen penelitian.

---

## 6. Catatan Akhir

Dengan desain skenario yang menekankan variasi jumlah records sebagai parameter utama, penelitian ini tetap dapat menghasilkan data yang valid, representatif, dan cukup kaya untuk dianalisis lebih lanjut. Pendekatan ini juga sangat sesuai dengan batasan fungsional aplikasi web yang sedang dikembangkan, sekaligus tetap menjamin bahwa hasil penelitian memiliki nilai ilmiah yang kuat untuk dibahas dalam tugas akhir.
