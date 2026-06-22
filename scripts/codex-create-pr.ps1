param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [string]$Body,

    [string]$Base = 'main'
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$branch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read current Git branch."
}

if ($branch -eq 'main' -or $branch -eq 'master') {
    throw "Refusing to create a PR from '$branch'. Use a codex/* feature branch."
}

if (-not $branch.StartsWith('codex/')) {
    throw "Current branch '$branch' is not a codex/* branch."
}

$dirty = (& git status --porcelain)
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read Git status."
}

if ($dirty) {
    Write-Host "Working tree is not clean. Commit or revert intended changes before creating a PR:"
    & git status --short --branch
    exit 1
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($null -ne $gh) {
    & gh pr create --base $Base --head $branch --title $Title --body $Body
    if ($LASTEXITCODE -ne 0) {
        throw "gh pr create failed."
    }
    exit 0
}

Write-Host "GitHub CLI was not found. Run this command from a shell where gh is available:"
Write-Host "cd `"C:\Projects\Semarts Tariff Builder`""
Write-Host "gh pr create --base $Base --head $branch --title `"$Title`" --body `"$Body`""
Write-Host "Or open:"
Write-Host "https://github.com/Semarts-Consulting/semarts-tariff-builder/pull/new/$branch"
