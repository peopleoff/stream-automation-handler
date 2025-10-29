#!/bin/bash

# Manual Log Rotation Script for Cattyshack Automation Platform
#
# This script forces immediate log rotation for testing or maintenance.
# It can be run without sudo if logrotate was properly configured.
#
# Usage:
#   bash scripts/rotate-logs-now.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}Cattyshack Manual Log Rotation${NC}"
echo "================================"
echo ""

# Check if logrotate is installed
if ! command -v logrotate &> /dev/null; then
    echo -e "${RED}Error: logrotate is not installed${NC}"
    echo ""
    echo "Install logrotate first:"
    echo "  macOS: brew install logrotate"
    echo "  Ubuntu/Debian: sudo apt-get install logrotate"
    echo "  CentOS/RHEL: sudo yum install logrotate"
    exit 1
fi

# Check if configuration is installed
LOGROTATE_CONFIG="/etc/logrotate.d/cattyshack"
if [ ! -f "$LOGROTATE_CONFIG" ]; then
    echo -e "${YELLOW}Warning: System logrotate configuration not found${NC}"
    echo "Configuration missing: $LOGROTATE_CONFIG"
    echo ""
    echo "Installing configuration first..."

    # Try to run setup script
    if [ -f "${PROJECT_ROOT}/scripts/setup-logrotate.sh" ]; then
        echo "Running setup script..."
        sudo bash "${PROJECT_ROOT}/scripts/setup-logrotate.sh"
    else
        echo -e "${RED}Error: Setup script not found${NC}"
        echo "Run: sudo bash scripts/setup-logrotate.sh"
        exit 1
    fi
fi

# Show current log files before rotation
echo "Current log files:"
ls -lh "${PROJECT_ROOT}/logs/" 2>/dev/null || echo "  (no log files found)"
echo ""

# Perform rotation
echo "Forcing log rotation..."
if [ "$EUID" -eq 0 ]; then
    # Running as root
    logrotate -f "$LOGROTATE_CONFIG"
else
    # Try without sudo first, fall back to sudo if needed
    if logrotate -f "$LOGROTATE_CONFIG" 2>/dev/null; then
        echo "✓ Rotation completed"
    else
        echo -e "${YELLOW}Permission denied, trying with sudo...${NC}"
        sudo logrotate -f "$LOGROTATE_CONFIG"
    fi
fi

echo "✓ Log rotation completed"
echo ""

# Show log files after rotation
echo "Log files after rotation:"
ls -lh "${PROJECT_ROOT}/logs/" 2>/dev/null || echo "  (no log files found)"
echo ""

# Show rotation summary
ROTATED_COUNT=$(find "${PROJECT_ROOT}/logs/" -name "*.log.*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ROTATED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Found $ROTATED_COUNT rotated log file(s)${NC}"
    echo ""
    echo "Rotated logs:"
    find "${PROJECT_ROOT}/logs/" -name "*.log.*" -exec ls -lh {} \; 2>/dev/null
else
    echo -e "${YELLOW}No rotated logs found${NC}"
    echo "This is normal if logs are small or this is the first rotation."
fi

echo ""
echo "Notes:"
echo "  - Rotated logs are compressed with gzip (.gz extension)"
echo "  - Only logs larger than 50MB will be rotated"
echo "  - Up to 7 rotations are kept before old logs are deleted"
echo ""
