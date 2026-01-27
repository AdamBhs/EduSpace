#!/bin/bash

SERVICES=(
  "api-gateway"
  "assignment-submission-service"
  "calendar-service"
  "class-service"
  "communication-service"
  "content-service"
  "file-service"
  "grading-service"
  "notification-service"
  "search-service"
  "user-service"
)

for SERVICE in "${SERVICES[@]}"
do
    echo "Instal $SERVICE..."
    cd $SERVICE || exit
    npm install
    cd ..
done 