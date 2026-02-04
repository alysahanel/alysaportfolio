$gamsPath = "gams\public"
$legalPath = "legal\frontend\public"

function Scan-Files($path, $prefix) {
    if (Test-Path $path) {
        $files = Get-ChildItem $path -Recurse -Include *.html,*.js
        Write-Host "Found $($files.Count) files in $path"
        foreach ($file in $files) {
            $content = Get-Content $file.FullName
            $lineNum = 0
            foreach ($line in $content) {
                $lineNum++
                # Check for href="/..." or src="/..." or location.href = '/...'
                # We want to find cases where it starts with / but NOT /$prefix/
                
                if ($line -match '(href|src|action)=["'']/(?!(gams|legal|assets)/)([^"'']+)["'']') {
                    Write-Host "[$($file.Name):$lineNum] $line"
                }
                if ($line -match 'location\.(href|assign)\s*=\s*[''"]/(?!(gams|legal|assets)/)([^''"]+)[''"]') {
                    Write-Host "[$($file.Name):$lineNum] $line"
                }
                if ($line -match 'fetch\([''"]/(?!(gams|legal|assets)/)([^''"]+)[''"]') {
                    Write-Host "[$($file.Name):$lineNum] $line"
                }
            }
        }
    } else {
        Write-Host "Path not found: $path"
    }
}

Write-Host "Scanning GAMS..."
Scan-Files $gamsPath "gams"

Write-Host "Scanning Legal..."
Scan-Files $legalPath "legal"
