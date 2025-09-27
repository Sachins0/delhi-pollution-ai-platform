import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function RouteSuggestion({ route }) {
  if (!route) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Route Suggestion</Text>
      <Text style={styles.details}>Distance: {route.distance} km</Text>
      <Text style={styles.details}>Estimated AQI: {route.aqi}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL(route.navigationUrl)}
      >
        <Text style={styles.buttonText}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(22,42,71,0.9)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#00e676', marginBottom: 8 },
  details: { fontSize: 14, color: '#fff', marginBottom: 4 },
  button: {
    backgroundColor: '#00e676',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
