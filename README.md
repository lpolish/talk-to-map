# EarthAI

EarthAI is an interactive satellite map application with an integrated AI chat interface. It allows users to explore locations around the world while having natural conversations with an AI assistant about the places they're viewing.

![Screenshot from 2025-04-26 10-25-14](https://github.com/user-attachments/assets/16d8be39-5171-44ea-8d26-b211cf9163a1)

## 🌍 About the Project

EarthAI combines interactive mapping technology with AI-powered chat to create an engaging exploration experience. The platform features:

- Interactive satellite and standard map views
- AI-powered chat assistant that understands your location context
- Real-time location information and coordinates
- Multiple map types (Standard, Satellite, Relief, Dark)
- Smooth navigation and zoom controls
- Persistent chat history and session management

Built with Next.js, React, and Leaflet, EarthAI provides a modern, responsive interface for exploring the world through maps and conversation.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

## Environment Variables

The application requires several environment variables to function properly. Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=earthai_db
DB_USER=earthai_user
DB_PASSWORD=your_secure_password_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NODE_ENV=development

# Database URL (used in Docker)
DATABASE_URL=postgresql://earthai_user:your_secure_password_here@db:5432/earthai_db

# PostgreSQL Configuration (for Docker)
POSTGRES_DB=earthai_db
POSTGRES_USER=earthai_user
POSTGRES_PASSWORD=your_secure_password_here
```

### Environment Variables Description

- **Database Configuration**
  - `DB_HOST`: Database host address (default: localhost)
  - `DB_PORT`: Database port (default: 5432)
  - `DB_NAME`: Database name (default: earthai_db)
  - `DB_USER`: Database username (default: earthai_user)
  - `DB_PASSWORD`: Database password (default: dev_password_123)

- **OpenAI Configuration**
  - `OPENAI_API_KEY`: Your OpenAI API key for the chat functionality

- **Application Configuration**
  - `NODE_ENV`: Application environment (development/production)

- **Docker Database Configuration**
  - `DATABASE_URL`: Full PostgreSQL connection URL for Docker
  - `POSTGRES_DB`: PostgreSQL database name
  - `POSTGRES_USER`: PostgreSQL username
  - `POSTGRES_PASSWORD`: PostgreSQL password

> Note: The Docker environment variables are automatically set in the `docker-compose.yml` file. You only need to modify them if you want to use different values.

## Docker Setup

The application is containerized using Docker and Docker Compose. The setup includes:
- Next.js application container
- PostgreSQL database container

### Using the Management Script

We provide a `manage.sh` script to simplify development and deployment tasks. Make it executable first:

```bash
chmod +x manage.sh
```

Available commands:
```bash
./manage.sh dev           # Start development environment
./manage.sh build         # Build production containers
./manage.sh start         # Start production environment
./manage.sh stop          # Stop all containers
./manage.sh restart       # Restart all containers
./manage.sh logs          # View container logs
./manage.sh clean         # Remove all containers and volumes
./manage.sh help          # Show help message
```

### Manual Docker Commands

If you prefer using Docker commands directly:

1. Start the development environment:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop containers:
```bash
docker-compose down
```

4. Clean up (including volumes):
```bash
docker-compose down -v
```

## Database Configuration

The PostgreSQL database is configured with:
- Host: localhost
- Port: 5432
- Database: earthai_db
- Username: earthai_user
- Password: dev_password_123 (change this in production)

## Development

The application will be available at [http://localhost:3000](http://localhost:3000).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Production Deployment

For production deployment:

1. Build the containers:
```bash
./manage.sh build
```

2. Start the production environment:
```bash
./manage.sh start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
