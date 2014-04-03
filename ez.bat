@echo off

REM ***** LOCAL VARS *****
SET SRV_PORT=666
SET ENABLE_GZIP=true

REM ***** Overtake batch parameters *****
if not "%1" =="" set SRV_PORT=%1
if not "%2" =="" set ENABLE_GZIP=%2

REM  ***** kill java on SRV_PORT if already running *****
color f5
echo Killing previous instance of WebServer...
for /f "tokens=5 delims= " %%a in ('netstat -ano^|findstr /r 0:%SRV_PORT%') do taskkill /T /F /PID %%a

REM ***** Starting EZ-WebServer *****
echo (re)starting EZ-WebServer on port %SRV_PORT%
color e0
title EZ Web Server
java -jar ez-ws.jar %SRV_PORT% %ENABLE_GZIP%
