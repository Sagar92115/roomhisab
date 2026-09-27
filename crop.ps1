Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ss531\.gemini\antigravity\brain\e9dbe92a-a3d2-46e8-b2f7-8b15721b1a0a\.user_uploaded\media_1790480742948.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$destDir = "C:\Users\ss531\.gemini\antigravity\scratch\room-hisaab\screenshots"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$x = 447
$y = 40
$w = 452
$h = 233

$rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)

$destPath = Join-Path $destDir "dashboard.png"
$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$bmp.Dispose()

Write-Output "Successfully saved cropped image to $destPath"
