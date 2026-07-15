// GANTI URL INI DENGAN URL GCP ANDA
const CLOUD_URL = 'https://latency-cloud-app-321690956281.asia-southeast2.run.app/api/data';
const EDGE_URL = 'http://localhost:8080/api/data';

const CLOUD_INFO = CLOUD_URL.replace(/\/api\/data.*$/, '/api/info');
const EDGE_INFO = EDGE_URL.replace(/\/api\/data.*$/, '/api/info');
let datasetInfo = {
    title: '-',
    description: 'Informasi dataset belum tersedia.',
    organization: '-',
    source_url: '#'
};
let isSessionActive = false;
let sessionRecords = [];
let sessionScenarioCounter = 0;

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
        fetchInfo(CLOUD_INFO),
        fetchInfo(EDGE_INFO)
    ]);

    const cloudInfo = results[0].status === 'fulfilled' ? results[0].value : null;
    const edgeInfo = results[1].status === 'fulfilled' ? results[1].value : null;
    datasetInfo = cloudInfo || edgeInfo || datasetInfo;
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
    const url = target === 'cloud' ? `${CLOUD_URL}?size=${size}` : `${EDGE_URL}?size=${size}`;
    const metricElement = target === 'cloud' ? document.getElementById('cloudLatency') : document.getElementById('edgeLatency');

    metricElement.innerText = 'Mengambil data...';

    const startTime = performance.now();

    try {
        const response = await fetch(url);
        const result = await response.json();

        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(2);

        metricElement.innerText = `${latency} ms`;
        document.getElementById('dataLog').innerText = JSON.stringify(result.payload, null, 2);
        return { target, latency: Number(latency), payload: result.payload };
    } catch (error) {
        metricElement.innerText = 'Error / Offline';
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
    const [cloudResult, edgeResult] = await Promise.all([
        testLatency('cloud'),
        testLatency('edge')
    ]);

    if (isSessionActive) {
        const record = {
            id_skenario: `S${++sessionScenarioCounter}`,
            jumlah_record: size,
            latensi_edge_ms: edgeResult && edgeResult.latency !== null ? edgeResult.latency : null,
            latensi_cloud_ms: cloudResult && cloudResult.latency !== null ? cloudResult.latency : null
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