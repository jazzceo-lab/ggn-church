@echo off
chcp 65001 >nul
cd /d "C:\Users\jazzc\projects\church-app"
echo [inner_claude.bat] work folder: %CD%
echo [inner_claude.bat] running claude...
claude
echo.
echo [inner_claude.bat] claude has exited.
pause
