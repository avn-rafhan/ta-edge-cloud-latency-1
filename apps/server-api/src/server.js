const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const datasetPath = path.join(__dirname, 'dataset/dataset.json');
const DATASET_METADATA = {
    source_url_1: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-sd-mi-sederajat-1',
    title_1: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SD/MI/Sederajat',
    organization_1: 'Kemendikdasmen',
    description_1: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SD dan SPK SD yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan dasar.',
    source_url_2: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-smp-mts-sederajat-2',
    title_2: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SMP/MTs/Sederajat',
    organization_2: 'Kemendikdasmen',
    description_2: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SMP dan SPK SMP yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan menengah pertama.',
    source_url_3: 'https://data.kemendikdasmen.go.id/dataset/td/sarana-dan-prasarana-qraac/jumlah-perpustakaan-menurut-kondisi-2025-semua-wilayah-sma-ma-sederajat-3',
    title_3: 'Jumlah Perpustakaan Menurut Kondisi 2016 - 2024 - SMA/MA/Sederajat',
    organization_3: 'Kemendikdasmen',
    description_3: 'Dataset ini menyajikan jumlah perpustakaan pada bentuk satuan pendidikan SMA dan SPK SMA yang diklasifikasikan berdasarkan kondisi ruang perpustakaan (baik, rusak ringan, rusak sedang, dan rusak berat), sehingga memberikan gambaran mengenai tingkat kelayakan fasilitas perpustakaan dalam penyelenggaraan pendidikan menengah atas.',
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
    console.error('Gagal membaca file dataset.json:', error);
}

const CLOUD_URL = process.env.CLOUD_URL || 'https://latency-cloud-app-321690956281.asia-southeast2.run.app/api/data';
const EDGE_URL = process.env.EDGE_URL || 'https://ta-edge-cloud-latency-1.onrender.com/api/data';

function buildUrl(baseUrl, size) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}size=${size}`;
}

async function benchmarkTarget(target, size) {
    const targetUrl = target === 'cloud' ? CLOUD_URL : EDGE_URL;
    const start = process.hrtime.bigint();

    try {
        const response = await fetch(buildUrl(targetUrl, size));
        if (!response.ok) {
            throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const result = await response.json();
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

        return {
            success: true,
            target,
            requested_size: size,
            latency_ms: Number(durationMs.toFixed(2)),
            payload: result.payload || [],
            total_dataset: result.total_dataset || realDataset.length,
            source: targetUrl
        };
    } catch (error) {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        return {
            success: false,
            target,
            requested_size: size,
            latency_ms: Number(durationMs.toFixed(2)),
            payload: [],
            total_dataset: realDataset.length,
            source: targetUrl,
            error: error.message
        };
    }
}

app.get('/api/data', (req, res) => {
    const size = parseInt(req.query.size) || 10;
    const slicedData = realDataset.slice(0, size);

    res.json({
        success: true,
        requested_size: size,
        total_data: slicedData.length,
        total_dataset: realDataset.length,
        payload: slicedData
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        total_dataset: realDataset.length,
        ...DATASET_METADATA
    });
});

app.get('/api/benchmark', async (req, res) => {
    const size = parseInt(req.query.size) || 10;
    const target = (req.query.target || 'both').toLowerCase();

    if (target === 'cloud') {
        const result = await benchmarkTarget('cloud', size);
        res.json(result);
        return;
    }

    if (target === 'edge') {
        const result = await benchmarkTarget('edge', size);
        res.json(result);
        return;
    }

    const [cloudResult, edgeResult] = await Promise.all([
        benchmarkTarget('cloud', size),
        benchmarkTarget('edge', size)
    ]);

    res.json({
        success: true,
        requested_size: size,
        target: 'both',
        cloud: cloudResult,
        edge: edgeResult,
        total_dataset: realDataset.length
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});