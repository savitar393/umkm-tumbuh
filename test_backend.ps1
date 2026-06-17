param(
    [string]$AuthURL = "http://localhost:8081",
    [string]$UserURL = "http://localhost:8082",
    [string]$TrainingURL = "http://localhost:8083"
)

$script:PassCount = 0
$script:FailCount = 0
$script:AdminToken = $null

function Write-Result {
    param([string]$Label, [bool]$Pass, [string]$Detail)
    $icon = if ($Pass) { "PASS" } else { "FAIL" }
    $color = if ($Pass) { "Green" } else { "Red" }
    $msg = "$icon | $Label"
    if ($Detail) { $msg += "`n  -> $Detail" }
    Write-Host $msg -ForegroundColor $color
    if ($Pass) { $script:PassCount++ } else { $script:FailCount++ }
}

function Call-Api {
    param(
        [string]$Method = "GET",
        [string]$Uri,
        [string]$Body,
        [string]$Token,
        [int]$ExpectedStatus = 200
    )
    try {
        $headers = @{}
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $headers
            ContentType = "application/json"
            UseBasicParsing = $true
        }
        if ($Body) { $params["Body"] = $Body }
        $resp = Invoke-WebRequest @params -TimeoutSec 15
        $status = [int]$resp.StatusCode
        return @{ Pass = ($status -eq $ExpectedStatus); Status = $status; Body = $resp.Content }
    }
    catch {
        $status = try { [int]$_.Exception.Response.StatusCode.value__ } catch { 0 }
        return @{ Pass = ($status -eq $ExpectedStatus); Status = $status; Body = $null }
    }
}

function Test-Api {
    param(
        [string]$Label,
        [string]$Method = "GET",
        [string]$Uri,
        [string]$Body,
        [string]$Token,
        [int]$ExpectedStatus = 200
    )
    $r = Call-Api -Method $Method -Uri $Uri -Body $Body -Token $Token -ExpectedStatus $ExpectedStatus
    Write-Result -Label $Label -Pass $r.Pass -Detail "HTTP $($r.Status)"
    return $r
}

function Sql {
    param([string]$Q)
    $r = docker exec umkm_postgres psql -U umkm_user -d umkm_tumbuh -t -A -c $Q 2>$null
    return ($r -replace '\s+$', '')
}

function Parse-Jwt {
    param([string]$Token)
    $parts = $Token.Split('.')
    if ($parts.Count -lt 2) { return $null }
    $payload = $parts[1] -replace '-', '+' -replace '_', '/'
    $pad = 4 - ($payload.Length % 4)
    if ($pad -ne 4) { $payload += '=' * $pad }
    try {
        $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
        return ($json | ConvertFrom-Json)
    } catch { return $null }
}

# ===== MAIN =====
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  UMKM TUMBUH - BACKEND INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Auth     : $AuthURL"
Write-Host "User     : $UserURL"
Write-Host "Training : $TrainingURL"
Write-Host "==============================================" -ForegroundColor Cyan

# ---- FASE 1: Health & Public Endpoints ----
Write-Host "`n--- FASE 1: Health Check & Public Endpoints ---" -ForegroundColor Yellow

Test-Api -Label "GET /api/v1/health (auth)" -Uri "$AuthURL/api/v1/health"
Test-Api -Label "GET /api/v1/health (user)" -Uri "$UserURL/api/v1/health"
Test-Api -Label "GET /api/v1/health (training)" -Uri "$TrainingURL/api/v1/health"
Test-Api -Label "GET /api/v1/health/db (training)" -Uri "$TrainingURL/api/v1/health/db"

$trainResult = Call-Api -Uri "$TrainingURL/api/v1/trainings"
$trainingCount = 0
$firstTrainingId = $null
if ($trainResult.Body) {
    $p = $trainResult.Body | ConvertFrom-Json
    $trainingCount = $p.trainings.Count
    if ($trainingCount -gt 0) { $firstTrainingId = $p.trainings[0].pelatihan_id }
}
Write-Result -Label "GET /api/v1/trainings ($trainingCount programs)" -Pass ($trainingCount -gt 0) -Detail "HTTP $($trainResult.Status)"

