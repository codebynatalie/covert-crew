# Packages the extension for the Chrome Web Store and Microsoft Edge Add-ons.
# Output: dist\covert-crew-<version>.zip (only the files the extension needs).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.description.Length -gt 132) { throw "manifest description is $($manifest.description.Length) characters; the Chrome Web Store allows 132." }

$include = @('manifest.json', 'content', 'popup', 'icons')
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zipPath = Join-Path $dist ("covert-crew-{0}.zip" -f $manifest.version)
if (Test-Path $zipPath) { Remove-Item $zipPath }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  foreach ($item in $include) {
    $full = Join-Path $root $item
    $files = if (Test-Path $full -PathType Container) { Get-ChildItem $full -Recurse -File } else { Get-Item $full }
    foreach ($f in $files) {
      # Store paths with forward slashes so every store unpacks them correctly.
      $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel, 'Optimal') | Out-Null
    }
  }
} finally {
  $zip.Dispose()
}

$z = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
"Created $zipPath ({0:N0} KB, {1} files):" -f ((Get-Item $zipPath).Length / 1KB), $z.Entries.Count
$z.Entries | ForEach-Object { "  " + $_.FullName }
$z.Dispose()
