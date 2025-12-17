@echo off
setlocal
title AI Text Recognizer Launcher

:: 1. 切換到目前腳本所在的資料夾
cd /d "%~dp0"

:: 2. 啟動系統 (使用 /k 強制保留視窗，避免閃退)
echo.
echo [系統] 正在啟動... (後端 Server + 前端網頁)
echo [提示] 如果看到 'ready in ... ms' 表示啟動成功
echo [提示] 請勿關閉此視窗
echo.

cmd /k "npm run dev"
