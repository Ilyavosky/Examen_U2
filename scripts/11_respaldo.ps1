$ErrorActionPreference = "Stop"

if (-not $env:MONGO_URI) {
  Write-Host "Define primero la variable de entorno MONGO_URI con el usuario admin_tienda."
  exit 1
}

$dir = Join-Path $PSScriptRoot "..\respaldo"
New-Item -ItemType Directory -Force $dir | Out-Null
$archive = Join-Path $dir "respaldo_comercio_u2.gz"

Write-Host "=== mongodump: comercio_u2 -> archivo comprimido ==="
mongodump --uri="$env:MONGO_URI" --db=comercio_u2 --gzip --archive="$archive"
if ($LASTEXITCODE -ne 0) { throw "mongodump fallo" }

$info = Get-Item $archive
Write-Host ("archivo: " + $info.Name + " | bytes: " + $info.Length + " | fecha: " + $info.LastWriteTime)

Write-Host "=== mongorestore: comercio_u2 -> comercio_u2_restaurada ==="
mongorestore --uri="$env:MONGO_URI" --gzip --archive="$archive" --nsFrom="comercio_u2.*" --nsTo="comercio_u2_restaurada.*"
if ($LASTEXITCODE -ne 0) { throw "mongorestore fallo" }

Write-Host "Respaldo y restauracion terminados."
