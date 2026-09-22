Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead('notes/GreenlifeAI_Backend_Product_Requirements_Document.docx')
$stream = $zip.GetEntry('word/document.xml').Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$text = $xml -replace '<w:p[^>]*>', "`n" -replace '<[^>]+>', ' ' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace ' +', ' '

$idx1 = $text.IndexOf('4 Authentication Authorization and Users')
$idx2 = $text.IndexOf('4 Authentication Authorization and Users', $idx1 + 40)
if ($idx2 -ge 0) {
    Write-Host "=== SECTION 4 CONTENT ==="
    $len = [Math]::Min(5000, $text.Length - $idx2)
    Write-Host $text.Substring($idx2, $len)
}
