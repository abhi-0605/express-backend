
# backend-scaffold-cli

A CLI tool to quickly scaffold Express.js backend projects with MongoDB, middleware, and common setup. It automatically generates production-ready projects with JWT authentication, error handling, request logging, input validation, DNS configuration, and pre-configured MongoDB Atlas connection. Every project has different requirements, so this tool provides a solid, common foundation that developers can easily modify, extend, or trim according to their specific needs.

## Features

✨ **Quick Setup**
- Complete folder structure
- Pre-configured Express server
- MongoDB Atlas connection (cloud-based)
- Environment variables template
- DNS configuration

🔐 **Security**
- JWT authentication middleware
- Password hashing with bcryptjs
- Error handling middleware
- CORS configuration
- Rate limiting (optional)

📝 **Developer Experience**
- Logging middleware
- Input validation (optional)
- File upload support with multer (optional)
- Axios utility for external API calls (optional)
- Sample routes and User model
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
create-express-backend my-app
```

> **Tip:** Always use `@latest` to ensure you get the newest version with all features and bug fixes.

## Usage

```bash
npx backend-scaffold-cli@latest <project-name>
```

You'll be prompted to select features:
- ✅ Include JWT authentication (adds bcryptjs + User model)
- ✅ Include input validation
- ✅ Include rate limiting
- ✅ Include file upload support (multer)
- ✅ Include axios (for external API calls)
- ✅ Install dependencies

After setup, copy `.env.example` to `.env`, configure your MongoDB URI, then run:

```bash
npm start
```

Test it's working:
```bash
curl http://localhost:5000/api/health
```

## Project Structure

```
my-app/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimiter.js
│   │   └── upload.js
│   ├── routes/
│   │   └── index.js
│   ├── controllers/
│   ├── models/
│   │   └── User.js
│   ├── utils/
│   │   └── axiosUtil.js
│   ├── validation/
│   └── server.js
├── uploads/
├── .env.example
├── .gitignore
└── package.json

```


## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=myapp

# DNS Configuration
DNS_SERVERS=8.8.8.8,8.8.4.4

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```



## License

MIT

## Repository

https://github.com/abhi-0605/express-backend