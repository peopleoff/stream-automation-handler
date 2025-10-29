#!/bin/bash

# Logrotate Setup Script for Cattyshack Automation Platform
#
# This script installs the logrotate configuration for managing log files.
# It must be run with sudo privileges to copy the configuration to /etc/logrotate.d/
#
# Usage:
#   sudo bash scripts/setup-logrotate.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory (one level up from scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}Cattyshack Logrotate Setup${NC}"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run with sudo${NC}"
    echo "Usage: sudo bash scripts/setup-logrotate.sh"
    exit 1
fi

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

echo "✓ logrotate is installed"

# Check if config file exists
CONFIG_SOURCE="${PROJECT_ROOT}/config/logrotate.conf"
if [ ! -f "$CONFIG_SOURCE" ]; then
    echo -e "${RED}Error: Configuration file not found at $CONFIG_SOURCE${NC}"
    exit 1
fi

echo "✓ Configuration file found"

# Update the absolute path in the config file
TEMP_CONFIG="/tmp/cattyshack-logrotate.conf"
sed "s|/Users/ruslanbelyy/Documents/Projects/cattyshack-automation-website|${PROJECT_ROOT}|g" "$CONFIG_SOURCE" > "$TEMP_CONFIG"

echo "✓ Updated paths in configuration"

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}/logs"
echo "✓ Logs directory ready"

# Copy configuration to /etc/logrotate.d/
LOGROTATE_DEST="/etc/logrotate.d/cattyshack"
cp "$TEMP_CONFIG" "$LOGROTATE_DEST"
chmod 644 "$LOGROTATE_DEST"

echo "✓ Configuration installed to $LOGROTATE_DEST"

# Test the configuration
echo ""
echo "Testing configuration..."
if logrotate -d "$LOGROTATE_DEST" 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}Warning: Configuration test showed errors. Review output above.${NC}"
else
    echo "✓ Configuration test passed"
fi

# Clean up temp file
rm -f "$TEMP_CONFIG"

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Configuration details:"
echo "  - Rotation trigger: 50MB file size"
echo "  - Retention: 7 rotations"
echo "  - Compression: gzip (delayed)"
echo "  - Location: $LOGROTATE_DEST"
echo ""
echo "Log files managed:"
echo "  - ${PROJECT_ROOT}/logs/*.log"
echo ""
echo "Next steps:"
echo "  1. Logrotate will run automatically via system cron (typically daily)"
echo "  2. To manually test rotation, run:"
echo "     bash scripts/rotate-logs-now.sh"
echo "  3. To verify rotation is working, check for .log.1, .log.2.gz files in logs/"
echo ""
