# Plate Log WoW watcher: when World of Warcraft starts on this PC, your phone gets a notification that starts
# quest mode in Plate Log; when it closes, one that ends it. Runs without a window at login, and Task Scheduler
# starts it again within 5 minutes if it ever stops (set up by install-wow-watcher.ps1).
#
# The notification goes through ntfy (https://ntfy.sh) to a private channel name kept outside the repo in
# %USERPROFILE%\.plate-log\ntfy-topic.txt. It carries only "WoW started/closed" and the time.
# What it did is logged to %LOCALAPPDATA%\PlateLog\watcher.log.
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
$dataDir = Join-Path $env:LOCALAPPDATA 'PlateLog'
$logFile = Join-Path $dataDir 'watcher.log'
$stateFile = Join-Path $dataDir 'watcher-state.json'   # survives a restart, so WoW isn't announced twice
New-Item -ItemType Directory -Force $dataDir | Out-Null

function Write-Log([string]$line) {
  try {
    if ((Test-Path $logFile) -and (Get-Item $logFile).Length -gt 200KB) { Move-Item $logFile "$logFile.old" -Force }
    Add-Content -Path $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $line"
  } catch {}
}
# World of Warcraft's game processes: Wow, WowClassic, WowB, WowT and the like, but not WowUp (an addon manager)
# or WowVoiceProxy (WoW's own voice chat helper).
function Get-Wow {
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { try { $_.ProcessName -match '^Wow' -and $_.ProcessName -notmatch '^(WowUp|WowVoiceProxy)' } catch { $false } } |
    Sort-Object { try { $_.StartTime } catch { [datetime]::Now } } |
    Select-Object -First 1
}
function Get-Ms([datetime]$t) { [DateTimeOffset]::new($t.ToUniversalTime()).ToUnixTimeMilliseconds() }
function Send-Note([string]$title, [string]$message, [string]$link, [string]$tags) {
  $headers = @{ Title = $title; Tags = $tags; Priority = 'high'; Click = $link; Actions = "view, Open Plate Log, $link, clear=true" }
  for ($try = 1; $try -le 3; $try++) {
    try { Invoke-RestMethod -Method Post -Uri "$server/$topic" -Body $message -Headers $headers -TimeoutSec 15 | Out-Null; Write-Log "sent: $title"; return }
    catch { Write-Log "sending '$title' failed (try $try): $($_.Exception.Message)"; Start-Sleep -Seconds (10 * $try) }
  }
}
function Save-State($state) { try { $state | ConvertTo-Json | Set-Content $stateFile -Encoding ascii } catch {} }

if ($Test) {
  Send-Note 'Plate Log is connected' 'Tap to check that your PC can reach Plate Log.' "platelog://quest/test?at=$(Get-Ms ([datetime]::Now))" 'white_check_mark'
  Write-Output "Test notification sent to $server/$topic"
  exit
}

# running: WoW was announced as started; startedMs: when that WoW started; goneMs: when it disappeared
$state = @{ running = $false; startedMs = 0; goneMs = 0 }
try { $saved = Get-Content $stateFile -Raw | ConvertFrom-Json; $state = @{ running = [bool]$saved.running; startedMs = [long]$saved.startedMs; goneMs = [long]$saved.goneMs } } catch {}
Write-Log "watcher started (pid $PID, WoW announced: $($state.running))"

try {
  while ($true) {
    $wow = Get-Wow
    $nowMs = Get-Ms ([datetime]::Now)
    if ($wow) {
      $state.goneMs = 0
      if (-not $state.running) {
        $started = try { Get-Ms $wow.StartTime } catch { $nowMs }
        $state.running = $true; $state.startedMs = $started
        Write-Log "WoW started ($($wow.ProcessName), pid $($wow.Id))"
        Send-Note 'WoW started' 'Tap to start quest mode.' "platelog://quest/start?at=$started" 'crossed_swords'
      }
      Save-State $state
    } elseif ($state.running) {
      if (-not $state.goneMs) { $state.goneMs = $nowMs; Write-Log 'WoW is gone, waiting to see if it comes back' }
      elseif ($nowMs - $state.goneMs -ge $GraceMinutes * 60000) {
        Write-Log 'WoW closed'
        Send-Note 'WoW closed' 'Tap to end quest mode and see your results.' "platelog://quest/end?at=$($state.goneMs)" 'checkered_flag'
        $state = @{ running = $false; startedMs = 0; goneMs = 0 }
      }
      Save-State $state
    }
    Start-Sleep -Seconds $Every
  }
} finally {
  Write-Log 'watcher stopped'
}
