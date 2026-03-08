#!/bin/bash

echo "Starting nginx..."
sudo systemctl start nginx

echo "Starting class-service..."
cd ~/Desktop/EduSpace-microservices/services/class-service
gnome-terminal -- bash -c "pnpm run dev; exec bash"

echo "Starting user-service..."
cd ~/Desktop/EduSpace-microservices/services/user-service
gnome-terminal -- bash -c "pnpm run dev; exec bash"

echo "Starting frontend..."
cd ~/Desktop/EduSpace-microservices/frontend
gnome-terminal -- bash -c "pnpm run dev; exec bash"

echo "All services started."
