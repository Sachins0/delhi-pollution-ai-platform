import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [aqiData, setAqiData] = useState([]);
  const [pollutionSources, setPollutionSources] = useState([]);
  const [forecasts, setForecasts] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Real-time data listeners
    newSocket.on('aqi_update', (data) => {
      setAqiData(data);
    });

    newSocket.on('sources_update', (data) => {
      setPollutionSources(data);
    });

    newSocket.on('forecast_update', (data) => {
      setForecasts(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

    const subscribeToLocation = (latitude, longitude) => {
    if (socket) {
      // Unsubscribe from previous location if any
      if (window.currentSubscription) {
        socket.emit('unsubscribe_location', window.currentSubscription);
      }
      
      // Subscribe to new location
      const location = { lat: latitude, lng: longitude };
      socket.emit('subscribe_location', location);
      window.currentSubscription = location;
      
      console.log(`Subscribed to location updates: ${latitude}, ${longitude}`);
    }
  };


  const value = {
    socket,
    connected,
    aqiData,
    pollutionSources,
    forecasts,
    subscribeToLocation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
