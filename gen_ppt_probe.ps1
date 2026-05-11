$ErrorActionPreference = 'Stop'

try {
  $app = New-Object -ComObject PowerPoint.Application
  Write-Host "PowerPoint COM OK"
  $app.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)
} catch {
  Write-Host ("PowerPoint COM FAILED: " + $_.Exception.Message)
}

