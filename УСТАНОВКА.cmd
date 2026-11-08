@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Устанавливаю пакеты Specvane (нужно один раз и после обновления package.json)...
call npm ci
pause
