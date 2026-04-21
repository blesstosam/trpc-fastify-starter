#!/bin/bash

# =============================================================================
# init.sh - Project Initialization Script
# =============================================================================
# Run this script at the start of every session to ensure the environment
# is properly set up and the development server is running.
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Initializing project...${NC}"

# Install dependencies
echo "Installing dependencies..."
pnpm i

# Start development server in background
echo "Starting development server..."
pnpm dev

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 5

echo -e "${GREEN}✓ Initialization complete!${NC}"
echo -e "${GREEN}✓ backend server running at http://localhost:2022/ and frontend server running at http://localhost:5173/${NC}"
echo ""
echo "Ready to continue development."
