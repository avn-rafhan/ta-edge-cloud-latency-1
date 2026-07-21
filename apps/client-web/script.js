const CLOUD_URL = 'https://latency-cloud-app-321690956281.asia-southeast2.run.app/api/data';
const EDGE_URL = 'https://ta-edge-cloud-latency-1.onrender.com/api/data';
const DEFAULT_BENCHMARK_API_URL = 'http://localhost:3000/api/benchmark';
const DEFAULT_INFO_API_URL = 'http://localhost:3000/api/info';

let datasetInfo = {
    title: '-',
    description: 'Informasi dataset belum tersedia.',
    organization: '-',
    source_url: '#'
};
let isSessionActive = false;
let sessionRecords = [];
let sessionScenarioCounter = 0;

function getApiBaseUrl() {
    const explicitBase = window.__APP_CONFIG__?.apiBaseUrl || new URLSearchParams(window.location.search).get('apiBaseUrl');
    if (explicitBase) return explicitBase.replace(/\/$/, '');

    return 'https://ta-edge-cloud-latency-1.onrender.com';
}

function getBenchmarkApiUrl() {
    const base = getApiBaseUrl();
    return base ? `${base}/api/benchmark` : '/api/benchmark';
}

function getInfoApiUrl() {
    const base = getApiBaseUrl();
    return base ? `${base}/api/info` : '/api/info';
}

document.addEventListener('DOMContentLoaded', init);

function queryButtons(){
    return Array.from(document.querySelectorAll('.test-button'));
}

function isInputValid() {
    const input = document.getElementById('dataSize');
    if (!input) return false;

    const val = Number(input.value);
    const max = input.max ? Number(input.max) : Infinity;
    const isInteger = Number.isInteger(val);

    if (input.value === '' || Number.isNaN(val)) return false;
    if (!isInteger) return false;
    if (val < 1) return false;
    if (val > max) return false;
    return true;
}

async function init(){
    const input = document.getElementById('dataSize');
    input.setAttribute('min', '1');
    input.setAttribute('step', '1');

    queryButtons().forEach(b => b.disabled = true);

    const infoBtn = document.getElementById('datasetInfoBtn');
    const dialog = document.getElementById('datasetInfoDialog');
    const closeButton = document.getElementById('closeDatasetInfo');
    const sessionToggleBtn = document.getElementById('sessionToggleBtn');
    const downloadBtn = document.getElementById('downloadCsvBtn');

    if (infoBtn) {
        infoBtn.addEventListener('click', () => openInfoDialog(dialog));
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => closeInfoDialog(dialog));
    }

    if (dialog) {
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeInfoDialog(dialog);
        });
    }

    if (sessionToggleBtn) {
        sessionToggleBtn.addEventListener('click', toggleSession);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadSessionCsv);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dialog && dialog.getAttribute('aria-hidden') === 'false') {
            closeInfoDialog(dialog);
        }
    });

    const results = await Promise.allSettled([
        fetchInfo(getInfoApiUrl()),
        fetchInfo(CLOUD_URL.replace(/\/api\/data.*$/, '/api/info')),
        fetchInfo(EDGE_URL.replace(/\/api\/data.*$/, '/api/info'))
    ]);

    const backendInfo = results[0].status === 'fulfilled' ? results[0].value : null;
    const cloudInfo = results[1].status === 'fulfilled' ? results[1].value : null;
    const edgeInfo = results[2].status === 'fulfilled' ? results[2].value : null;
    datasetInfo = backendInfo || cloudInfo || edgeInfo || datasetInfo;
    populateDatasetInfo(datasetInfo);

    if (typeof datasetInfo.total_dataset === 'number') {
        input.max = datasetInfo.total_dataset;
        input.setAttribute('max', datasetInfo.total_dataset);
        const label = document.querySelector('.control-card label');
        if (label) label.innerText = `Jumlah Data yang Ingin Ditarik (max ${datasetInfo.total_dataset})`;
    }

    input.addEventListener('input', validateInput);
    validateInput();
    renderSessionUI();
}

