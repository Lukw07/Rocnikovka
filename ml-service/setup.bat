@echo off
REM Setup script for ML Service on Windows

echo ========================================
echo  EduRPG ML Service Setup (Windows)
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+
    pause
    exit /b 1
)

echo [1/6] Creating virtual environment...
python -m venv venv

echo [2/6] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/6] Installing dependencies...
pip install -r requirements.txt

echo [4/6] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env created. Please edit with your database credentials.
) else (
    echo .env already exists.
)

echo [5/6] Creating models directory...
if not exist models mkdir models

echo [6/6] Testing installation...
python -c "import fastapi, sklearn, pandas; print('All packages installed successfully!')"

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env file with your database URL
echo   2. Run: python app/training/train_all.py
echo   3. Run: uvicorn app.main:app --reload
echo.
pause
