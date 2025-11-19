$folderPath = "C:\Users\gaulinmp\Dropbox\Documents\School\_classes\5150_Analytics\slides"

$app = New-Object -ComObject PowerPoint.Application

try {
    Get-ChildItem -Path $folderPath -Filter "*.pptx" -Recurse |
    Where-Object { $_.Name -match '^\d-UG' } |
    ForEach-Object {
        $pptxPath = $_.FullName
        $pdfPath = $pptxPath -replace '\.pptx$', '.pdf'

        Write-Host "Converting: $($_.Name)"

        $presentation = $app.Presentations.Open($pptxPath, $true, $true, $false)
        $presentation.SaveAs($pdfPath, 32)
        $presentation.Close()
    }
} finally {
    $app.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app) | Out-Null
}
