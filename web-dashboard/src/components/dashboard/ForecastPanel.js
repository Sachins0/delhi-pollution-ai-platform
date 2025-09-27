import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Avatar,
  Divider,
  Tooltip,
} from "@mui/material";
import StormIcon from "@mui/icons-material/Storm";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import TimelineIcon from "@mui/icons-material/Timeline";
import { ResponsiveContainer, LineChart, Line, Tooltip as ReTooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";

// Mock demo data (replace with actual forecast prop!)
const forecastDemo = Array.from({ length: 24 }, (_, i) => ({
  timestamp: Date.now() + i * 3600 * 1000,
  predicted_aqi: 115 + Math.round(60 * Math.sin(i / 2 + 0.3)),
  pm25: 40 + Math.round(20 * Math.cos(i / 4)),
  pm10: 70 + Math.round(30 * Math.cos(i / 5)),
  contributing_factors: [i % 12 < 4 ? "vehicular" : i % 12 < 8 ? "industrial" : "stubble_burning"],
  confidence: 0.9 - (0.9 - 0.75) * (i / 24)
}));

function getAQICategory(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
function getAQIColor(aqi) {
  if (aqi <= 50) return "#43a047";
  if (aqi <= 100) return "#fbc02d";
  if (aqi <= 150) return "#fb8c00";
  if (aqi <= 200) return "#e53935";
  if (aqi <= 300) return "#8e24aa";
  return "#6d4c41";
}

export default function ForecastPanel({ forecasts = forecastDemo }) {
  // Prepare chart data
  const chartData = forecasts.map(f => ({
    time: new Date(f.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    AQI: f.predicted_aqi,
    PM25: f.pm25,
    PM10: f.pm10,
  }));
  // Get max/min for today
  const maxAQI = Math.max(...forecasts.map(f => f.predicted_aqi));
  const minAQI = Math.min(...forecasts.map(f => f.predicted_aqi));
  const high = forecasts.find(f => f.predicted_aqi === maxAQI);
  const low = forecasts.find(f => f.predicted_aqi === minAQI);

  return (
    <Card sx={{ borderRadius: 4, overflow: "visible" }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <StormIcon sx={{ color: "primary.main", mr: 1 }} fontSize="large" />
          <Typography variant="h5" fontWeight={700}>
            AQI & Pollution Forecast
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 300]} />
                  <CartesianGrid strokeDasharray="3 6" />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="AQI" stroke="#4361ee" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="PM25" stroke="#43a047" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="PM10" stroke="#fb8c00" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Highlights (Next 24h)
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" alignItems="center" mb={1.5}>
                <Avatar sx={{ bgcolor: getAQIColor(high.predicted_aqi), mr: 1 }}>
                  <ArrowUpwardIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Peak AQI</Typography>
                  <Typography color={getAQIColor(high.predicted_aqi)} variant="h6" fontWeight={700}>
                    {high.predicted_aqi} <span style={{ fontSize: 12 }}>({getAQICategory(high.predicted_aqi)})</span>
                  </Typography>
                  <Typography variant="caption">{new Date(high.timestamp).toLocaleTimeString([], { hour: "2-digit" })}</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" mb={1.5}>
                <Avatar sx={{ bgcolor: getAQIColor(low.predicted_aqi), mr: 1 }}>
                  <ArrowDownwardIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Lowest AQI</Typography>
                  <Typography color={getAQIColor(low.predicted_aqi)} variant="h6" fontWeight={700}>
                    {low.predicted_aqi} <span style={{ fontSize: 12 }}>({getAQICategory(low.predicted_aqi)})</span>
                  </Typography>
                  <Typography variant="caption">{new Date(low.timestamp).toLocaleTimeString([], { hour: "2-digit" })}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box mt={2}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={0.5}>Main Sources Impact</Typography>
                {forecasts.slice(0, 3).map((d, i) => (
                  <Chip
                    key={i}
                    label={d.contributing_factors[0].replace("_", " ")}
                    color={d.contributing_factors[0] === "vehicular" ? "info" : d.contributing_factors[0] === "industrial" ? "warning" : "error"}
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                    avatar={<TimelineIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
