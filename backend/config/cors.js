const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000", 
        "https://ahorr-ar.vercel.app"
      ];
      
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
  };
  
  module.exports = corsOptions;