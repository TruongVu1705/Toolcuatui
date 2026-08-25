#!/bin/bash
# Start PO Token HTTP Server in background
cd /opt/bgutil/server && node build/main.js &
# Wait for PO token server to be ready
sleep 3
echo "PO Token server started on port 4416"
# Start main application
cd /app && exec node server.js
