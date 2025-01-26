#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Creating Super Admin...${NC}"

# Run the Node.js script
node scripts/create-super-admin.js

echo -e "${GREEN}Done${NC}" 