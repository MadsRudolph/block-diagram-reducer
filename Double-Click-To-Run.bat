@echo off
title Control Block Diagram Reducer Launcher
cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo =======================================================
    echo ERROR: Node.js is NOT installed on this computer!
    echo =======================================================
    echo Node.js is required to install local dependencies and build the app.
    echo Please download and install Node.js from: https://nodejs.org/
    echo =======================================================
    pause
    exit /b
)

:: 2. Check if local dependencies exist (auto-install)
if not exist "node_modules\" (
    echo =======================================================
    echo Node modules not found. Initializing offline dependencies...
    echo This may take a few seconds...
    echo =======================================================
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed!
        pause
        exit /b
    )
)

:: 3. Check if bundle exists (auto-build)
if not exist "bundle.js" (
    echo =======================================================
    echo Bundling modular javascript components...
    echo =======================================================
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Bundling failed!
        pause
        exit /b
    )
)

:: 4. Check if standalone desktop executable exists (auto-package)
if not exist "BlockDiagramReducer-win32-x64\BlockDiagramReducer.exe" (
    echo =======================================================
    echo Standalone executable not found.
    echo Compiling native Windows desktop application (.exe)...
    echo This will download the Electron redistributable and package it.
    echo This only happens once!
    echo =======================================================
    call npm run package
    if %errorlevel% neq 0 (
        echo ERROR: Standalone packaging failed!
        pause
        exit /b
    )
)

:: 5. Launch the standalone desktop application!
echo =======================================================
echo Launching standalone desktop application...
echo =======================================================
start "" "BlockDiagramReducer-win32-x64\BlockDiagramReducer.exe"
exit
