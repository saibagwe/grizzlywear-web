import express, { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router: express.Router = Router();

router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
