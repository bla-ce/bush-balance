#!/bin/bash

# Function to handle Ctrl+C
function handle_sigint() {
    echo -e "\nresetting changes..."
    git restore --staged .
    exit 1
}

# Trap SIGINT (Ctrl+C) and call handle_sigint function
trap handle_sigint SIGINT

git add .
git status

read -p "press enter to confirm or <C-c> to cancel"

read -p "enter commit message: " message
read -p "enter commit description: " description

git commit -m "${message}" -m "${description}"

git push origin main

