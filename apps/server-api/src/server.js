const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Modul bawaan untuk membaca file
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Membaca dataset sekali saja saat server pertama kali menyala (masuk ke RAM)
const datasetPath = path.join(__dirname, 'dataset/dataset.json');
const DATASET_METADATA = {
    // Data SD/MI
    source_url_1: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-sd-mi-sederajat-1',
    title_1: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SD/MI/Sederajat',
    organization_1: 'Kemendikdasmen',
    description_1: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SD dan SPK SD yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan dasar.',
    
    // Data SMP/MTS
    source_url_2: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-smp-mts-sederajat-2',
    title_2: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SMP/MTs/Sederajat',
    organization_2: 'Kemendikdasmen',
    description_2: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SMP dan SPK SMP yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan menengah pertama.',
    
    // Data SMA/MA
    source_url_3: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-sma-ma-sederajat-3',
    title_3: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SMA/MA/Sederajat',
    organization_3: 'Kemendikdasmen',
    description_3: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SMA dan SPK SMA yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan menengah atas.',
    
    // Data SMK/MAK
    source_url_4: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-smk-mak-sederajat-4',
    title_4: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SMK/MAK/Sederajat',
    organization_4: 'Kemendikdasmen',
    description_4: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SMK yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan menengah kejuruan.',
};

let realDataset = [];

try {
    const rawData = fs.readFileSync(datasetPath, 'utf8');
    realDataset = JSON.parse(rawData);
    console.log(`Berhasil memuat ${realDataset.length} data dari dataset riil.`);
} catch (error) {
    console.error("Gagal membaca file dataset.json:", error);
}

// Endpoint API untuk menarik data riil berdasarkan jumlah yang diminta
app.get('/api/data', (req, res) => {
    const size = parseInt(req.query.size) || 10;
    
    // Mengambil data dari index 0 hingga sejumlah 'size' yang diminta user
    const slicedData = realDataset.slice(0, size);

    res.json({
        success: true,
        requested_size: size,
        total_data: slicedData.length,
        total_dataset: realDataset.length,
        payload: slicedData
    });
});

// Endpoint untuk mendapatkan informasi dataset (total record)
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        total_dataset: realDataset.length,
        ...DATASET_METADATA
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});