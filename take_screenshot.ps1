$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$dest = "C:\Users\ss531\.gemini\antigravity\scratch\room-hisaab\screenshots\edge_test.png"
Start-Process -FilePath $edgePath -ArgumentList "--headless --disable-gpu --window-size=1280,800 --screenshot=`"$dest`" http://localhost:5000" -Wait
Write-Output "Screenshot taken: $(Test-Path $dest)"
