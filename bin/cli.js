#!/usr/bin/env node


const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('../package.json');

const version = packageJson.version;

program
  .version(version)
  .description('Create a new Express.js backend application')
  .argument('<project-name>', 'Name of the project')
  .action(async (projectName) => {
    try {
      console.log(chalk.blue(`Creating a new Express.js backend application: ${projectName}`));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useAuth',
          message: 'Include JWT authentication?',
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
          name: 'useDNSFix',
          message: 'Use custom DNS (fixes MongoDB connection issues on some networks)?',
          default: false
        },
        {
          type: 'confirm',
          name: 'useRateLimit',
          message: 'Include rate limiting?',
          default: true
        },
        {
          type: 'confirm',
          name: 'useFileUpload',
          message: 'Include file upload support (multer)?',
          default: false
        },
        {
          type: 'confirm',
          name: 'installDeps',
          message: 'Install dependencies now?',
          default: true
        },
        {
          type: 'confirm',
          name: 'useAxios',
          message: 'Include axios (for external API calls)?',
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

      createFolderStructure(projectPath, answers);
      createConfigFiles(projectPath, answers);
      createMiddlewareFiles(projectPath, answers);
      createRouteFiles(projectPath, answers);
      if (answers.useAuth) {
        createUserModel(projectPath);
        createAuthController(projectPath);
      }
      if(answers.useValidation && answers.useAuth){
        createAuthValidation(projectPath);
      }
      if(answers.useAxios){
        createAxiosUtil(projectPath);
      }

      try{
        execSync('git --version', { stdio: 'ignore' });
        console.log(chalk.green(' Initializing git repository...'));
        execSync('git init', { cwd: projectPath });
      } catch (error) {
        console.error(chalk.red('Git not found. Skipping git initialization.'));
      }

      let installFailed = false;
      if (answers.installDeps) {
        console.log(chalk.cyan(' Installing dependencies...\n'));
        try{
          execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
        } catch (error) {
          installFailed = true;
        }
        
      }



      console.log(chalk.green.bold('\n Project created successfully!\n'));


      if(installFailed){
        console.log(chalk.yellow('\n Dependency installation failed. Run this manually:'));
        console.log(chalk.white(`  cd ${projectName}`));
        console.log(chalk.white('  npm install\n'));
      }
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.white(`  cd ${projectName}`));
      console.log(chalk.white('  cp .env.example .env'));
      console.log(chalk.white('  npm start\n'));
    } catch (error) {
      console.error(chalk.red('\n Error creating project:'), error.message);
      process.exit(1);
    }
  });
  
program.parse();





const createFolderStructure = (projectPath, answers) => {
  const folders = [
    'src/config',
    'src/middleware',
    'src/routes',
    'src/controllers',
    'src/models',
    'src/utils',
    'src/validation'
  ];

  if (answers.useFileUpload) {
    folders.push('uploads');
  }

  folders.forEach(folder => {
    fs.ensureDirSync(path.join(projectPath, folder));
  });

  console.log(chalk.green(' Folder structure created'));
}






