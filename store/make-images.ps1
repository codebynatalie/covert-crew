# Renders the store screenshots and promo art with headless Microsoft Edge.
# Output: store\images\*.png
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$out = Join-Path $here 'images'
New-Item -ItemType Directory -Force $out | Out-Null

$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge was not found.' }

# A throwaway browser profile so this never touches your real Edge profile.
$profile = Join-Path ([IO.Path]::GetTempPath()) 'covert-crew-shots'

$base = ([Uri](Join-Path $here 'screens')).AbsoluteUri
$shots = @(
  @{ file = 'screenshot-1-pages.png';    url = "$base/scene.html?s=1"; w = 1280; h = 800 },
  @{ file = 'screenshot-2-search.png';   url = "$base/scene.html?s=2"; w = 1280; h = 800 },
  @{ file = 'screenshot-3-play.png';     url = "$base/scene.html?s=3"; w = 1280; h = 800 },
  @{ file = 'screenshot-4-together.png'; url = "$base/scene.html?s=4"; w = 1280; h = 800 },
  @{ file = 'screenshot-5-settings.png'; url = "$base/scene.html?s=5"; w = 1280; h = 800 },
  @{ file = 'promo-small-440x280.png';   url = "$base/promo.html?kind=small";   w = 440;  h = 280 },
  @{ file = 'promo-marquee-1400x560.png'; url = "$base/promo.html?kind=marquee"; w = 1400; h = 560 },
  @{ file = 'logo-300x300.png';          url = "$base/promo.html?kind=logo";    w = 300;  h = 300 }
)

foreach ($s in $shots) {
  $png = Join-Path $out $s.file
  if (Test-Path $png) { Remove-Item $png }
  $args = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    "--user-data-dir=$profile", '--allow-file-access-from-files', '--force-device-scale-factor=1',
    "--window-size=$($s.w),$($s.h)", '--virtual-time-budget=9000', "--screenshot=$png", $s.url
  )
  $p = Start-Process -FilePath $edge -ArgumentList $args -PassThru -Wait -WindowStyle Hidden
  if (-not (Test-Path $png)) { throw "Edge didn't produce $($s.file)" }
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($png); $size = "$($img.Width)x$($img.Height)"; $img.Dispose()
  "{0,-30} {1}" -f $s.file, $size
}
