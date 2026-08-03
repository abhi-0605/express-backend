#!/usr/bin/env node


const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const version= '1.0.0';

program
    .version(version)
    .description('Create a new Express.js backend application')
    .argument('<project-name>', 'Name of the project')
    .action(async (projectName) => {
        try{
            console.log(chalk.blue(`Creating a new Express.js backend application: ${projectName}`));

            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'useAuth',
                    message: 'Include JWT authentication?',
                    default: true
                },
                {
                    type:'confirm',
                    name: 'useLogging',
                    message: 'Include logging middleware?',
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'useValidation',
                    message: 'Include input validation?',
                    default: true
                },
                {
                    type: 'confirm',
                    name: 'installDeps',
                    message: 'Install dependencies now?',
                    default: true
                }
            ]);

            const projectPath = path.resolve(process.cwd(), projectName);

            if (fs.existsSync(projectPath)) {
                console.log(chalk.red(`Error: Directory ${projectName} already exists.`));
                process.exit(1);
            }

            console.log(chalk.blue(`Creating project in ${projectPath}\n`));
            fs.ensureDirSync(projectPath);

            createFolderStructure(projectPath);
            createConfigFiles(projectPath, answers);
            createMiddlewareFiles(projectPath, answers);
            createRouteFiles(projectPath, answers);

            console.log(chalk.cyan(' Initializing git repository...'));
            execSync('git init', { cwd: projectPath });

            if (answers.installDeps) {
                console.log(chalk.cyan(' Installing dependencies...\n'));
                execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
            }

            console.log(chalk.green.bold('\n Project created successfully!\n'));
            console.log(chalk.cyan('Next steps:'));
            console.log(chalk.white(`  cd ${projectName}`));
            console.log(chalk.white('  cp .env.example .env'));
            console.log(chalk.white('  npm start\n'));
        }catch (error) {
            console.error(chalk.red('\n Error creating project:'), error.message);
            process.exit(1);
        }
    });

program.parse();

const createFolderStructure=(projectPath) =>{
    const folders=[
        'src/config',
        'src/middleware',
        'src/routes',
        'src/controllers',
        'src/models',
        'src/utils',
        'src/validation'
    ];

    folders.forEach(folder => {
        fs.ensureDirSync(path.join(projectPath, folder)); 
    });
    
    console.log(chalk.green(' Folder structure created'));

}


const createConfigFiles= (projectPath,answers) =>{
    const packageJson={
        name: path.basename(projectPath),
        version: '1.0.0',
        main: 'src/server.js',
        scripts: {
            start: 'node src/server.js',
            dev: 'nodemon src/server.js',
            test: 'jest'
        },
        keywords: ['express', 'nodejs', 'backend'],
        author: '',
        license: 'MIT',
        dependencies: {
            express: '^4.18.2',
            mongoose: '^7.0.0',
            dotenv: '^16.0.3',
            cors: '^2.8.5',
            ...(answers.useAuth && { jsonwebtoken: '^9.0.0' }),
            ...(answers.useValidation && { joi: '^17.9.0' })
        },
        devDependencies: {
            nodemon: '^2.0.22',
        }

    };

    fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    const env = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myappdb
DB_NAME=myapp

# DNS Configuration
DNS_SERVERS=8.8.8.8,8.8.4.4
PRIMARY_DNS=8.8.8.8
SECONDARY_DNS=8.8.4.4

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
`;

    fs.writeFileSync(path.join(projectPath, '.env.example'), env);


    const gitignore = `node_modules/
.env
.env.local
.env.*.local
dist/
build/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
.idea/
.vscode/
`;

    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

    console.log(chalk.green(' Config files created'));


};




function createMiddlewareFiles(projectPath, answers) {
  const errorHandler = `// Middleware for handling errors
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    const message = \`Duplicate field value entered\`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = \`JSON Web Token is invalid, try again\`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'TokenExpiredError') {
    const message = \`JSON Web Token is expired, try again\`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorMiddleware, ErrorHandler };
`;

    fs.writeFileSync(
        path.join(projectPath, 'src/middleware/errorHandler.js'),
        errorHandler
    );


    const logger = `// Simple logging middleware
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      \`[\${new Date().toISOString()}] \${req.method} \${req.path} - \${res.statusCode} - \${duration}ms\`
    );
  });

  next();
};

module.exports = loggerMiddleware;
`;

    fs.writeFileSync(
        path.join(projectPath, 'src/middleware/logger.js'),
        logger
    );

    if (answers.useAuth) {
    const auth = `const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('./errorHandler');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler('Access token is missing', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(new ErrorHandler('Invalid or expired token', 401));
  }
};

module.exports = authenticateToken;
`;

    fs.writeFileSync(
        path.join(projectPath, 'src/middleware/auth.js'),
        auth
    );
  }

  if (answers.useValidation) {
    const validation = `const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return res.status(400).json({ success: false, errors: details });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = validateRequest;
`;

    fs.writeFileSync(
        path.join(projectPath, 'src/middleware/validation.js'),
        validation
    );
  }

  console.log(chalk.green(' Middleware files created'));
}


const createRouteFiles = (projectPath, answers) => {
    const routes = `const express = require('express');
const router = express.Router();
${answers.useAuth ? "const authenticateToken = require('../middleware/auth');" : ''}

// Public routes
router.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

${answers.useAuth ? `
// Protected routes
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
` : ''}

module.exports = router;
`;
    fs.writeFileSync(
        path.join(projectPath, 'src/routes/index.js'),
        routes
    );

 

const dbConfig = `const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS servers
const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',');
dns.setServers(dnsServers);

const connectDB = async () => {
  try {
    console.log(\`📡 Using DNS servers: \${dnsServers.join(', ')}\`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
    return conn;
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠ Warning: Running without MongoDB connection');
    }
  }
};

module.exports = connectDB;
`;

    fs.writeFileSync(
        path.join(projectPath, 'src/config/db.js'),
        dbConfig
    );

    const server = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const loggerMiddleware = require('./middleware/logger');
const { errorMiddleware } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);


// Routes
app.use('/api', routes);


// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Express Backend is running' });
});


// Error handling middleware (must be last)
app.use(errorMiddleware);


// Start Server
app.listen(PORT, () => {
  console.log(\` Server running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
`;

  fs.writeFileSync(
    path.join(projectPath, 'src/server.js'),
    server
  );

  console.log(chalk.green('Route and config files created'));
}
