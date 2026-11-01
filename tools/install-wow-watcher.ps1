# One-time setup for the Plate Log WoW watcher (see wow-watcher.ps1).
#   - picks a private ntfy channel name and keeps it in %USERPROFILE%\.plate-log\ntfy-topic.txt
#   - copies the watcher to %LOCALAPPDATA%\PlateLog and adds a Task Scheduler task that runs it, without a window,
#     when you log in (and starts it again if it ever stops)
# Running it again updates the watcher and keeps your channel name.
#   - starts it now and sends a test notification
# Run it in PowerShell from this folder:   powershell -ExecutionPolicy Bypass -File .\install-wow-watcher.ps1
# Remove everything again:                 powershell -ExecutionPolicy Bypass -File .\install-wow-watcher.ps1 -Remove
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$taskName = 'Plate Log WoW watcher'
$configDir = Join-Path $env:USERPROFILE '.plate-log'
$topicFile = Join-Path $configDir 'ntfy-topic.txt'
$appDir = Join-Path $env:LOCALAPPDATA 'PlateLog'
$watcher = Join-Path $appDir 'wow-watcher.ps1'

if ($Remove) {
  Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | ForEach-Object { Stop-ScheduledTask -TaskName $taskName; Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -match 'wow-watcher\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Remove-Item $appDir -Recurse -Force -ErrorAction SilentlyContinue
  Write-Output "Removed the task and $appDir. Your channel name is still in $topicFile (delete it if you like)."
  exit
}

# a channel name nobody can guess: anyone who knows it could send you notifications
New-Item -ItemType Directory -Force $configDir | Out-Null
if (-not (Test-Path $topicFile)) {
  $chars = 'abcdefghijkmnpqrstuvwxyz23456789'.ToCharArray()
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $bytes = New-Object byte[] 12; $rng.GetBytes($bytes)
  Set-Content -Path $topicFile -Value ('platelog-' + -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })) -Encoding ascii
}
$topic = (Get-Content $topicFile).Trim()

New-Item -ItemType Directory -Force $appDir | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'wow-watcher.ps1') $watcher -Force

# stop a watcher that's already running (an earlier install), so the new one takes over
Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | ForEach-Object { Stop-ScheduledTask -TaskName $taskName }
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -match 'wow-watcher\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# conhost --headless: no window at all. (Windows 11 opens "-WindowStyle Hidden" PowerShell in a visible Windows
# Terminal tab, and closing that tab stops the watcher.)
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$watcher`""
# at login, and every 5 minutes after: if the watcher is running the repeat does nothing, if it stopped it starts again
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)).Repetition
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Tells Plate Log on your phone when World of Warcraft starts and closes.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

& $watcher -Test | Out-Null
Write-Output ''
Write-Output 'Plate Log WoW watcher is running (no window) and starts when you log in.'
Write-Output "What it does is logged to $appDir\watcher.log"
Write-Output ''
Write-Output 'On your phone, in the ntfy app: tap +, and subscribe to this topic (server ntfy.sh):'
Write-Output ''
Write-Output "    $topic"
Write-Output ''
Write-Output 'A test notification has just been sent there; once subscribed, use -Test to send another:'
Write-Output "    powershell -ExecutionPolicy Bypass -File `"$watcher`" -Test"
