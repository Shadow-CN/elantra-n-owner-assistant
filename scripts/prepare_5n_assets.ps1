$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetRoot = Join-Path $PSScriptRoot '../assets/knowledge/ioniq5n'
[IO.Directory]::CreateDirectory($assetRoot) | Out-Null
$encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$parameters = [Drawing.Imaging.EncoderParameters]::new(1)
$parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]78)
try {
  foreach ($category in @('charging','infotainment','maintenance','faq')) {
    $folder = Join-Path $PSScriptRoot "../ioniq_5n_china_owner_wiki-main/docs/$category"
    foreach ($file in (Get-ChildItem -LiteralPath $folder -File | Where-Object { $_.Extension -in @('.png','.jpg') })) {
      $source = [Drawing.Image]::FromFile($file.FullName)
      try {
        $scale = [Math]::Min(1.0, 1024.0 / [Math]::Max($source.Width, $source.Height))
        $bitmap = [Drawing.Bitmap]::new([int]($source.Width * $scale), [int]($source.Height * $scale))
        try {
          $graphics = [Drawing.Graphics]::FromImage($bitmap)
          try {
            $graphics.Clear([Drawing.Color]::White)
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($source, 0, 0, $bitmap.Width, $bitmap.Height)
          } finally { $graphics.Dispose() }
          $bitmap.Save((Join-Path $assetRoot "$category-$($file.BaseName).jpg"), $encoder, $parameters)
        } finally { $bitmap.Dispose() }
      } finally { $source.Dispose() }
    }
  }
} finally { $parameters.Dispose() }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../ioniq_5n_china_owner_wiki-main/docs/public/manual/vehicle_i5n.rcz') -Destination (Join-Path $assetRoot 'vehicle_i5n.rcz')
Get-ChildItem -LiteralPath $assetRoot -File | Measure-Object Length -Sum | Select-Object Count,Sum
