@echo off
chcp 65001 >nul
setlocal

set "TITLE=ClaudeAutoRun"
set "SCRIPT_DIR=%~dp0"

start "%TITLE%" cmd /k call "%SCRIPT_DIR%inner_claude.bat"

timeout /t 4 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%autoaccept.ps1" -Title "%TITLE%"

echo.
echo [run_claude_auto.bat] done. you can close this window.
pause
endlocal
exit /b 0
