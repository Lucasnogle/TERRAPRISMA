Write-Output "Pulling latest changes..."
git pull

Write-Output "Reloading PM2..."
pm2 reload ecosystem.config.js

Write-Output "Done."
