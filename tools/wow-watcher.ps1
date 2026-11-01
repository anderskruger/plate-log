# Plate Log WoW watcher: when World of Warcraft starts on this PC, your phone gets a notification that starts
# quest mode in Plate Log; when it closes, one that ends it. Runs hidden at login (set up by install-wow-watcher.ps1).
#
# The notification goes through ntfy (https://ntfy.sh) to a private channel name kept outside the repo in
# %USERPROFILE%\.plate-log\ntfy-topic.txt. It carries only "WoW started/closed" and the time.
#
#   wow-watcher.ps1          watch for WoW (what the login task runs)
#   wow-watcher.ps1 -Test    send one test notification and exit
param(
  [switch]$Test,
  [int]$Every = 30,              # seconds between checks
  [int]$GraceMinutes = 3         # WoW gone this long counts as closed (a restart or crash doesn't end the session)
)
$ErrorActionPreference = 'Stop'
$server = 'https://ntfy.sh'
$topic = (Get-Content (Join-Path $env:USERPROFILE '.plate-log\ntfy-topic.txt')).Trim()

# World of Warcraft's game processes: Wow, WowClassic, WowB, WowT and the like, but not WowUp (an addon manager)
# or WowVoiceProxy (WoW's own voice chat helper).
function Get-Wow {
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match '^Wow' -and $_.ProcessName -notmatch '^(WowUp|WowVoiceProxy)' } |
    Sort-Object { try { $_.StartTime } catch { [datetime]::Now } } |
    Select-Object -First 1
}
function Get-Ms([datetime]$t) { [DateTimeOffset]::new($t.ToUniversalTime()).ToUnixTimeMilliseconds() }
function Send-Note([string]$title, [string]$message, [string]$link, [string]$tags) {
  $headers = @{ Title = $title; Tags = $tags; Priority = 'high'; Click = $link; Actions = "view, Open Plate Log, $link, clear=true" }
  for ($try = 1; $try -le 3; $try++) {
    try { Invoke-RestMethod -Method Post -Uri "$server/$topic" -Body $message -Headers $headers -TimeoutSec 15 | Out-Null; return }
    catch { Start-Sleep -Seconds (10 * $try) }
  }
}

if ($Test) {
  Send-Note 'Plate Log is connected' 'Tap to check that your PC can reach Plate Log.' "platelog://quest/test?at=$(Get-Ms ([datetime]::Now))" 'white_check_mark'
  Write-Output "Test notification sent to $server/$topic"
  exit
}

$running = $false; $goneSince = $null
while ($true) {
  $wow = Get-Wow
  if ($wow) {
    $goneSince = $null
    if (-not $running) {
      $running = $true
      $started = try { $wow.StartTime } catch { [datetime]::Now }
      Send-Note 'WoW started' 'Tap to start quest mode.' "platelog://quest/start?at=$(Get-Ms $started)" 'crossed_swords'
    }
  } elseif ($running) {
    if (-not $goneSince) { $goneSince = [datetime]::Now }
    elseif (([datetime]::Now - $goneSince).TotalMinutes -ge $GraceMinutes) {
      $running = $false
      Send-Note 'WoW closed' 'Tap to end quest mode and see your results.' "platelog://quest/end?at=$(Get-Ms $goneSince)" 'checkered_flag'
      $goneSince = $null
    }
  }
  Start-Sleep -Seconds $Every
}
