$source = "C:\Users\niranjan\Downloads\screen-to-code-sidekick-main"
$dest1 = "C:\Users\niranjan\Downloads\DHRU.AI-Final-Fixed-Project.zip"
$dest2 = "C:\Users\niranjan\.gemini\antigravity\brain\7545e735-0d8c-47f4-ae72-5eec3986c859\DHRU.AI-Final-Fixed-Project.zip"

$tempFolder = Join-Path $env:TEMP "dhru-ai-export"
if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
New-Item -ItemType Directory -Path $tempFolder | Out-Null

$items = Get-ChildItem -Path $source -Exclude "node_modules", ".git", "*.zip"
foreach ($item in $items) {
    Copy-Item -Path $item.FullName -Destination $tempFolder -Recurse
}

if (Test-Path $dest1) { Remove-Item -Force $dest1 }
if (Test-Path $dest2) { Remove-Item -Force $dest2 }

Compress-Archive -Path "$tempFolder\*" -DestinationPath $dest1 -Force
Copy-Item $dest1 $dest2 -Force
Remove-Item -Recurse -Force $tempFolder
Write-Output "Zip archive created successfully at $dest1 and $dest2"
