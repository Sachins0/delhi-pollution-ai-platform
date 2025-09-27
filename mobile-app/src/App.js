import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AQISummaryCard from './components/AQISummaryCard';
import RouteSuggestion from './components/RouteSuggestion';
import { io } from 'socket.io-client';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [routeSuggestion, setRouteSuggestion] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to default location Delhi center
      newSocket.emit('subscribe_location', { lat: 28.6139, lng: 77.2090 });
    });

    newSocket.on('realtime_update', (data) => {
      if (data.aqi_data && data.aqi_data.length > 0) {
        // Use first data point for summary
        setAqiData(data.aqi_data[0]);
      }

      if (data.route_suggestion) {
        setRouteSuggestion(data.route_suggestion);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Delhi-NCR Air Quality</Text>
        {!isConnected && <Text style={styles.warningText}>Connecting to live data...</Text>}

        {aqiData ? (
          <>
            <AQISummaryCard
              aqi={Math.round(aqiData.aqi_value || 150)}
              category={aqiData.category?.level || 'Moderate'}
              lastUpdated={new Date(aqiData.timestamp).toLocaleTimeString()}
            />
            <RouteSuggestion route={routeSuggestion || {
              distance: 4.2,
              aqi: 75,
              navigationUrl: "https://www.google.com/maps/dir/?api=1&destination=28.628,%2077.211"
            }} />
          </>
        ) : (
          <ActivityIndicator size="large" color="#00e676" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00e676',
    marginBottom: 20,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 14,
    marginBottom: 10,
  },
});
