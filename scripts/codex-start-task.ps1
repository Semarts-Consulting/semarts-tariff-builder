param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^codex\/.+')]
    [string]$BranchName,

    [switch]$CreateBranch
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

$status = (& git status --porcelain)
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read Git status."
}

if ($status) {
    Write-Host "Working tree has changes. Review before starting a new task:"
    & git status --short --branch
    exit 1
}

$currentBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read current Git branch."
}

Write-Host "Current branch: $currentBranch"
Invoke-Git -Arguments @('status', '--short', '--branch')
Invoke-Git -Arguments @('log', '--oneline', '-5')

if ($CreateBranch) {
    if ($currentBranch -ne 'main') {
        throw "CreateBranch requires starting from main. Current branch is '$currentBranch'."
    }

    Invoke-Git -Arguments @('pull')
    Invoke-Git -Arguments @('switch', '-c', $BranchName)
    Invoke-Git -Arguments @('status', '--short', '--branch')
} else {
    Write-Host "Branch creation not requested. To create it, rerun with -CreateBranch."
}
