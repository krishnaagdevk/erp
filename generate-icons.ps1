Add-Type -AssemblyName System.Drawing

$sourcePath = "$PSScriptRoot\public\logo.png"
$resBase = "$PSScriptRoot\android\app\src\main\res"

$img = [System.Drawing.Image]::FromFile($sourcePath)

$configs = @(
    @{ Folder = 'mipmap-mdpi'; Size = 48; ForeSize = 108 },
    @{ Folder = 'mipmap-hdpi'; Size = 72; ForeSize = 162 },
    @{ Folder = 'mipmap-xhdpi'; Size = 96; ForeSize = 216 },
    @{ Folder = 'mipmap-xxhdpi'; Size = 144; ForeSize = 324 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 192; ForeSize = 432 }
)

foreach ($cfg in $configs) {
    $dir = Join-Path $resBase $cfg.Folder
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

    # 1. Launcher and Round (Square / Clean fitted)
    $bmp = New-Object System.Drawing.Bitmap($cfg.Size, $cfg.Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $cfg.Size, $cfg.Size)
    $g.Dispose()

    $bmp.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # 2. Adaptive Foreground (with standard 66% safe area)
    $foreBmp = New-Object System.Drawing.Bitmap($cfg.ForeSize, $cfg.ForeSize)
    $fg = [System.Drawing.Graphics]::FromImage($foreBmp)
    $fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $fg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $fg.Clear([System.Drawing.Color]::Transparent)

    $innerSize = [int]($cfg.ForeSize * 0.70)
    $offset = [int](($cfg.ForeSize - $innerSize) / 2)
    $fg.DrawImage($img, $offset, $offset, $innerSize, $innerSize)
    $fg.Dispose()

    $foreBmp.Save((Join-Path $dir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $foreBmp.Dispose()
}

$img.Dispose()
Write-Host "Android icons successfully generated from public/logo.png!"
