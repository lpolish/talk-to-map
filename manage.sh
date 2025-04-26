#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to display help
show_help() {
    echo -e "${YELLOW}EarthAI Management Script${NC}"
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev           - Start development environment"
    echo "  build         - Build production containers"
    echo "  start         - Start production environment"
    echo "  stop          - Stop all containers"
    echo "  restart       - Restart all containers"
    echo "  logs          - View container logs"
    echo "  clean         - Remove all containers and volumes"
    echo "  help          - Show this help message"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    check_docker
    echo -e "${GREEN}Starting development environment...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Development environment is running at http://localhost:3000${NC}"
}

# Function to build production containers
build_prod() {
    check_docker
    echo -e "${GREEN}Building production containers...${NC}"
    docker-compose build
    echo -e "${GREEN}Production containers built successfully${NC}"
}

# Function to start production environment
start_prod() {
    check_docker
    echo -e "${GREEN}Starting production environment...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Production environment is running at http://localhost:3000${NC}"
}

# Function to stop containers
stop_containers() {
    check_docker
    echo -e "${YELLOW}Stopping containers...${NC}"
    docker-compose down
    echo -e "${GREEN}Containers stopped${NC}"
}

# Function to restart containers
restart_containers() {
    check_docker
    echo -e "${YELLOW}Restarting containers...${NC}"
    docker-compose restart
    echo -e "${GREEN}Containers restarted${NC}"
}

# Function to view logs
view_logs() {
    check_docker
    echo -e "${YELLOW}Viewing container logs...${NC}"
    docker-compose logs -f
}

# Function to clean up
clean_up() {
    check_docker
    echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}Cleanup complete${NC}"
}

# Main script logic
case "$1" in
    dev)
        start_dev
        ;;
    build)
        build_prod
        ;;
    start)
        start_prod
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    logs)
        view_logs
        ;;
    clean)
        clean_up
        ;;
    help|*)
        show_help
        ;;
esac 