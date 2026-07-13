@echo off
title Lumina Pro
color 0A
echo.
echo  ================================================
echo    LUMINA PRO - Demarrage automatique
echo  ================================================
echo.

echo  [1/3] Demarrage de MySQL...
net start mysql 2>nul
if %errorlevel% neq 0 (
    "C:\xampp\mysql\bin\mysqladmin.exe" -u root ping >nul 2>&1
    if %errorlevel% neq 0 (
        start /wait "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone &
        timeout /t 3 /nobreak >nul
    )
)
echo  MySQL OK

echo  [2/3] Demarrage du serveur Node.js...
cd /d "C:\xampp\htdocs\lumina_pro\backend"
start "Serveur Lumina Pro" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo  [3/3] Ouverture du navigateur...
start http://localhost:3000

echo.
echo  Lumina Pro est lance : http://localhost:3000
echo  Pour arreter : fermez la fenetre noire "Serveur Lumina Pro"
echo.
