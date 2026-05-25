import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';
import plansRoutes from './routes/plansRoutes.js';
import subscriptionsRoutes from './routes/subscriptionsRoutes.js';
import userRoutes from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Lightweight liveness check that stays independent of auth and the database.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (views)
app.use(express.static(path.join(__dirname, 'views')));

// Swagger UI bundle and OpenAPI spec
app.use('/api-docs', express.static(path.join(__dirname, 'public', 'swagger')));
app.get('/swagger.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'swagger', 'swagger.json'));
});

// Public catalog and auth routes
app.use('/api/plans', plansRoutes);
app.use('/auth', authRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/users', userRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