if ($firstTrainingId) {
    Test-Api -Label "GET /api/v1/trainings/$firstTrainingId (detail)" -Uri "$TrainingURL/api/v1/trainings/$firstTrainingId"
    Test-Api -Label "GET /api/v1/trainings/$firstTrainingId/detail (with modules)" -Uri "$TrainingURL/api/v1/trainings/$firstTrainingId/detail"
} else {
    Write-Result -Label "GET /api/v1/trainings/{id}" -Pass $false -Detail "No training ID"
    Write-Result -Label "GET /api/v1/trainings/{id}/detail" -Pass $false -Detail "No training ID"
}

# ---- FASE 2: Auth Flow ----
Write-Host "`n--- FASE 2: Auth Flow ---" -ForegroundColor Yellow

$r = Call-Api -Method POST -Uri "$AuthURL/api/v1/auth/login" -Body '{"email":"admin@example.com","password":"admin12345"}'
$loginOk = $r.Pass
$loginDetail = "HTTP $($r.Status)"
if ($r.Body) {
    try {
        $p = $r.Body | ConvertFrom-Json
        if ($p.access_token) {
            $script:AdminToken = $p.access_token
            $loginOk = $loginOk -and ($p.access_token.Length -gt 20)
            $claims = Parse-Jwt $script:AdminToken
            $loginDetail += " | sub=$($claims.sub) role=$($claims.role)"
        }
    } catch { $loginOk = $false }
}
Write-Result -Label "POST /api/v1/auth/login (admin correct)" -Pass $loginOk -Detail $loginDetail

Test-Api -Label "POST /api/v1/auth/login (wrong pw -> 401)" -Method POST -Uri "$AuthURL/api/v1/auth/login" -Body '{"email":"admin@example.com","password":"wrong"}' -ExpectedStatus 401

if ($script:AdminToken) {
    Test-Api -Label "GET /api/v1/auth/me (with token)" -Uri "$AuthURL/api/v1/auth/me" -Token $script:AdminToken
}

# ---- FASE 3: Protected Training Endpoints ----
Write-Host "`n--- FASE 3: Protected Training Endpoints ---" -ForegroundColor Yellow

Test-Api -Label "POST /api/v1/trainings/enroll (no token -> 401)" -Method POST -Uri "$TrainingURL/api/v1/trainings/enroll" -Body '{"umkm_id":"UMK000001","pelatihan_id":"PLT000015"}' -ExpectedStatus 401

