$folderPath = "C:\Users\gaulinmp\Dropbox\Documents\School\_classes\5150_Analytics\slides"

$app = New-Object -ComObject PowerPoint.Application

try {
    Get-ChildItem -Path $folderPath -Filter "*.pptx" -Recurse |
    Where-Object { $_.Name -match '^\d+\.\d-' } |
    ForEach-Object {
        $pptxPath = $_.FullName
        $pdfPath = $pptxPath -replace '\.pptx$', '.pdf'

        if (Test-Path $pdfPath) {
            Write-Host "Skipping: $($_.Name) (PDF already exists)" -ForegroundColor Cyan
            return
        }

        Write-Host "Converting: $($_.Name)"

        try {
            $presentation = $app.Presentations.Open($pptxPath, $true, $true, $false)
            $presentation.SaveAs($pdfPath, 32)
            $presentation.Close()
            Write-Host "  ✓ Success: $($_.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Failed: $($_.Name)" -ForegroundColor Red
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} finally {
    $app.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app) | Out-Null
}

Write-Host "`nConversion complete. Press Enter to exit..." -ForegroundColor Green
Read-Host
