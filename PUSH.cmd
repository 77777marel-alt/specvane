@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Отправляю изменения Specvane на GitHub...
git push -u origin main
echo.
echo Готово. Vercel соберёт сайт сам через 1-2 минуты.
pause