if (-not $script:AdminToken) {
    Write-Host "  [SKIP] No token" -ForegroundColor Yellow
} else {
    $umkmId = "UMK000001"
    $pelatihanId = "PLT000015"
    $alreadyEnrolled = Sql "SELECT 1 FROM training.transaksi_pendaftaranpelatihan WHERE umkm_id='$umkmId' AND pelatihan_id='$pelatihanId' LIMIT 1"
    if ($alreadyEnrolled -eq "1") {
        $freePel = Sql "SELECT p.pelatihan_id FROM training.master_programpelatihan p WHERE p.status_pelatihan_id IN ('PUBLISHED','ONGOING') AND p.is_deleted=FALSE AND p.tanggal_publish IS NOT NULL AND NOT EXISTS (SELECT 1 FROM training.transaksi_pendaftaranpelatihan e WHERE e.pelatihan_id=p.pelatihan_id AND e.umkm_id='$umkmId') LIMIT 1"
        if ($freePel -match 'PLT') { $pelatihanId = $freePel.Trim() }
    }

    $eBody = "{`"umkm_id`":`"$umkmId`",`"pelatihan_id`":`"$pelatihanId`"}"
    Test-Api -Label "POST /api/v1/trainings/enroll (UMK000001 -> $pelatihanId)" -Method POST -Uri "$TrainingURL/api/v1/trainings/enroll" -Body $eBody -Token $script:AdminToken -ExpectedStatus 201

    Test-Api -Label "GET /api/v1/enrollments/user/$umkmId" -Uri "$TrainingURL/api/v1/enrollments/user/$umkmId" -Token $script:AdminToken

    Test-Api -Label "POST /api/v1/trainings/enroll (duplicate, idempotent)" -Method POST -Uri "$TrainingURL/api/v1/trainings/enroll" -Body $eBody -Token $script:AdminToken -ExpectedStatus 201

    $enrollId = Sql "SELECT pendaftaran_pelatihan_id FROM training.transaksi_pendaftaranpelatihan WHERE umkm_id='$umkmId' AND status_pendaftaran_pelatihan_id NOT IN ('SELESAI','KADALUARSA') ORDER BY tanggal_daftar DESC LIMIT 1"
    if (-not $enrollId -or $enrollId -eq "") {
        $enrollId = Sql "SELECT pendaftaran_pelatihan_id FROM training.transaksi_pendaftaranpelatihan WHERE umkm_id='$umkmId' ORDER BY tanggal_daftar DESC LIMIT 1"
    }

    if ($enrollId -match '^DFTR|^PDF') {
        $eid = $enrollId.Trim()
        $totalModul = Sql "SELECT total_modul_snapshot FROM training.transaksi_pendaftaranpelatihan WHERE pendaftaran_pelatihan_id='$eid'"
        if (-not $totalModul -or $totalModul -eq "" -or $totalModul -eq " ") { $totalModul = "4" }
        $tm = [int]$totalModul.Trim()
        if ($tm -lt 1) { $tm = 4 }

        $pBody = "{`"pendaftaran_pelatihan_id`":`"$eid`",`"modul_selesai`":$tm,`"total_modul`":$tm}"
        Test-Api -Label "PATCH /api/v1/enrollments/progress ($tm/$tm modul)" -Method PATCH -Uri "$TrainingURL/api/v1/enrollments/progress" -Body $pBody -Token $script:AdminToken

        $cBody = "{`"pendaftaran_pelatihan_id`":`"$eid`"}"
        Test-Api -Label "PATCH /api/v1/enrollments/complete" -Method PATCH -Uri "$TrainingURL/api/v1/enrollments/complete" -Body $cBody -Token $script:AdminToken
    } else {
        Write-Result -Label "PATCH /api/v1/enrollments/progress" -Pass $false -Detail "No enrollment found"
        Write-Result -Label "PATCH /api/v1/enrollments/complete" -Pass $false -Detail "No enrollment found"
    }

    Test-Api -Label "POST /api/v1/trainings/enroll (nonexistent -> 404)" -Method POST -Uri "$TrainingURL/api/v1/trainings/enroll" -Body "{`"umkm_id`":`"UMK000001`",`"pelatihan_id`":`"PLT999999`"}" -Token $script:AdminToken -ExpectedStatus 404
}

# ---- FASE 4: Protected Certificate Endpoints ----
Write-Host "`n--- FASE 4: Protected Certificate Endpoints ---" -ForegroundColor Yellow

if (-not $script:AdminToken) {
    Write-Host "  [SKIP] No token" -ForegroundColor Yellow
} else {
    Test-Api -Label "GET /api/v1/certificates/user/UMK000001/dashboard" -Uri "$TrainingURL/api/v1/certificates/user/UMK000001/dashboard" -Token $script:AdminToken
    Test-Api -Label "GET /api/v1/certificates/user/UMK000001" -Uri "$TrainingURL/api/v1/certificates/user/UMK000001" -Token $script:AdminToken

    $cid = Sql "SELECT sertifikat_id FROM training.transaksi_sertifikatpelatihan LIMIT 1"
    if ($cid -match '^\d+') {
        Test-Api -Label "GET /api/v1/certificates/$($cid.Trim())" -Uri "$TrainingURL/api/v1/certificates/$($cid.Trim())" -Token $script:AdminToken
    } else {
        Write-Result -Label "GET /api/v1/certificates/{id}" -Pass $false -Detail "No cert in DB"
    }

    $compEnroll = Sql "SELECT e.pendaftaran_pelatihan_id FROM training.transaksi_pendaftaranpelatihan e WHERE e.status_pendaftaran_pelatihan_id='SELESAI' AND NOT EXISTS (SELECT 1 FROM training.transaksi_sertifikatpelatihan s WHERE s.pendaftaran_pelatihan_id=e.pendaftaran_pelatihan_id) LIMIT 1"
    if ($compEnroll -match '^PDF') {
        $ceid = $compEnroll.Trim()
        Test-Api -Label "POST /api/v1/certificates/request (completed -> 201)" -Method POST -Uri "$TrainingURL/api/v1/certificates/request" -Body "{`"pendaftaran_pelatihan_id`":`"$ceid`"}" -Token $script:AdminToken -ExpectedStatus 201

        Test-Api -Label "POST /api/v1/certificates/request (existing -> returns existing)" -Method POST -Uri "$TrainingURL/api/v1/certificates/request" -Body "{`"pendaftaran_pelatihan_id`":`"$ceid`"}" -Token $script:AdminToken -ExpectedStatus 201
    } else {
        Write-Host "  [SKIP] No completed enrollment without cert" -ForegroundColor Yellow
    }

    $nonCompEnroll = Sql "SELECT e.pendaftaran_pelatihan_id FROM training.transaksi_pendaftaranpelatihan e WHERE e.status_pendaftaran_pelatihan_id!='SELESAI' AND NOT EXISTS (SELECT 1 FROM training.transaksi_sertifikatpelatihan s WHERE s.pendaftaran_pelatihan_id=e.pendaftaran_pelatihan_id) LIMIT 1"
    if ($nonCompEnroll -match '^PDF') {
        $nceid = $nonCompEnroll.Trim()
        Test-Api -Label "POST /api/v1/certificates/request (not completed -> 400)" -Method POST -Uri "$TrainingURL/api/v1/certificates/request" -Body "{`"pendaftaran_pelatihan_id`":`"$nceid`"}" -Token $script:AdminToken -ExpectedStatus 400
    } else {
        Write-Host "  [SKIP] No non-completed enrollment without cert" -ForegroundColor Yellow
    }

    Test-Api -Label "POST /api/v1/certificates/request (nonexistent -> 404)" -Method POST -Uri "$TrainingURL/api/v1/certificates/request" -Body "{`"pendaftaran_pelatihan_id`":`"PDFNONEXIST`"}" -Token $script:AdminToken -ExpectedStatus 404
}

