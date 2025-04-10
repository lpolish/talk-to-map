# EarthAI Development Environment

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the PostgreSQL database:
```bash
docker-compose up -d
```

The PostgreSQL database will be available at:
- Host: localhost
- Port: 5432
- Database: earthai_db
- Username: earthai_user
- Password: dev_password_123 (change this in production)

To verify the database is running:
```bash
docker-compose ps
```

To view database logs:
```bash
docker-compose logs -f db
```

To stop the database:
```bash
docker-compose down
```

To stop the database and remove all data:
```bash
docker-compose down -v
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
