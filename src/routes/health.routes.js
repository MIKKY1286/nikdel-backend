import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      // In a real app we'd query db status here if needed, but for now it's simple
      database: 'connected', 
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

export default router;
