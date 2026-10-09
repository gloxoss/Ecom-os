$ErrorActionPreference = 'Stop'
$localCertificate = Join-Path $env:APPDATA 'Local/run/router/nginx/certs/paraloca.local.crt'
if (-not (Test-Path -LiteralPath $localCertificate)) {
    throw 'Start the paraloca site in Local before launching the storefront.'
}
# Trust only Local's site certificate for this process. Keep TLS validation enabled.
$previousCertificate = $env:NODE_EXTRA_CA_CERTS
$env:NODE_EXTRA_CA_CERTS = $localCertificate
Push-Location (Join-Path $PSScriptRoot '..')
try {
    pnpm dev
    if ($LASTEXITCODE -ne 0) { throw 'Storefront development server stopped with an error.' }
} finally {
    Pop-Location
    $env:NODE_EXTRA_CA_CERTS = $previousCertificate
}
