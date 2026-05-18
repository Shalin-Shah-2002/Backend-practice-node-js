import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Mount routes – auth first (login), then protected user routes
app.use('/auth', authRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

