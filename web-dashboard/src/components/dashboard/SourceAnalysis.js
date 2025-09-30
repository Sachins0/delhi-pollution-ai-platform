import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  IconButton,
  Slider,
  Tooltip,
  Button
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer } from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FactoryIcon from "@mui/icons-material/Factory";
import ConstructionIcon from "@mui/icons-material/Construction";
import LandscapeIcon from "@mui/icons-material/Landscape";
import LoopIcon from "@mui/icons-material/Loop";

// Manual color and icon mapping
const SOURCE_TYPES = {
  vehicular: { color: "#29b6f6", icon: <DirectionsCarIcon /> },
  industrial: { color: "#ff7043", icon: <FactoryIcon /> },
  stubble_burning: { color: "#ffd54f", icon: <LocalFireDepartmentIcon /> },
  construction: { color: "#9575cd", icon: <ConstructionIcon /> },
  "dust_storm": { color: "#90a4ae", icon: <LandscapeIcon /> },
  "waste_burning": { color: "#4db6ac", icon: <LocalFireDepartmentIcon /> }
};

// Demo breakdown; replace with real data props/pulls
const demoData = [
  { type: "vehicular", value: 36 },
  { type: "industrial", value: 25 },
  { type: "stubble_burning", value: 19 },
  { type: "construction", value: 13 },
  { type: "dust_storm", value: 5 },
  { type: "waste_burning", value: 2 }
];

export default function SourceAnalysis({ sources = demoData, timeWindow = 24 }) {
  // timeWindow: hours - allows future filtering for "last X hours" etc
  const [window, setWindow] = useState(timeWindow);
  const [filter, setFilter] = useState(null);

  // Filtered data
  const filtered = filter
    ? sources.filter((d) => d.type === filter)
    : sources;

  // Calculate total and sorted breakdown
  const total = filtered.reduce((acc, val) => acc + val.value, 0);

  return (
    <Card sx={{ borderRadius: 5, bgcolor: "background.paper" }}>
      <CardHeader
        avatar={<AssessmentIcon fontSize="large" sx={{ color: "primary.main" }} />}
        title={
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Real-Time Source Analysis
          </Typography>
        }
        subheader={`Breakdown by source type (last ${window} hr)`}
        action={
          <>
            <Tooltip title="Adjust time window">
              <HistoryToggleOffIcon sx={{ mr: 1 }} />
            </Tooltip>
            <Slider
              value={window}
              min={1}
              max={72}
              step={1}
              marks={[{ value: 24, label: "24h" }, { value: 48, label: "48h" }, { value: 72, label: "72h" }]}
              onChange={(e, v) => setWindow(v)}
              sx={{ width: 100, color: "primary.main" }}
            />
            <Tooltip title="Reset Filter">
              <IconButton onClick={() => setFilter(null)}>
                <LoopIcon />
              </IconButton>
            </Tooltip>
          </>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Grid container spacing={3} alignItems="stretch">
          {/* Pie chart visualization */}
          <Grid item xs={12} md={6}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={95}
                  paddingAngle={5}
                  label={({ type, value }) => `${type.replace("_", " ")} (${value})`}
                >
                  {filtered.map((entry, idx) => (
                    <Cell
                      key={entry.type}
                      fill={SOURCE_TYPES[entry.type]?.color || "#90caf9"}
                      cursor="pointer"
                      onClick={() => setFilter(entry.type)}
                      // highlight effect for filter
                      stroke={filter === entry.type ? "#00e676" : "#fff"}
                      strokeWidth={filter === entry.type ? 4 : 1.5}
                    />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          {/* Right panel: % breakdown, legend */}
          <Grid item xs={12} md={6}>
            <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
              <Box mb={1}>
                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                  Top Sources
                </Typography>
                <Divider sx={{ mb: 1, mt: 0.5 }} />

                {/* Show as legend/summary list */}
                <Grid container spacing={1}>
                  {filtered.map((entry, i) => (
                    <Grid item xs={12} sm={6} key={entry.type}>
                      <Chip
                        icon={SOURCE_TYPES[entry.type]?.icon || <AssessmentIcon />}
                        label={
                          <span>
                            <b style={{ color: SOURCE_TYPES[entry.type]?.color || "#00e676" }}>
                              {entry.type?.replace("_", " ")}
                            </b>
                            : {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
                          </span>
                        }
                        variant={filter === entry.type ? "filled" : "outlined"}
                        sx={{
                          bgcolor: "#fff",
                          color: "#222",
                          fontWeight: 600,
                          fontSize: "1rem",
                          borderColor: SOURCE_TYPES[entry.type]?.color,
                          borderWidth: 2,
                          my: 0.3,
                          borderRadius: 2.5,
                          boxShadow: filter === entry.type ? "0 0 8px #00e67666" : ''
                        }}
                        onClick={() => setFilter(entry.type)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Summary stats */}
              <Box mt={2}>
                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                  Total sources analyzed:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {total}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<FilterAltIcon />}
                  onClick={() => setFilter(null)}
                  sx={{ mt: 0.5 }}
                >
                  Show All Sources
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
