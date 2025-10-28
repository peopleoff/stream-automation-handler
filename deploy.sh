#!/bin/bash

# Cattyshack Automation Platform - Deployment Script
# This script builds and deploys both frontend and backend applications

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Parse command line arguments
SKIP_MIGRATIONS=false
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    -h|--help)
      echo "Usage: ./deploy.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-migrations    Skip database migrations"
      echo "  --skip-install       Skip npm install step"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Cattyshack Automation Platform - Deployment         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if we're in the correct directory
if [[ ! -f "package.json" ]] || [[ ! -f "ecosystem.config.js" ]]; then
  log_error "Not in the correct directory. Please run this script from the project root."
  exit 1
fi

# Check Node.js and npm
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed. Please install Node.js first."
  exit 1
fi

if ! command -v npm &> /dev/null; then
  log_error "npm is not installed. Please install npm first."
  exit 1
fi

log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
  log_warning ".env file not found. Make sure to configure environment variables."
  if [[ -f ".env.example" ]]; then
    log_info "You can copy .env.example to .env and configure it."
  fi
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
  log_error "PM2 is not installed. Please install PM2 first: npm install -g pm2"
  exit 1
fi

log_success "Pre-deployment checks passed"
echo ""

# Step 2: Install dependencies
if [[ "$SKIP_INSTALL" = false ]]; then
  log_info "Installing dependencies..."
  if npm install; then
    log_success "Dependencies installed successfully"
  else
    log_error "Failed to install dependencies"
    exit 1
  fi
  echo ""
else
  log_warning "Skipping npm install (--skip-install flag)"
  echo ""
fi

# Step 3: Run database migrations
if [[ "$SKIP_MIGRATIONS" = false ]]; then
  log_info "Running database migrations..."

  # Ensure data directory exists
  if [[ ! -d "data" ]]; then
    log_info "Creating data directory..."
    mkdir -p data
  fi

  if npm run db:migrate; then
    log_success "Database migrations completed successfully"
  else
    log_error "Database migrations failed"
    exit 1
  fi
  echo ""
else
  log_warning "Skipping database migrations (--skip-migrations flag)"
  echo ""
fi

# Step 4: Build applications
log_info "Building applications..."

# Build all workspaces
if npm run build; then
  log_success "Applications built successfully"
else
  log_error "Build failed"
  exit 1
fi
echo ""

# Step 5: PM2 process management
log_info "Managing PM2 processes..."

# Check if PM2 processes are running
PM2_PROCESSES=$(pm2 jlist 2>/dev/null || echo "[]")

if [[ "$PM2_PROCESSES" == "[]" ]] || ! echo "$PM2_PROCESSES" | grep -q "cattyshack"; then
  log_info "Starting PM2 processes for the first time..."
  if pm2 start ecosystem.config.js; then
    log_success "PM2 processes started successfully"
  else
    log_error "Failed to start PM2 processes"
    exit 1
  fi
else
  log_info "Reloading PM2 processes (zero-downtime deployment)..."

  # Try graceful reload first (zero-downtime)
  if pm2 reload ecosystem.config.js; then
    log_success "PM2 processes reloaded successfully"
  else
    log_warning "Reload failed, attempting restart..."
    if pm2 restart ecosystem.config.js; then
      log_success "PM2 processes restarted successfully"
    else
      log_error "Failed to restart PM2 processes"
      exit 1
    fi
  fi
fi

# Save PM2 process list
if pm2 save; then
  log_success "PM2 process list saved"
else
  log_warning "Failed to save PM2 process list"
fi

echo ""

# Step 6: Post-deployment validation
log_info "Validating deployment..."

# Wait a moment for processes to stabilize
sleep 3

# Check PM2 status
echo ""
log_info "Current PM2 process status:"
pm2 status

echo ""

# Check if processes are online
PM2_STATUS=$(pm2 jlist 2>/dev/null)
WEB_STATUS=$(echo "$PM2_STATUS" | grep -o '"name":"cattyshack-web".*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)
EVENTS_STATUS=$(echo "$PM2_STATUS" | grep -o '"name":"cattyshack-events".*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)

if [[ "$WEB_STATUS" == "online" ]] && [[ "$EVENTS_STATUS" == "online" ]]; then
  log_success "All processes are online and healthy"
else
  log_warning "Some processes may not be running correctly"
  if [[ "$WEB_STATUS" != "online" ]]; then
    log_error "cattyshack-web status: $WEB_STATUS"
  fi
  if [[ "$EVENTS_STATUS" != "online" ]]; then
    log_error "cattyshack-events status: $EVENTS_STATUS"
  fi

  echo ""
  log_info "Displaying recent logs for debugging:"
  pm2 logs --lines 20 --nostream
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              Deployment Completed Successfully         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
log_info "Frontend (web): Running on port 3000"
log_info "Backend (event-service): Monitoring TikTok stream"
echo ""
log_info "Useful commands:"
echo "  - View logs:        pm2 logs"
echo "  - Monitor:          pm2 monit"
echo "  - Status:           pm2 status"
echo "  - Restart web:      pm2 restart cattyshack-web"
echo "  - Restart events:   pm2 restart cattyshack-events"
echo ""

exit 0