async function fetchInfo(url){
    try{
        const res = await fetch(url);
        if (!res.ok) throw new Error('not ok');
        const json = await res.json();
        if (json && typeof json.total_dataset === 'number') return json;
        return null;
    }catch(e){
        return null;
    }
}

function populateDatasetInfo(info){
    if (!info) return;
    document.getElementById('datasetTotalRecords').innerText = typeof info.total_dataset === 'number' ? info.total_dataset : '-';
    document.getElementById('datasetTitle').innerText = info.title || '-';
    document.getElementById('datasetOrganization').innerText = info.organization || '-';
    document.getElementById('datasetInfoDescription').innerText = info.description || 'Informasi dataset yang digunakan untuk pengujian latensi.';
    const sourceLink = document.getElementById('datasetSourceLink');
    sourceLink.href = info.source_url || '#';
    sourceLink.innerText = info.source_url ? 'Tautan sumber dataset' : 'Sumber dataset tidak tersedia';
}

function openInfoDialog(dialog){
    populateDatasetInfo(datasetInfo);
    dialog.setAttribute('aria-hidden', 'false');
}

function closeInfoDialog(dialog){
    dialog.setAttribute('aria-hidden', 'true');
}

function renderSessionUI(){
    const toggleBtn = document.getElementById('sessionToggleBtn');
    const downloadBtn = document.getElementById('downloadCsvBtn');
    const statusBadge = document.getElementById('sessionStatusBadge');
    const statusText = document.getElementById('sessionStatusText');
    const combinedBtn = document.getElementById('combinedTestButton');
    const cloudShell = document.querySelector('.cloud-card .card-action-shell');
    const edgeShell = document.querySelector('.edge-card .card-action-shell');
    const isValid = isInputValid();

    if (toggleBtn) {
        toggleBtn.textContent = isSessionActive ? 'Selesai Sesi' : 'Mulai Sesi';
        toggleBtn.classList.toggle('is-active', isSessionActive);
        toggleBtn.disabled = false;
    }

    if (statusBadge) {
        statusBadge.classList.toggle('is-active', isSessionActive);
    }

    if (statusText) {
        statusText.textContent = isSessionActive ? 'Sesi pencatatan aktif' : 'Sesi belum dimulai';
    }

    if (cloudShell) {
        cloudShell.classList.toggle('is-hidden', isSessionActive);
    }

    if (edgeShell) {
        edgeShell.classList.toggle('is-hidden', isSessionActive);
    }

    if (combinedBtn) {
        combinedBtn.disabled = !isValid;
        combinedBtn.classList.toggle('is-disabled', !isValid);
        combinedBtn.setAttribute('aria-hidden', 'false');
    }

    if (downloadBtn) {
        const canDownload = isSessionActive;
        downloadBtn.disabled = !canDownload;
        downloadBtn.classList.toggle('is-enabled', canDownload);
    }
}

function validateInput(){
    const input = document.getElementById('dataSize');
    const error = document.getElementById('dataError');
    const val = Number(input.value);
    const max = input.max ? Number(input.max) : Infinity;
    const isInteger = Number.isInteger(val);
    let valid = false;
    let message = '';

    if (input.value === '' || Number.isNaN(val)) {
        message = 'Masukkan nilai angka yang valid.';
    } else if (!isInteger) {
        message = 'Hanya angka bulat yang diperbolehkan.';
    } else if (val < 1) {
        message = 'Nilai harus lebih besar dari nol.';
    } else if (val > max) {
        message = `Jumlah record melebihi batas dataset (${max}).`;
    } else {
        valid = true;
    }

    error.innerText = message;

    const shouldDisableTesting = !valid;
    document.querySelectorAll('.test-card .test-button').forEach((b) => {
        b.disabled = shouldDisableTesting;
        b.classList.toggle('is-disabled', shouldDisableTesting);
    });

    const combinedBtn = document.getElementById('combinedTestButton');
    if (combinedBtn) {
        combinedBtn.disabled = shouldDisableTesting;
        combinedBtn.classList.toggle('is-disabled', shouldDisableTesting);
    }

    if (!valid) {
        document.getElementById('cloudLatency').innerText = '- ms';
        document.getElementById('edgeLatency').innerText = '- ms';
    }

    renderSessionUI();
}

