Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ss531\.gemini\antigravity\scratch\room-hisaab\screenshots\dashboard.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

# The dashboard is in the top 165 pixels of this 233-pixel image (the bottom 68 pixels is the chat bubble)
$rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, 165)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)
$bmp.Dispose()

$cropped.Save("C:\Users\ss531\.gemini\antigravity\scratch\room-hisaab\screenshots\dashboard_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Move-Item -Path "C:\Users\ss531\.gemini\antigravity\scratch\room-hisaab\screenshots\dashboard_clean.png" -Destination $srcPath -Force
Write-Output "Clean dashboard image saved"
