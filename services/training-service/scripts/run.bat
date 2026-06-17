@echo off
REM Training Service Runner Script for Windows

echo ===================================
echo Starting Training Service
echo ===================================

REM Check if .env exists
if exist .env (
    echo Loading environment from .env...
)

REM Install dependencies
echo Installing dependencies...
go mod download

if errorlevel 1 (
    echo ERROR: Failed to download dependencies
    pause
    exit /b 1
)

REM Run service
echo Starting service on port 8083...
go run cmd/api/main.go

pause
