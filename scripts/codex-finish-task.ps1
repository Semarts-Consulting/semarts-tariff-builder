param(
    [switch]$Push
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

function Invoke-CommandChecked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Get-PackageScripts {
    if (-not (Test-Path -LiteralPath 'package.json')) {
        return @{}
    }

    $package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    $scripts = @{}
    if ($package.PSObject.Properties.Name -contains 'scripts') {
        foreach ($property in $package.scripts.PSObject.Properties) {
            $scripts[$property.Name] = [string]$property.Value
        }
    }
    return $scripts
}

$branch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read current Git branch."
}

if ($branch -eq 'main' -or $branch -eq 'master') {
    throw "Refusing to finish on '$branch'. Use a codex/* feature branch."
}

if (-not $branch.StartsWith('codex/')) {
    throw "Current branch '$branch' is not a codex/* branch."
}

$dirty = (& git status --porcelain)
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read Git status."
}

if ($dirty) {
    Write-Host "Working tree is not clean. Commit or revert intended changes before finishing:"
    & git status --short --branch
    exit 1
}

$scripts = Get-PackageScripts
if ($scripts.ContainsKey('lint')) {
    Invoke-CommandChecked -Command 'npm.cmd' -Arguments @('run', 'lint')
}
if ($scripts.ContainsKey('typecheck')) {
    Invoke-CommandChecked -Command 'npm.cmd' -Arguments @('run', 'typecheck')
} elseif ($scripts.ContainsKey('type-check')) {
    Invoke-CommandChecked -Command 'npm.cmd' -Arguments @('run', 'type-check')
} else {
    Invoke-CommandChecked -Command 'npx.cmd' -Arguments @('tsc', '--noEmit', '--incremental', 'false')
}
if ($scripts.ContainsKey('test')) {
    Invoke-CommandChecked -Command 'npm.cmd' -Arguments @('test')
}
if ($scripts.ContainsKey('build')) {
    Invoke-CommandChecked -Command 'npm.cmd' -Arguments @('run', 'build')
}

if ($Push) {
    Invoke-CommandChecked -Command 'git' -Arguments @('push', '-u', 'origin', $branch)
} else {
    Write-Host "Push not run. After approval, use:"
    Write-Host "cd `"C:\Projects\Semarts Tariff Builder`""
    Write-Host "git push -u origin $branch"
}

& git status --short --branch