function toggleSession(){
    if (!isInputValid()) {
        validateInput();
        return;
    }

    if (!isSessionActive) {
        isSessionActive = true;
        sessionRecords = [];
        sessionScenarioCounter = 0;
    } else {
        isSessionActive = false;
    }

    renderSessionUI();
}

async function testLatency(target) {
    const size = parseInt(document.getElementById('dataSize').value, 10) || 1;
    const benchmarkUrl = getBenchmarkApiUrl();
    const isCombined = target === 'both';
    const cloudMetricElement = document.getElementById('cloudLatency');
    const edgeMetricElement = document.getElementById('edgeLatency');

    if (isCombined) {
        cloudMetricElement.innerText = 'Mengambil data...';
        edgeMetricElement.innerText = 'Mengambil data...';
    } else {
        const metricElement = target === 'cloud' ? cloudMetricElement : edgeMetricElement;
        metricElement.innerText = 'Mengambil data...';
    }

    const startTime = performance.now();

    try {
        const response = await fetch(`${benchmarkUrl}?target=${encodeURIComponent(target)}&size=${size}`);
        const result = await response.json();

        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(2);

        if (isCombined) {
            const cloudLatency = result?.cloud?.latency_ms != null ? Number(result.cloud.latency_ms.toFixed(2)) : null;
            const edgeLatency = result?.edge?.latency_ms != null ? Number(result.edge.latency_ms.toFixed(2)) : null;

            cloudMetricElement.innerText = cloudLatency != null ? `${cloudLatency} ms` : 'Error / Offline';
            edgeMetricElement.innerText = edgeLatency != null ? `${edgeLatency} ms` : 'Error / Offline';
            document.getElementById('dataLog').innerText = JSON.stringify({ cloud: result?.cloud, edge: result?.edge }, null, 2);
            return {
                target,
                latency: Number(latency),
                cloudLatency,
                edgeLatency,
                payload: result?.cloud?.payload || result?.edge?.payload || null
            };
        }

        const singleLatency = result?.latency_ms != null ? Number(result.latency_ms.toFixed(2)) : null;
        const metricElement = target === 'cloud' ? cloudMetricElement : edgeMetricElement;
        metricElement.innerText = singleLatency != null ? `${singleLatency} ms` : 'Error / Offline';
        document.getElementById('dataLog').innerText = JSON.stringify(result, null, 2);
        return { target, latency: singleLatency, payload: result?.payload || null };
    } catch (error) {
        const metricElement = isCombined ? null : (target === 'cloud' ? cloudMetricElement : edgeMetricElement);
        if (metricElement) {
            metricElement.innerText = 'Error / Offline';
        } else {
            cloudMetricElement.innerText = 'Error / Offline';
            edgeMetricElement.innerText = 'Error / Offline';
        }
        console.error(error);
        return { target, latency: null, payload: null };
    }
}

async function runSessionTest(){
    if (!isInputValid()) {
        validateInput();
        return;
    }

    const size = parseInt(document.getElementById('dataSize').value, 10) || 1;
    const benchmarkResult = await testLatency('both');

    if (isSessionActive) {
        const record = {
            id_skenario: `S${++sessionScenarioCounter}`,
            jumlah_record: size,
            latensi_edge_ms: benchmarkResult && benchmarkResult.edgeLatency !== null ? benchmarkResult.edgeLatency : null,
            latensi_cloud_ms: benchmarkResult && benchmarkResult.cloudLatency !== null ? benchmarkResult.cloudLatency : null
        };

        sessionRecords.push(record);
    }

    renderSessionUI();
}

function downloadSessionCsv(){
    if (sessionRecords.length === 0) return;

    const headers = ['id_skenario', 'jumlah_record', 'latensi_edge_ms', 'latensi_cloud_ms'];
    const rows = sessionRecords.map((record) => [
        record.id_skenario,
        record.jumlah_record,
        record.latensi_edge_ms,
        record.latensi_cloud_ms
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pengujian_latensi.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function escapeCsvCell(value){
    const stringValue = value == null ? '' : String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}