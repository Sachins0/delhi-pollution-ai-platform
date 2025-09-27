import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AQICategoryColors = {
  Good: '#00e400',
  Moderate: '#ffff00',
  'Unhealthy for Sensitive': '#ff7e00',
  Unhealthy: '#ff0000',
  'Very Unhealthy': '#8f3f97',
  Hazardous: '#7e0023',
};

export default function AQISummaryCard({ aqi, category, lastUpdated }) {
  const color = AQICategoryColors[category] || '#757575';

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={[styles.aqiValue, { color }]}>{aqi}</Text>
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.updated}>Updated: {lastUpdated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(22,42,71,0.9)',
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 18,
    marginVertical: 4,
    color: '#fff',
  },
  updated: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});
