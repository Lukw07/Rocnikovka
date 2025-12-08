@echo off
echo [INFO] Starting Secure Build Workflow...
echo [INFO] Cleaning caches and artifacts...
rmdir /s /q .next
rmdir /s /q node_modules
del package-lock.json

echo [INFO] Reinstalling dependencies...
call npm install

echo [INFO] Building project...
call npm run build

echo [INFO] Secure Build Completed.
