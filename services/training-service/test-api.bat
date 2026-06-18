@echo off
REM ========================================
REM Training Service API Testing Script
REM ========================================
REM
REM Cara pakai:
REM   1. Pastikan Docker service sudah running
REM   2. Jalankan: test-api.bat
REM
REM Untuk testing lengkap (login, enroll, certificate)
REM gunakan Postman collection yang ada di root project
REM ========================================

echo ========================================
echo Training Service API Tests
echo ========================================
echo.

echo [1/5] Health Check...
curl -X GET http://localhost:8083/api/v1/health
echo.
echo.

echo [2/5] Database Health...
curl -X GET http://localhost:8083/api/v1/health/db
echo.
echo.

echo [3/5] Get All Trainings...
curl -X GET http://localhost:8083/api/v1/trainings
echo.
echo.

echo [4/5] Get Training Detail...
echo Enter Training ID (contoh: PLT000195):
set /p TRAINING_ID="Training ID: "
if not "%TRAINING_ID%"=="" (
    echo --- Training Detail ---
    curl -X GET http://localhost:8083/api/v1/trainings/%TRAINING_ID%/detail
    echo.
)
echo.

echo [5/5] Certificate Endpoints (Health Check Only)...
echo Untuk test certificate endpoint, gunakan:
echo   curl http://localhost:8083/api/v1/certificates/user/UMKM_ID/dashboard
echo.
echo Untuk test lengkap dengan auth, ikuti TESTING.md atau gunakan Postman.
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Langkah selanjutnya:
echo   1. Buka TESTING.md untuk panduan manual
echo   2. Import Postman collection dari file .postman_collection.json
echo   3. Ikuti langkah: Login -^> Enroll -^> Certificate
echo ========================================
pause
