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
    source_url: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-sd-mi-sederajat-1',
    title: 'Jumlah Perpustakaan Menurut Kondisi 2025 - SD/MI',
    organization: 'Kemendikbudristek',
    description: 'Dataset jumlah perpustakaan menurut kondisi 2025 untuk semua wilayah SD/MI sederajat.'
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