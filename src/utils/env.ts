const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_PORT: Number(process.env.APP_PORT) || 8080,
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:clip123@localhost:3306/clip',
  APP_API_URL: process.env.APP_API_URL || 'http://localhost:8080',
  APP_JWT_SECRET: process.env.APP_JWT_SECRET,
  APP_JWT_REFRESH_SECRET:
    process.env.APP_JWT_REFRESH_SECRET,
  APP_FRONTEND_URL: process.env.APP_FRONTEND_URL || 'https://localhost:5173/',
}

export default ENV;