import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Add,
  Policy,
  TrendingUp,
  AttachMoney,
  Group,
  Schedule,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  Close,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PolicyCard = ({ policy, onSelect, isSelected }) => {
  const getPriorityColor = (priority) => {
    if (priority > 0.9) return 'error';
    if (priority > 0.7) return 'warning';
    if (priority > 0.5) return 'info';
    return 'success';
  };

  const getPriorityLabel = (priority) => {
    if (priority > 0.9) return 'Critical';
    if (priority > 0.7) return 'High';
    if (priority > 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          cursor: 'pointer',
          border: isSelected ? '2px solid #00e676' : '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0,230,118,0.3)',
          }
        }}
        onClick={() => onSelect(policy)}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Chip 
              label={getPriorityLabel(policy.priority)}
              color={getPriorityColor(policy.priority)}
              size="small"
            />
            <Chip 
              label={policy.category}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Title */}
          <Typography variant="h6" gutterBottom sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #00e676, #2196f3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {policy.title}
          </Typography>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
            {policy.description}
          </Typography>

          {/* Metrics */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {Math.round(policy.predicted_impact.aqi_reduction)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AQI Reduction
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="info.main">
                  ₹{(policy.implementation.estimated_cost.amount / 10000000).toFixed(1)}Cr
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Est. Cost
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Progress Bars */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption">Effectiveness</Typography>
              <Typography variant="caption">{Math.round(policy.predicted_effectiveness * 100)}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={policy.predicted_effectiveness * 100}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption">Confidence</Typography>
              <Typography variant="caption">{Math.round(policy.confidence_score * 100)}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={policy.confidence_score * 100}
              color="secondary"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Timeline */}
          <Box display="flex" alignItems="center" gap={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {policy.implementation.timeline}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PolicyDetailDialog = ({ policy, open, onClose }) => {
  if (!policy) return null;

  const feasibilityData = [
    { name: 'Technical', value: policy.feasibility.technical_feasibility * 100, color: '#00e676' },
    { name: 'Political', value: policy.feasibility.political_feasibility * 100, color: '#2196f3' },
    { name: 'Economic', value: policy.feasibility.economic_feasibility * 100, color: '#ff9800' },
    { name: 'Social', value: policy.feasibility.social_acceptance * 100, color: '#9c27b0' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">{policy.title}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Overview */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {policy.description}
              </Typography>
            </Alert>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Impact Forecast</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color="success.main">
                    -{Math.round(policy.predicted_impact.aqi_reduction)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AQI Points Reduction
                  </Typography>
                </Box>
                <Typography variant="body2">
                  <strong>Population Benefited:</strong> {(policy.predicted_impact.population_benefited / 1000000).toFixed(1)}M people
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Implementation Cost</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color="info.main">
                    ₹{(policy.implementation.estimated_cost.amount / 10000000).toFixed(1)}Cr
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Investment
                  </Typography>
                </Box>
                <Typography variant="body2">
                  <strong>Cost per AQI point:</strong> ₹{(policy.implementation.estimated_cost.cost_per_aqi_reduction / 10000000).toFixed(2)}Cr
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feasibility Analysis */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Feasibility Analysis</Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feasibilityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value.toFixed(0)}%`}
                      >
                        {feasibilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Timeline & Resources */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Implementation Details</Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={policy.implementation.timeline} 
                    color="primary" 
                    icon={<Schedule />}
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Typography variant="subtitle2" gutterBottom>Resources Required:</Typography>
                <List dense>
                  {policy.implementation.resources_required.slice(0, 3).map((resource, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CheckCircle fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={resource}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Mitigation */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Risk Mitigation Strategies</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {policy.risk_mitigation.map((strategy, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={strategy} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Monitoring Indicators */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Monitoring Indicators</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {policy.monitoring_indicators.map((indicator, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Info color="info" />
                      </ListItemIcon>
                      <ListItemText primary={indicator} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          Approve Policy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function PolicyCenter() {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPolicyRecommendations();
  }, []);

  const fetchPolicyRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API endpoint
      const mockPolicies = generateMockPolicies();
      setPolicies(mockPolicies);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPolicies = () => {
    return [
      {
        policy_id: "policy_1",
        title: "Odd-Even Vehicle Restriction",
        category: "transportation",
        description: "Implement odd-even vehicle restriction scheme during high pollution days to reduce vehicular emissions",
        priority: 0.85,
        predicted_effectiveness: 0.72,
        predicted_impact: {
          aqi_reduction: 25,
          population_benefited: 15000000
        },
        implementation: {
          timeline: "immediate",
          estimated_cost: {
            amount: 75000000,
            cost_per_aqi_reduction: 3000000
          },
          resources_required: ["Traffic Police", "CCTV Monitoring", "Public Transport Enhancement"]
        },
        feasibility: {
          technical_feasibility: 0.9,
          political_feasibility: 0.6,
          economic_feasibility: 0.8,
          social_acceptance: 0.5
        },
        confidence_score: 0.78,
        risk_mitigation: [
          "Ensure adequate public transport capacity",
          "Implement gradual phase-in",
          "Set up real-time monitoring systems"
        ],
        monitoring_indicators: [
          "Traffic volume on major roads",
          "Real-time AQI measurements",
          "Public transport ridership data"
        ]
      },
      {
        policy_id: "policy_2",
        title: "Industrial Emission Standards Enforcement",
        category: "industrial",
        description: "Strict enforcement of emission standards with enhanced monitoring and penalties for non-compliant industries",
        priority: 0.92,
        predicted_effectiveness: 0.83,
        predicted_impact: {
          aqi_reduction: 35,
          population_benefited: 25000000
        },
        implementation: {
          timeline: "short_term",
          estimated_cost: {
            amount: 120000000,
            cost_per_aqi_reduction: 3400000
          },
          resources_required: ["Emission Monitoring Systems", "Inspection Teams", "Laboratory Testing"]
        },
        feasibility: {
          technical_feasibility: 0.85,
          political_feasibility: 0.75,
          economic_feasibility: 0.65,
          social_acceptance: 0.8
        },
        confidence_score: 0.82,
        risk_mitigation: [
          "Provide advance notice to industries",
          "Establish clear compensation mechanisms",
          "Set up rapid response teams"
        ],
        monitoring_indicators: [
          "Industrial emission levels",
          "Number of compliant industries",
          "Air quality improvement metrics"
        ]
      },
      {
        policy_id: "policy_3",
        title: "Cloud Seeding for Artificial Rain",
        category: "emergency_action",
        description: "Deploy cloud seeding technology to induce artificial rainfall during severe pollution episodes",
        priority: 0.95,
        predicted_effectiveness: 0.75,
        predicted_impact: {
          aqi_reduction: 60,
          population_benefited: 30000000
        },
        implementation: {
          timeline: "immediate",
          estimated_cost: {
            amount: 50000000,
            cost_per_aqi_reduction: 833000
          },
          resources_required: ["Aircraft", "Silver Iodide", "Meteorological Support"]
        },
        feasibility: {
          technical_feasibility: 0.7,
          political_feasibility: 0.8,
          economic_feasibility: 0.9,
          social_acceptance: 0.85
        },
        confidence_score: 0.75,
        risk_mitigation: [
          "Monitor weather conditions closely",
          "Coordinate with aviation authorities",
          "Prepare alternative interventions"
        ],
        monitoring_indicators: [
          "Precipitation levels",
          "AQI reduction post-intervention",
          "Cloud formation patterns"
        ]
      },
      {
        policy_id: "policy_4",
        title: "Construction Dust Control Mandate",
        category: "construction",
        description: "Mandatory implementation of dust control measures at all construction sites with regular monitoring",
        priority: 0.68,
        predicted_effectiveness: 0.65,
        predicted_impact: {
          aqi_reduction: 15,
          population_benefited: 8000000
        },
        implementation: {
          timeline: "immediate",
          estimated_cost: {
            amount: 30000000,
            cost_per_aqi_reduction: 2000000
          },
          resources_required: ["Inspection Teams", "Water Tankers", "Dust Suppressants"]
        },
        feasibility: {
          technical_feasibility: 0.95,
          political_feasibility: 0.7,
          economic_feasibility: 0.85,
          social_acceptance: 0.75
        },
        confidence_score: 0.72,
        risk_mitigation: [
          "Regular site inspections",
          "Penalty enforcement mechanisms",
          "Contractor training programs"
        ],
        monitoring_indicators: [
          "Construction site compliance rate",
          "PM10 levels near construction sites",
          "Number of violations reported"
        ]
      },
      {
        policy_id: "policy_5",
        title: "Public Transport Frequency Boost",
        category: "transportation",
        description: "Increase metro and bus frequency while reducing fares during high pollution episodes",
        priority: 0.72,
        predicted_effectiveness: 0.58,
        predicted_impact: {
          aqi_reduction: 12,
          population_benefited: 20000000
        },
        implementation: {
          timeline: "immediate",
          estimated_cost: {
            amount: 40000000,
            cost_per_aqi_reduction: 3300000
          },
          resources_required: ["Additional Buses", "Metro Frequency Control", "Subsidized Fares"]
        },
        feasibility: {
          technical_feasibility: 0.8,
          political_feasibility: 0.85,
          economic_feasibility: 0.7,
          social_acceptance: 0.9
        },
        confidence_score: 0.68,
        risk_mitigation: [
          "Ensure adequate fleet availability",
          "Monitor passenger load capacity",
          "Coordinate with transport authorities"
        ],
        monitoring_indicators: [
          "Public transport ridership",
          "Average commute time",
          "Passenger satisfaction surveys"
        ]
      },
      {
        policy_id: "policy_6",
        title: "Stubble Burning Alternative Incentives",
        category: "agricultural",
        description: "Provide financial incentives and machinery support for farmers to adopt alternatives to stubble burning",
        priority: 0.88,
        predicted_effectiveness: 0.85,
        predicted_impact: {
          aqi_reduction: 45,
          population_benefited: 35000000
        },
        implementation: {
          timeline: "long_term",
          estimated_cost: {
            amount: 500000000,
            cost_per_aqi_reduction: 11100000
          },
          resources_required: ["Happy Seeder Machines", "Farmer Subsidies", "Training Programs"]
        },
        feasibility: {
          technical_feasibility: 0.75,
          political_feasibility: 0.8,
          economic_feasibility: 0.6,
          social_acceptance: 0.85
        },
        confidence_score: 0.85,
        risk_mitigation: [
          "Ensure adequate subsidy funding",
          "Provide comprehensive farmer training",
          "Monitor adoption rates closely"
        ],
        monitoring_indicators: [
          "Satellite fire detection data",
          "Alternative method adoption rate",
          "Farmer participation levels"
        ]
      }
    ];
  };

  const handlePolicySelect = (policy) => {
    setSelectedPolicy(policy);
    setDetailDialogOpen(true);
  };

  const getCategoryStats = () => {
    const categories = policies.reduce((acc, policy) => {
      acc[policy.category] = (acc[policy.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories).map(([category, count]) => ({
      category: category.replace('_', ' ').toUpperCase(),
      count,
      color: {
        transportation: '#ff5722',
        industrial: '#9c27b0',
        emergency_action: '#f44336',
        construction: '#795548',
        agricultural: '#4caf50'
      }[category] || '#757575'
    }));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h1" gutterBottom>
              Policy Recommendation Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered policy recommendations for pollution control and management
            </Typography>
          </Box>
          
          <Tooltip title="Refresh Recommendations">
            <Fab 
              color="primary" 
              onClick={fetchPolicyRecommendations}
              disabled={loading}
            >
              <Refresh />
            </Fab>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Policy color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" color="primary">
                      {policies.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Policies
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {Math.round(policies.reduce((sum, p) => sum + p.predicted_impact.aqi_reduction, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total AQI Reduction
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      ₹{(policies.reduce((sum, p) => sum + p.implementation.estimated_cost.amount, 0) / 10000000).toFixed(0)}Cr
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Investment
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Group color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {(policies.reduce((sum, p) => sum + p.predicted_impact.population_benefited, 0) / 1000000).toFixed(0)}M
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      People Benefited
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Policy Grid */}
        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid item xs={12} md={6} lg={4} key={policy.policy_id}>
              <PolicyCard 
                policy={policy}
                onSelect={handlePolicySelect}
                isSelected={selectedPolicy?.policy_id === policy.policy_id}
              />
            </Grid>
          ))}
        </Grid>

        {/* Policy Detail Dialog */}
        <PolicyDetailDialog
          policy={selectedPolicy}
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedPolicy(null);
          }}
        />
      </motion.div>
    </Container>
  );
}