const createConfigFiles = (projectPath, answers) => {
  const packageJson = {
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
      helmet: '^7.1.0',
      ...(answers.useAuth && { jsonwebtoken: '^9.0.0' , bcryptjs: '^2.4.3'}),
      ...(answers.useValidation && { joi: '^17.9.0' }),
      ...(answers.useRateLimit && { 'express-rate-limit': '^6.7.0' }),
      ...(answers.useFileUpload && { multer: '^2.0.0' }),
      ...(answers.useAxios && { axios: '^1.6.0' }),

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
${answers.useDNSFix ? '\n# DNS Configuration (for MongoDB connection issues)\nDNS_SERVERS=8.8.8.8,8.8.4.4' : ''}

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
${answers.useAuth ? 'BCRYPT_SALT_ROUNDS=10' : ''}

# CORS (set to your frontend URL; use a specific domain in production not *)
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
${answers.useAxios ? '\n# External API\nAPI_BASE_URL=' : ''}
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
${answers.useFileUpload ? 'uploads/*\n!uploads/.gitkeep' : ''}
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

  if(answers.useFileUpload){
    fs.writeFileSync(path.join(projectPath, 'uploads/.gitkeep'), '');
  }
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







  if (answers.useRateLimit) {
    const rateLimiter = `const ratelimit= require('express-rate-limit');

const limiter=ratelimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

${answers.useAuth? `// stricter rate limit for auth routes(prevent brute force attacks)
  const authLimiter=ratelimit({
  windowMs: 15 * 60 * 1000,
  max:5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
  
  `:''}

module.exports={limiter${answers.useAuth? ', authLimiter' : ''}};


`;

    fs.writeFileSync(
      path.join(projectPath, 'src/middleware/rateLimiter.js'),
      rateLimiter
    );

  }



  if(answers.useFileUpload){
    const multerMiddleware= ` const multer = require('multer');
    const path = require('path');

    // Set storage engine
    const storage = multer.diskStorage({
      destination: function (req,file ,cb){
        cb(null, path.join(process.cwd(), 'uploads'));
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
      }
       
  });


  //file filter
  const fileFilter = (req, file, cb) =>{
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype  = allowedTypes.test(file.mimetype);

    if(extname && mimetype){
      return cb(null,true);
    }else{
      cb(new Error('Error: Images Only!'));
    }
  };

  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
  
  });

  module.exports = upload;
    
    
    `;


    fs.writeFileSync(
      path.join(projectPath, 'src/middleware/upload.js'),
      multerMiddleware
    )
  }






  if (answers.useAuth) {
    const auth = `const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('./errorHandler');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')){
    return next(new ErrorHandler('Authorization header is missing or malformed', 401));
  }
  const token = authHeader.split(' ')[1];


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
${answers.useAuth ? "const {register,login} = require('../controllers/authController');" : ''}
${(answers.useRateLimit && answers.useAuth) ? "const { authLimiter } = require('../middleware/rateLimiter');" : ''}
${(answers.useAuth && answers.useValidation) ? "const validateRequest = require('../middleware/validation');" : ''}
${(answers.useAuth && answers.useValidation) ? "const { registerSchema, loginSchema } = require('../validation/authValidation');" : ''}
${answers.useFileUpload ? "const upload = require('../middleware/upload');" : ''}


// Public routes
router.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

${answers.useAuth? `
  // Auth routes
  // Register and Login routes
  router.post('/auth/register', ${answers.useRateLimit ? 'authLimiter, ' : ''}${answers.useValidation ? 'validateRequest(registerSchema), ' : ''}register);
  router.post('/auth/login', ${answers.useRateLimit ? 'authLimiter, ' : ''}${answers.useValidation ? 'validateRequest(loginSchema), ' : ''}login);
` : ''}

${answers.useAuth ? `
// Protected routes
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
` : ''}

${answers.useFileUpload ? `
  // File upload route
  router.post('/upload', upload.single('file'), (req,res) =>{
    if(!req.file){
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: req.file
    });
    
  });
  
  
  `: ''}



module.exports = router;
`;
  fs.writeFileSync(
    path.join(projectPath, 'src/routes/index.js'),
    routes
  );





  const dbConfig = `const mongoose = require('mongoose');
${answers.useDNSFix ? "const dns = require('dns');" : ''}

${answers.useDNSFix ? `// Set custom DNS servers (fixes connection issues on some networks)
const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,8.8.4.4').split(',');
dns.setServers(dnsServers);
` : ''}

const connectDB = async () => {
  ${answers.useDNSFix ? "console.log(`Using DNS servers: ${dnsServers.join(', ')}`);" : ''}
  
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  return conn;
};

module.exports = connectDB;
`;

  fs.writeFileSync(
    path.join(projectPath, 'src/config/db.js'),
    dbConfig
  );





  const server = `require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const loggerMiddleware = require('./middleware/logger');
const { errorMiddleware } = require('./middleware/errorHandler');

const app = express();
${answers.useRateLimit ? "const { limiter } = require('./middleware/rateLimiter');" : ''}

const PORT = process.env.PORT || 5000;



// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(loggerMiddleware);
${answers.useRateLimit ? 'app.use(limiter);' : ''}


// Routes
app.use('/api', routes);


// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Express Backend is running' });
});


// Error handling middleware (must be last)
app.use(errorMiddleware);

${answers.useAuth ? `// validation JWT secret before starting server
  if(!process.env.JWT_SECRET){
    console.error('JWT_SECRET is required. Please set it before starting the server.');
    process.exit(1);
  }
    if(process.env.JWT_SECRET === 'your-secret-key-change-this-in-production'){
    console.warn('please change the default JWT_SECRET in .env file for production use');
    process.exit(1);
  }
` : ''}


//connect to MongoDB
const startServer = async() =>{
    try{
      await connectDB(); 
      app.listen(PORT, () =>{
        console.log(\` Server running on port \${PORT}\`);
        console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
      });
    }catch(error){
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  }

startServer();

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





function createUserModel(projectPath) {
  const userModel = `const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  
  const userSchema = new mongoose.Schema(
    {
      name:{
        type: String,
        required: [true, 'Name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\\..+/, 'Please fill a valid email address'],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
      }, 
    },
    { timestamps: true }
      
  );


  //hash password before saving
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    let salt = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    if(!Number.isInteger(salt) || salt<10){
      salt = 10;
    }
    this.password = await bcrypt.hash(this.password,salt);
    next();
  });


  //compare password method
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  module.exports = mongoose.model('User', userSchema);
  
  `;

    fs.writeFileSync(
      path.join(projectPath, 'src/models/User.js'),
      userModel
    )

    console.log(chalk.green('User model created'));
}




function createAuthController(projectPath) {
  const authController = `const jwt= require('jsonwebtoken');
  const User=require('../models/User');
  const { ErrorHandler } = require('../middleware/errorHandler');

  //generate JWT token
  const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  };
  

  //register user
  const register= async(req,res,next) =>{
    try{
      const {name,email,password}=req.body;

      const existingUser= await User.findOne({email});
      if(existingUser){
        return next(new ErrorHandler('Email already Registered',400));
      }

      const user= await User.create({name,email,password});
      const token= generateToken(user._id);

      res.status(201).json({
        success:true,
        message:'User registered successfully',
        token,
        user:{
          id:user._id,
          name:user.name,
          email:user.email
        }
      });
    }catch(error){
      next(error);
    }
  };



  //login user
  const login =async(req,res,next) =>{
    try{
      const {email,password}=req.body;

      const user=await User.findOne({email}).select('+password');
      if(!user){
        return next(new ErrorHandler('Invalid email or password',401));
      }

      const isMatch= await user.comparePassword(password);
      if(!isMatch){
        return next(new ErrorHandler('Invalid email or password',401));
      }

      const token=generateToken(user._id);

      res.status(200).json({
        success:true,
        message:'User logged in successfully',
        token,
        user:{
          id:user._id,
          name:user.name,
          email: user.email
        }
      });
    }catch(error){
      next(error);
    }
  }
  
  
  module.exports = {
    register,
    login
  };
  
  `;



  fs.writeFileSync(
    path.join(projectPath, 'src/controllers/authController.js'),
    authController
  );

  console.log(chalk.green('Auth controller created'));
}





function createAuthValidation(projectPath) {
  const authValidation = `const Joi = require('joi');

  const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  module.exports = {
    registerSchema,
    loginSchema
  };

  `;

  fs.writeFileSync(
    path.join(projectPath, 'src/validation/authValidation.js'),
    authValidation
  );

  console.log(chalk.green('Auth validation Schema created'));
}



function createAxiosUtil(projectPath){
  const axiosUtil = ` const axios = require('axios');

  //create an axios instance with default config
  const axiosInstance = axios.create({
    baseURL: process.env.API_BASE_URL || '',
    timeout: 10000,
    headers:{
      'Content-Type' : 'application/json',
    }
  });

  //request interceptor
  axiosInstance.interceptors.request.use(
    (config) =>{
      console.log(\`Making request to: \${config.url}\`);;
      return config;
    },
    (error) => Promise.reject(error)
  );

  //response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API call error: ', error.response ? error.response.data : error.message);
      return Promise.reject(error);
    }
  );

  //fetch data function
  const fetchData = async (url) => {
    try{
      const response = await axiosInstance.get(url);
      return response.data;
    }catch(error){
      throw new Error(\`Failed to fetch data: \${error.message}\`);
    }
  };

  //post data function
  const postData = async (url, data) => {
    try{
      const response = await axiosInstance.post(url, data);
      return response.data;
    }catch(error){
      throw new Error(\`Failed to post data: \${error.message}\`);
    }
  };

  module.exports = {
    axiosInstance,
    fetchData,
    postData,
  };
  
  
  
  `;


  fs.writeFileSync(
    path.join(projectPath, 'src/utils/axiosUtil.js'),
    axiosUtil
  );

  console.log(chalk.green('Axios utility created'));
}