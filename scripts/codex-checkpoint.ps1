param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [switch]$SkipChecks
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

function Invoke-ProjectChecks {
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
}

$branch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read current Git branch."
}

if ($branch -eq 'main' -or $branch -eq 'master') {
    throw "Refusing to checkpoint on '$branch'. Use a codex/* feature branch."
}

if (-not $branch.StartsWith('codex/')) {
    throw "Current branch '$branch' is not a codex/* branch."
}

foreach ($file in $Files) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "File not found: $file"
    }
}

if (-not $SkipChecks) {
    Invoke-ProjectChecks
}

& git add -- @Files
if ($LASTEXITCODE -ne 0) {
    throw "git add failed."
}

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No staged changes to commit."
    exit 0
}

& git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    throw "git commit failed."
}

& git status --short --branch
