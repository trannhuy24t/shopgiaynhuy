$ErrorActionPreference = 'Stop'

$projectPath = Join-Path $PSScriptRoot 'ShopAPI.csproj'
$secretLines = & dotnet user-secrets list --project $projectPath
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read ShopAPI user-secrets.'
}

$connectionLine = $secretLines | Where-Object { $_ -match '^\s*ConnectionStrings:DefaultConnection\s*=' } | Select-Object -First 1
if (-not $connectionLine) {
    throw 'ConnectionStrings:DefaultConnection is not configured in user-secrets.'
}

$connectionString = ($connectionLine -split '=', 2)[1].Trim().Trim('"')
$serverMatch = [regex]::Match($connectionString, '(?i)(?:Data Source|Server)\s*=\s*([^;]+)')
if (-not $serverMatch.Success) {
    throw 'The SQL connection string has no server name.'
}

$serverName = $serverMatch.Groups[1].Value.Trim()
$serverHost = (($serverName -replace '^tcp:', '') -replace '[\\,].*$', '').Trim('[', ']')
$localNames = @('.', '(local)', 'localhost', '127.0.0.1', '::1', $env:COMPUTERNAME)
if ($serverHost -notin $localNames) {
    throw 'Refusing to disable encryption for a database that is not on this machine.'
}

# Local development only. The override is not saved, and the API binds to localhost.
if ($connectionString -match '(?i)Encrypt\s*=') {
    $connectionString = [regex]::Replace($connectionString, '(?i)Encrypt\s*=\s*[^;]+', 'Encrypt=False')
} else {
    $connectionString += ';Encrypt=False'
}

$previousEnvironment = [Environment]::GetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Process')
$previousConnectionString = [Environment]::GetEnvironmentVariable('ConnectionStrings__DefaultConnection', 'Process')

try {
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ConnectionStrings__DefaultConnection = $connectionString
    & dotnet run --no-launch-profile --project $projectPath --urls 'http://localhost:5141'
    $exitCode = $LASTEXITCODE
} finally {
    if ($null -eq $previousEnvironment) {
        Remove-Item Env:ASPNETCORE_ENVIRONMENT -ErrorAction SilentlyContinue
    } else {
        $env:ASPNETCORE_ENVIRONMENT = $previousEnvironment
    }

    if ($null -eq $previousConnectionString) {
        Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
    } else {
        $env:ConnectionStrings__DefaultConnection = $previousConnectionString
    }
}

exit $exitCode
