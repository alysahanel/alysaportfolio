$files = Get-ChildItem "gams\public" -Recurse -Include *.html,*.js
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Regex to match quote/backtick followed by /api/ and replace with /gams/api/
    # The regex is: (['"`])/api/ -> $1/gams/api/
    # In PowerShell single-quoted string:
    # ' matches '
    # " matches "
    # ` matches `
    # So character class is [`'""]
    # Escaping for PS string:
    # ' -> ''
    # " -> "
    # ` -> `
    # So '([`''"])/api/'
    
    $newContent = $content -replace '([`''"])/api/', '$1/gams/api/'
    
    if ($content -ne $newContent) {
        Write-Host "Updating $($file.Name)"
        $newContent | Set-Content $file.FullName -NoNewline -Encoding UTF8
    }
}
Write-Host "Done."