# ---- FASE 5: Registration Flow (end-to-end) ----
Write-Host "`n--- FASE 5: Registration Flow (end-to-end) ---" -ForegroundColor Yellow

$rand = Get-Random -Minimum 100000 -Maximum 999999
$testEmail = "test.$rand@test.com"
$testPass = "testpass123"
$testName = "Test User $rand"
$testPhone = "0899$rand"

Test-Api -Label "POST /api/v1/auth/register (new UMKM)" -Method POST -Uri "$AuthURL/api/v1/auth/register" -Body "{`"full_name`":`"$testName`",`"email`":`"$testEmail`",`"password`":`"$testPass`",`"role`":`"UMKM`",`"phone_number`":`"$testPhone`"}" -ExpectedStatus 201

Test-Api -Label "POST /api/v1/auth/register (duplicate email -> 409)" -Method POST -Uri "$AuthURL/api/v1/auth/register" -Body "{`"full_name`":`"$testName`",`"email`":`"$testEmail`",`"password`":`"$testPass`",`"role`":`"UMKM`"}" -ExpectedStatus 409

Test-Api -Label "POST /api/v1/auth/login (pending -> 403)" -Method POST -Uri "$AuthURL/api/v1/auth/login" -Body "{`"email`":`"$testEmail`",`"password`":`"$testPass`"}" -ExpectedStatus 403

$newUserId = Sql "SELECT akun_id FROM auth.master_akunpengguna WHERE email='$testEmail' LIMIT 1"
if ($newUserId -match 'AKUN') {
    $uid = $newUserId.Trim()
    Test-Api -Label "PATCH /api/v1/admin/registrations/$uid/approve" -Method PATCH -Uri "$AuthURL/api/v1/admin/registrations/$uid/approve" -Token $script:AdminToken
    Test-Api -Label "POST /api/v1/auth/login (approved -> 200)" -Method POST -Uri "$AuthURL/api/v1/auth/login" -Body "{`"email`":`"$testEmail`",`"password`":`"$testPass`"}"
}

# ---- SUMMARY ----
Write-Host "`n==============================================" -ForegroundColor Cyan
$total = $script:PassCount + $script:FailCount
$rate = if ($total -gt 0) { [math]::Round(($script:PassCount/$total)*100,1) } else { 0 }
Write-Host "  TEST COMPLETE: $total total" -ForegroundColor Cyan
Write-Host "  $($script:PassCount) passed / $($script:FailCount) failed" -ForegroundColor $(if ($script:FailCount -eq 0){"Green"}else{"Red"})
Write-Host "  Pass rate: $rate%" -ForegroundColor $(if ($rate -ge 80){"Green"}elseif ($rate -ge 50){"Yellow"}else{"Red"})
Write-Host "==============================================" -ForegroundColor Cyan
if ($script:FailCount -gt 0) { exit 1 }
