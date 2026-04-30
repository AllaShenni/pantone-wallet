@echo off
set "WALLET_PATH=%~dp0index.html"
start chrome --app="file:///%WALLET_PATH%" --window-size=760,620 --window-position=300,120
exit
