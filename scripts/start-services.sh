#!/bin/bash
# save as scripts/start-services.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting services...${NC}"

# Stop and remove existing containers
echo "Cleaning up existing containers..."
docker stop mongodb redis 2>/dev/null || true
docker rm mongodb redis 2>/dev/null || true

# Start MongoDB
echo "Starting MongoDB..."
docker run -d \
    --name mongodb \
    -p 27017:27017 \
    --restart unless-stopped \
    mongo:latest

# Start Redis
echo "Starting Redis..."
docker run -d \
    --name redis \
    -p 6379:6379 \
    --restart unless-stopped \
    redis:latest

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Function to check if a container is running
check_container() {
    local container_name=$1
    if docker ps | grep -q $container_name; then
        echo -e "${GREEN}$container_name is running${NC}"
        return 0
    else
        echo -e "${RED}$container_name failed to start${NC}"
        return 1
    fi
}

# Check services
echo "Checking services..."
check_container "mongodb" || exit 1
check_container "redis" || exit 1

echo -e "${GREEN}All services are running${NC}"