/**
 * Socket.IO service for real-time communication
 */

const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.locationSubscriptions = new Map(); // clientId -> location
  }

  /**
   * Initialize Socket.IO server
   */
  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('Socket.IO service initialized');
    
    return this.io;
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Handle location subscription
      socket.on('subscribe_location', (location) => {
        try {
          const { lat, lng } = location;
          const room = `location_${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
          
          // Leave previous room if subscribed
          const previousSubscription = this.locationSubscriptions.get(socket.id);
          if (previousSubscription) {
            socket.leave(previousSubscription.room);
          }

          // Join new room
          socket.join(room);
          this.locationSubscriptions.set(socket.id, {
            room,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            subscribedAt: new Date()
          });

          console.log(`Client ${socket.id} subscribed to location: ${lat}, ${lng}`);
          
          // Send confirmation
          socket.emit('location_subscribed', {
            success: true,
            room,
            coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
            message: 'Successfully subscribed to location updates'
          });

          // Send immediate data if available
          this.sendLocationData(socket, room);
          
        } catch (error) {
          console.error('Location subscription error:', error);
          socket.emit('error', { message: 'Failed to subscribe to location' });
        }
      });

      // Handle location unsubscription
      socket.on('unsubscribe_location', (location) => {
        try {
          const subscription = this.locationSubscriptions.get(socket.id);
          if (subscription) {
            socket.leave(subscription.room);
            this.locationSubscriptions.delete(socket.id);
            console.log(`Client ${socket.id} unsubscribed from location`);
          }
        } catch (error) {
          console.error('Location unsubscription error:', error);
        }
      });

      // Handle client heartbeat
      socket.on('heartbeat', () => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.lastActivity = new Date();
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
        this.locationSubscriptions.delete(socket.id);
      });

      // Handle error
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Send location-specific data to a socket
   */
  async sendLocationData(socket, room) {
    try {
      // This would typically fetch real data from database
      // For now, sending mock data
      const mockData = {
        aqi_data: [{
          station_id: 'mock_station',
          aqi_value: 150 + Math.random() * 100,
          timestamp: new Date(),
          location: { type: 'Point', coordinates: [77.2090, 28.6139] }
        }],
        timestamp: new Date(),
        room
      };

      socket.emit('realtime_update', mockData);
    } catch (error) {
      console.error('Error sending location data:', error);
    }
  }

  /**
   * Broadcast AQI updates to specific locations
   */
  emitAQIUpdateToLocations(aqiData, eventName = 'realtime_update', additionalData = {}) {
    if (!this.io) return;

    try {
      // Emit to specific location rooms
      aqiData.forEach((point) => {
        if (point.location && point.location.coordinates) {
          const lat = point.location.coordinates[1].toFixed(3); // latitude
          const lng = point.location.coordinates[0].toFixed(3); // longitude
          const room = `location_${lat}_${lng}`;

          this.io.to(room).emit(eventName, {
            aqi_data: [point],
            timestamp: new Date(),
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            ...additionalData
          });
        }
      });

      // Also emit general broadcast for clients not subscribed to specific locations
      this.io.emit(eventName, {
        aqi_data: aqiData,
        timestamp: new Date(),
        total_clients: this.connectedClients.size,
        ...additionalData
      });

    } catch (error) {
      console.error('Error emitting AQI updates:', error);
    }
  }

  /**
   * Broadcast general updates to all clients
   */
  broadcastUpdate(eventName, data) {
    if (!this.io) return;
    
    try {
      this.io.emit(eventName, {
        ...data,
        timestamp: new Date(),
        total_clients: this.connectedClients.size
      });
    } catch (error) {
      console.error('Error broadcasting update:', error);
    }
  }

  /**
   * Send data to specific room
   */
  emitToRoom(room, eventName, data) {
    if (!this.io) return;
    
    try {
      this.io.to(room).emit(eventName, {
        ...data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error emitting to room:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      locationSubscriptions: this.locationSubscriptions.size,
      rooms: this.io ? Array.from(this.io.sockets.adapter.rooms.keys()).filter(room => room.startsWith('location_')) : []
    };
  }

  /**
   * Get IO instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Cleanup inactive connections
   */
  cleanupConnections() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.connectedClients.forEach((client, socketId) => {
      if (now - client.lastActivity > timeout) {
        console.log(`Cleaning up inactive connection: ${socketId}`);
        this.connectedClients.delete(socketId);
        this.locationSubscriptions.delete(socketId);
      }
    });
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
