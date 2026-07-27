# Installs Apache Maven through Windows Package Manager (winget).
# Run from PowerShell: .\setup-maven.ps1
winget install --id Apache.Maven --exact --source winget
Write-Host "Close and reopen PowerShell, then run: mvn --version"
