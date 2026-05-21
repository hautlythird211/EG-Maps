$filePath = "public\data\species.json"
Write-Host "Reading file..."
$content = Get-Content -Path $filePath -Raw -Encoding UTF8
Write-Host "Fixing encoding..."
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$latin1Decoded = [System.Text.Encoding]::Latin1.GetString($bytes)
$fixed = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Latin1.GetBytes($latin1Decoded))
$fixed = $fixed -replace [char]0xC2 + [char]0xA0, ""
$fixed = $fixed -replace [char]0xC2 + [char]0xB0, [char]0xB0
$fixed = $fixed -replace [char]0xC2 + [char]0xBB, [char]0xBB
$fixed = $fixed -replace [char]0xC2 + [char]0xAB, [char]0xAB
try {
    $parsed = $fixed | ConvertFrom-Json
    Write-Host "JSON valid, species:" $parsed.Count
} catch {
    Write-Host "JSON error:" $_  
}
Set-Content -Path $filePath -Value $fixed -Encoding UTF8
Write-Host "Done!"