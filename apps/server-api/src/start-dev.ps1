param(
    [string]$WorkerUpdateUrl = "https://edge-node.mhfarhianalmz.workers.dev/update-url",
    [string]$WorkerSecret = "23102002"
)

$ErrorActionPreference = 'Stop'
$composeFile = Join-Path $PSScriptRoot 'docker-compose-2.yml'

if ([string]::IsNullOrWhiteSpace($WorkerUpdateUrl)) {
    throw 'Set WORKER_UPDATE_URL to the Worker endpoint ending in /update-url.'
}
if ([string]::IsNullOrWhiteSpace($WorkerSecret)) {
    throw 'Set WORKER_UPDATE_SECRET to the Worker UPDATE_SECRET value.'
}

$workerUri = $null
if (-not [Uri]::TryCreate($WorkerUpdateUrl, [UriKind]::Absolute, [ref]$workerUri) `
    -or $workerUri.Scheme -ne 'https' `
    -or -not $workerUri.AbsolutePath.TrimEnd('/').EndsWith('/update-url', [StringComparison]::Ordinal)) {
    throw 'WORKER_UPDATE_URL must be an HTTPS URL ending in /update-url.'
}

Push-Location $PSScriptRoot
try {
    & docker compose -f $composeFile up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose failed to build or start the API and tunnel.'
    }

    # Recreate only cloudflared so its log contains the newly generated Quick Tunnel URL.
    & docker compose -f $composeFile up -d --force-recreate tunnel
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose failed to restart the Cloudflare tunnel.'
    }

    Write-Host 'Menunggu URL Quick Tunnel baru dari Cloudflare...' -ForegroundColor Yellow
    $tunnelUrl = $null
    $deadline = (Get-Date).AddSeconds(90)

    while ((Get-Date) -lt $deadline -and -not $tunnelUrl) {
        $logLines = & docker compose -f $composeFile logs --no-color --tail 100 tunnel 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Gagal membaca log Cloudflare Tunnel: $($logLines -join [Environment]::NewLine)"
        }

        $logText = $logLines -join [Environment]::NewLine
        $matches = [regex]::Matches($logText, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
        if ($matches.Count -gt 0) {
            $tunnelUrl = $matches[$matches.Count - 1].Value
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $tunnelUrl) {
        $logLines = & docker compose -f $composeFile logs --no-color --tail 100 tunnel 2>&1
        throw "URL Quick Tunnel tidak ditemukan setelah 90 detik. Log tunnel:`n$($logLines -join [Environment]::NewLine)"
    }

    Write-Host "URL Tunnel ditemukan: $tunnelUrl" -ForegroundColor Green

    $headers = @{ 'X-Secret-Key' = $WorkerSecret }
    $body = @{ url = $tunnelUrl } | ConvertTo-Json -Compress
    $response = Invoke-RestMethod `
        -Uri $WorkerUpdateUrl `
        -Method Post `
        -Headers $headers `
        -ContentType 'application/json' `
        -Body $body `
        -TimeoutSec 30

    if (-not $response.success) {
        throw "Worker menolak pembaruan URL tunnel: $($response.error)"
    }

    Write-Host "STATUS EDGE: $($response.message)" -ForegroundColor Green
}
finally {
    Pop-Location
}