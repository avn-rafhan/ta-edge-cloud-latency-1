const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = Number(process.env.PORT || 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new RangeError('PORT harus berupa bilangan bulat antara 1 dan 65535.');
}

app.use(cors());
app.use(express.json());

const datasetPath = path.join(__dirname, 'dataset/dataset.csv');
const REQUIRED_DATASET_COLUMNS = [
    'Periode',
    'Wilayah',
    'Kode Wilayah',
    'Kota/Kab',
    'Kode Kota/Kab',
    'Status Sekolah',
    'Baik',
    'Rusak Ringan',
    'Rusak Sedang',
    'Rusak Berat',
    'Total Rusak',
    'Jumlah'
];
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
    const parsedData = parse(rawData, {
        bom: true,
        columns: true,
        skip_empty_lines: true
    });
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new TypeError('dataset.csv harus berisi data yang tidak kosong.');
    }
    const missingColumns = REQUIRED_DATASET_COLUMNS.filter(
        (column) => !Object.hasOwn(parsedData[0], column)
    );
    if (missingColumns.length > 0) {
        throw new TypeError(`Kolom dataset.csv tidak lengkap: ${missingColumns.join(', ')}.`);
    }
    realDataset = parsedData;
    console.log(`Berhasil memuat ${realDataset.length} data dari dataset riil.`);
} catch (error) {
    console.error('Gagal membaca file dataset.csv:', error);
    process.exit(1);
}

const CLOUD_URL = process.env.CLOUD_URL || 'https://34.101.198.59.sslip.io/api/data';
const RENDER_URL = process.env.RENDER_URL || 'https://ta-edge-cloud-latency-1.onrender.com/api/data';
const EDGE_URL = process.env.EDGE_URL || 'https://edge-node.mhfarhianalmz.workers.dev/api/data';
const TARGET_URLS = {
    cloud: [CLOUD_URL, 'https://34.101.198.59.sslip.io/api/data'],
    render: [RENDER_URL, 'https://ta-edge-cloud-latency-1.onrender.com/api/data'],
    edge: [EDGE_URL, 'https://edge-node.mhfarhianalmz.workers.dev/api/data']
};

function buildUrl(baseUrl, size) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}size=${size}`;
}

function parseRequestedSize(value) {
    if (value === undefined) {
        return 10;
    }

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const size = Number(value);
    if (!Number.isSafeInteger(size) || size < 1 || size > realDataset.length) {
        return null;
    }

    return size;
}

async function benchmarkTarget(target, size) {
    const targetUrls = TARGET_URLS[target];
    if (!targetUrls) {
        throw new Error(`Target benchmark tidak dikenal: ${target}`);
    }
    const start = process.hrtime.bigint();
    let lastError = new Error('Tidak ada URL target yang dikonfigurasi.');

    for (const targetUrl of [...new Set(targetUrls)]) {
        try {
            if (targetUrl.includes('your-render-service.onrender.com')) {
                throw new Error('URL Render placeholder tidak digunakan.');
            }
            if (target === 'edge' && targetUrl.includes('.onrender.com')) {
                throw new Error('URL Render tidak digunakan sebagai endpoint Edge.');
            }

            const response = await fetch(buildUrl(targetUrl, size));
            if (!response.ok) {
                throw new Error(`Request gagal dengan status ${response.status}`);
            }

            const result = await response.json();
            if (!result || result.success !== true || !Array.isArray(result.payload)) {
                throw new Error('Respons API tidak berisi payload dataset yang valid.');
            }
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

            return {
                success: true,
                target,
                requested_size: size,
                latency_ms: Number(durationMs.toFixed(2)),
                payload: result.payload,
                total_dataset: result.total_dataset ?? realDataset.length,
                source: targetUrl
            };
        } catch (error) {
            lastError = error;
        }
    }

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    return {
        success: false,
        target,
        requested_size: size,
        latency_ms: Number(durationMs.toFixed(2)),
        payload: [],
        total_dataset: realDataset.length,
        source: targetUrls[0],
        error: lastError.message
    };
}

app.get('/api/data', (req, res) => {
    const size = parseRequestedSize(req.query.size);
    if (size === null) {
        return res.status(400).json({
            success: false,
            error: `Parameter size harus berupa bilangan bulat antara 1 dan ${realDataset.length}.`
        });
    }

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
    const size = parseRequestedSize(req.query.size);
    if (size === null) {
        return res.status(400).json({
            success: false,
            error: `Parameter size harus berupa bilangan bulat antara 1 dan ${realDataset.length}.`
        });
    }

    const targetValue = req.query.target;
    const target = targetValue === undefined
        ? 'both'
        : typeof targetValue === 'string' ? targetValue.toLowerCase() : '';

    if (!['cloud', 'render', 'edge', 'both', 'all'].includes(target)) {
        return res.status(400).json({
            success: false,
            error: 'Parameter target harus berupa cloud, render, edge, both, atau all.'
        });
    }

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

    if (target === 'render') {
        const result = await benchmarkTarget('render', size);
        res.json(result);
        return;
    }

    const [cloudResult, renderResult, edgeResult] = await Promise.all([
        benchmarkTarget('cloud', size),
        benchmarkTarget('render', size),
        benchmarkTarget('edge', size)
    ]);

    res.json({
        success: true,
        requested_size: size,
        target,
        cloud: cloudResult,
        render: renderResult,
        edge: edgeResult,
        total_dataset: realDataset.length
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

server.on('error', (error) => {
    console.error(`Gagal menjalankan server pada port ${PORT}:`, error.message);
    process.exitCode = 1;
});