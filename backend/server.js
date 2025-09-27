require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const aqiRoutes = require('./routes/aqi');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// Routes
app.use('/api/aqi', aqiRoutes);
app.get('/api/health', (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
}); 



// socket service init
socketService.init(io);

// In backend/server.js - UPDATE the existing socket handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('subscribe_location', (location) => {
    // Create room name with 3 decimal precision
    const lat = parseFloat(location.lat).toFixed(3);
    const lng = parseFloat(location.lng).toFixed(3);
    const room = `location_${lat}_${lng}`;
    
    socket.join(room);
    console.log(`Client ${socket.id} subscribed to ${room}`);
    
    // Send immediate update for this location if available
    socket.emit('location_subscribed', {
      room: room,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      message: 'Successfully subscribed to location updates'
    });
  });

  socket.on('unsubscribe_location', (location) => {
    const lat = parseFloat(location.lat).toFixed(3);
    const lng = parseFloat(location.lng).toFixed(3);
    const room = `location_${lat}_${lng}`;
    
    socket.leave(room);
    console.log(`Client ${socket.id} unsubscribed from ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});


// Example to emit updates to specific locations (with simplified spatial grouping)
function emitAQIUpdateToLocations(io, aqiData) {
  aqiData.forEach((point) => {
    const lat = point.location.coordinates[1].toFixed(3);
    const lng = point.location.coordinates[0].toFixed(3);
    const room = `location_${lat}_${lng}`;

    io.to(room).emit('realtime_update', {
      aqi_data: [point],
      timestamp: new Date(),
    });
  });
}

// demo emitter
setInterval(() => {
  const sample = [
    { latitude: 28.6139, longitude: 77.2090, intensity: Math.floor(100 + Math.random() * 200), sourceType: 'vehicular' },
    { latitude: 28.5355, longitude: 77.3910, intensity: Math.floor(100 + Math.random() * 200), sourceType: 'industrial' }
  ];
  io.emit('aqi_update', sample);
  io.emit('sources_update', sample.map(s => ({ sourceType: s.sourceType, value: s.intensity })));
  io.emit('forecast_update', [{ day: 'tomorrow', aqi: Math.floor(140 + Math.random() * 100) }]);
}, 5000);

// connect DB
connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server started on port ${PORT}`)))
  .catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
  });
