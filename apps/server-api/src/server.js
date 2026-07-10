const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Mengizinkan Web UI mengakses API ini dari domain berbeda (CORS)
app.use(cors());

// Fungsi untuk membuat data tiruan secara dinamis
function generateData(count) {
    const dataList = [];
    for (let i = 1; i <= count; i++) {
        dataList.push({
            id: i,
            name: `Item ke-${i}`,
            timestamp: new Date().toISOString(),
            status: "Active",
            value: Math.random() * 100
        });
    }
    return dataList;
}

// Endpoint API: Contoh http://localhost:3000/api/data?size=100
app.get('/api/data', (req, res) => {
    const size = parseInt(req.query.size) || 10; // Default 10 data jika tidak diisi
    const data = generateData(size);
    res.json({
        success: true,
        total_data: data.length,
        payload: data
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});