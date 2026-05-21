$filePath = "c:\Users\hautl\Documents\EG-Maps\public\data\species.json"

Write-Host "Reading file..."
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

Write-Host "Fixing encoding issues..."

# The issue: UTF-8 bytes were incorrectly interpreted as Latin-1, then re-encoded as UTF-8
# To fix: treat the current UTF-8 string as Latin-1 bytes, then convert to UTF-8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$latin1Decoded = [System.Text.Encoding]::Latin1.GetString($bytes)
$fixed = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Latin1.GetBytes($latin1Decoded))

# Additional cleanup for any remaining artifacts
$replacements = @{
    'Â°' = '°'
    'Â»' = '»'
    'Â«' = '«'
    'Â©' = '©'
    'Â®' = '®'
    'Â™' = '™'
    'Â ' = ''
}

foreach ($wrong in $replacements.Keys) {
    $fixed = $fixed -replace [regex]::Escape($wrong), $replacements[$wrong]
}

# Validate JSON
try {
    $parsed = $fixed | ConvertFrom-Json
    Write-Host "JSON is valid"
    Write-Host "Total species: $($parsed.Count)"
} catch {
    Write-Host "WARNING: JSON may be invalid after fixes: $_"
}

# Write fixed content
Set-Content -Path $filePath -Value $fixed -Encoding UTF8
Write-Host "File encoding fixed and saved!"