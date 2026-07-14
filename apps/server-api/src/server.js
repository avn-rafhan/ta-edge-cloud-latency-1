const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Modul bawaan untuk membaca file
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Membaca dataset sekali saja saat server pertama kali menyala (masuk ke RAM)
const datasetPath = path.join(__dirname, 'dataset/dataset.json');
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
        total_data: slicedData.length,
        payload: slicedData
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});