# backend-scaffold-cli

A CLI tool to quickly scaffold Express.js backend projects with MongoDB, middleware, and common setup. It automatically generates production-ready projects with JWT authentication, error handling, request logging, input validation, DNS configuration, and pre-configured MongoDB Atlas connection. Perfect for developers who want to skip boilerplate and start coding immediately.

## Features

✨ **Quick Setup**
- Complete folder structure
- Pre-configured Express server
- MongoDB Atlas connection (cloud-based)
- Environment variables template
- DNS configuration

🔐 **Security**
- JWT authentication middleware
- Error handling middleware
- CORS configuration

📝 **Developer Experience**
- Logging middleware
- Input validation
- Sample routes
- Git initialization
- Auto dependency installation

## Installation

### Using npx (Recommended)
```bash
npx backend-scaffold-cli my-app
cd my-app
npm start
```

### Global Installation
```bash
npm install -g backend-scaffold-cli
backend-scaffold-cli my-app
```

## Usage

```bash
npx backend-scaffold-cli <project-name>
```

You'll be prompted to select features:
- ✅ Include JWT authentication
- ✅ Include logging middleware
- ✅ Include input validation
- ✅ Install dependencies

## Project Structure
```
my-app/
├── src/
│ ├── server.js
│ ├── config/db.js
│ ├── middleware/
│ ├── routes/
│ ├── controllers/
│ ├── models/
│ └── utils/
├── .env.example
├── .gitignore
└── package.json
```

## Quick Start

```bash
npx backend-scaffold-cli my-app
cd my-app
cp .env.example .env
npm start
```

Visit: `http://localhost:5000/api/health`

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
DNS_SERVERS=8.8.8.8,8.8.4.4
```

## License

MIT