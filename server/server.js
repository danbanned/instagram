const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'instagram-clone-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Mongo connection failed:', err.message);
    process.exit(1);
  });
