pythonimport numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, r2_score
import joblib
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import json

class PolicyRecommendationEngine:
    def __init__(self):
        self.models = {
            'effectiveness_predictor': None,
            'urgency_classifier': None,
            'cost_estimator': None,
            'impact_forecaster': None
        }
        
        self.scalers = {
            'features': StandardScaler(),
            'cost': StandardScaler()
        }
        
        self.label_encoders = {
            'policy_type': LabelEncoder(),
            'urgency_level': LabelEncoder()
        }
        
        # Policy categories and their characteristics
        self.policy_categories = {
            'transportation': {
                'base_cost': 50000000,  # 5 Crore INR
                'implementation_time': 30,  # days
                'effectiveness_factors': ['traffic_density', 'vehicle_count', 'fuel_quality']
            },
            'industrial': {
                'base_cost': 100000000,  # 10 Crore INR
                'implementation_time': 90,  # days
                'effectiveness_factors': ['industrial_density', 'emission_standards', 'monitoring']
            },
            'agricultural': {
                'base_cost': 200000000,  # 20 Crore INR
                'implementation_time': 120,  # days
                'effectiveness_factors': ['crop_area', 'farmer_cooperation', 'alternatives_available']
            },
            'construction': {
                'base_cost': 25000000,  # 2.5 Crore INR
                'implementation_time': 15,  # days
                'effectiveness_factors': ['construction_sites', 'dust_control', 'monitoring_capability']
            },
            'emergency_action': {
                'base_cost': 10000000,  # 1 Crore INR
                'implementation_time': 1,  # days
                'effectiveness_factors': ['immediate_impact', 'enforcement_capability', 'public_compliance']
            }
        }
        
        # Comprehensive policy database
        self.policy_templates = self.load_policy_templates()
        
        self.feature_columns = [
            'current_aqi', 'pm25_level', 'pm10_level', 'no2_level',
            'dominant_source_vehicular', 'dominant_source_industrial', 
            'dominant_source_stubble', 'dominant_source_construction',
            'temperature', 'humidity', 'wind_speed', 'season',
            'is_weekend', 'is_winter', 'is_festival_season',
            'population_affected', 'sensitive_locations_nearby',
            'previous_policy_success_rate', 'budget_available',
            'enforcement_capacity', 'public_awareness_level'
        ]
        
        self.is_trained = False
        self.version = "2.0.0"

    def load_policy_templates(self):
        """Load comprehensive policy templates with detailed specifications"""
        return {
            # Transportation Policies
            'odd_even_scheme': {
                'category': 'transportation',
                'title': 'Odd-Even Vehicle Restriction',
                'description': 'Restrict private vehicles based on number plate (odd/even) on alternate days',
                'target_sources': ['vehicular'],
                'expected_reduction': {'pm25': 15, 'pm10': 12, 'no2': 20},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 5000000, 'max': 15000000},  # 50L - 1.5Cr
                'resources_required': ['Traffic Police', 'CCTV Monitoring', 'Public Transport Enhancement'],
                'stakeholders': ['Delhi Traffic Police', 'Transport Department', 'Citizens'],
                'success_factors': ['public_compliance', 'enforcement_strength', 'alternative_transport'],
                'historical_effectiveness': 0.65,
                'suitable_conditions': {
                    'aqi_range': [150, 400],
                    'dominant_source': 'vehicular',
                    'season': ['winter', 'post_monsoon']
                }
            },
            
            'congestion_pricing': {
                'category': 'transportation',
                'title': 'Dynamic Congestion Pricing',
                'description': 'Implement variable pricing for entering high-pollution zones during peak hours',
                'target_sources': ['vehicular'],
                'expected_reduction': {'pm25': 25, 'pm10': 20, 'no2': 30},
                'implementation_timeline': 'medium_term',
                'cost_range': {'min': 100000000, 'max': 300000000},  # 10-30 Cr
                'resources_required': ['Electronic Toll Collection', 'Traffic Monitoring System', 'Revenue Collection'],
                'stakeholders': ['Transport Department', 'Municipal Corporation', 'Private Vehicles'],
                'success_factors': ['pricing_strategy', 'alternative_routes', 'public_acceptance'],
                'historical_effectiveness': 0.75,
                'suitable_conditions': {
                    'aqi_range': [100, 300],
                    'dominant_source': 'vehicular',
                    'traffic_density': 'high'
                }
            },

            'public_transport_enhancement': {
                'category': 'transportation',
                'title': 'Emergency Public Transport Boost',
                'description': 'Increase metro/bus frequency and reduce fares during high pollution days',
                'target_sources': ['vehicular'],
                'expected_reduction': {'pm25': 10, 'pm10': 8, 'no2': 15},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 20000000, 'max': 50000000},  # 2-5 Cr
                'resources_required': ['Additional Buses', 'Metro Frequency Increase', 'Subsidized Fares'],
                'stakeholders': ['DMRC', 'DTC', 'Commuters'],
                'success_factors': ['capacity_availability', 'route_coverage', 'service_quality'],
                'historical_effectiveness': 0.55,
                'suitable_conditions': {
                    'aqi_range': [120, 250],
                    'dominant_source': 'vehicular'
                }
            },

            # Industrial Policies
            'industrial_shutdown': {
                'category': 'industrial',
                'title': 'Temporary Industrial Unit Closure',
                'description': 'Shut down non-essential industrial units during severe pollution episodes',
                'target_sources': ['industrial', 'power_plant'],
                'expected_reduction': {'pm25': 30, 'pm10': 25, 'so2': 40, 'no2': 20},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 500000000, 'max': 2000000000},  # 50-200 Cr (economic loss)
                'resources_required': ['Industrial Monitoring', 'Compliance Officers', 'Legal Framework'],
                'stakeholders': ['Industrial Association', 'Pollution Board', 'Workers'],
                'success_factors': ['legal_backing', 'compensation_mechanism', 'essential_vs_non_essential'],
                'historical_effectiveness': 0.80,
                'suitable_conditions': {
                    'aqi_range': [250, 500],
                    'dominant_source': 'industrial',
                    'urgency': 'critical'
                }
            },

            'emission_standards_enforcement': {
                'category': 'industrial',
                'title': 'Strict Emission Standards Enforcement',
                'description': 'Enhanced monitoring and penalties for industries exceeding emission limits',
                'target_sources': ['industrial'],
                'expected_reduction': {'pm25': 20, 'pm10': 18, 'so2': 35, 'no2': 15},
                'implementation_timeline': 'short_term',
                'cost_range': {'min': 50000000, 'max': 150000000},  # 5-15 Cr
                'resources_required': ['Emission Monitoring Systems', 'Inspection Teams', 'Laboratory Testing'],
                'stakeholders': ['Pollution Control Board', 'Industries', 'Environmental Labs'],
                'success_factors': ['monitoring_capability', 'penalty_structure', 'industry_cooperation'],
                'historical_effectiveness': 0.70,
                'suitable_conditions': {
                    'aqi_range': [100, 300],
                    'dominant_source': 'industrial'
                }
            },

            # Agricultural Policies
            'stubble_burning_ban': {
                'category': 'agricultural',
                'title': 'Stubble Burning Prohibition with Alternatives',
                'description': 'Ban stubble burning with subsidized alternatives and mechanization support',
                'target_sources': ['stubble_burning'],
                'expected_reduction': {'pm25': 40, 'pm10': 35, 'co': 25},
                'implementation_timeline': 'long_term',
                'cost_range': {'min': 1000000000, 'max': 5000000000},  # 100-500 Cr
                'resources_required': ['Happy Seeder Machines', 'Subsidies', 'Farmer Training', 'Satellite Monitoring'],
                'stakeholders': ['Farmers', 'Agricultural Department', 'Central Government'],
                'success_factors': ['subsidy_amount', 'alternative_availability', 'farmer_education'],
                'historical_effectiveness': 0.85,
                'suitable_conditions': {
                    'season': ['post_monsoon'],
                    'dominant_source': 'stubble_burning',
                    'aqi_range': [200, 400]
                }
            },

            'crop_residue_management': {
                'category': 'agricultural',
                'title': 'Integrated Crop Residue Management',
                'description': 'Convert crop residue to biofuel, compost, and industrial raw material',
                'target_sources': ['stubble_burning'],
                'expected_reduction': {'pm25': 50, 'pm10': 45, 'co': 30},
                'implementation_timeline': 'long_term',
                'cost_range': {'min': 2000000000, 'max': 8000000000},  # 200-800 Cr
                'resources_required': ['Processing Plants', 'Collection Network', 'Technology Transfer'],
                'stakeholders': ['Farmers', 'Private Industry', 'Research Institutes'],
                'success_factors': ['economic_viability', 'logistics_network', 'technology_adoption'],
                'historical_effectiveness': 0.90,
                'suitable_conditions': {
                    'season': ['all_year'],
                    'dominant_source': 'stubble_burning'
                }
            },

            # Construction Policies
            'construction_dust_control': {
                'category': 'construction',
                'title': 'Mandatory Construction Dust Control Measures',
                'description': 'Enforce water sprinkling, covering, and dust barriers at construction sites',
                'target_sources': ['construction'],
                'expected_reduction': {'pm25': 15, 'pm10': 25},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 10000000, 'max': 50000000},  # 1-5 Cr
                'resources_required': ['Inspection Teams', 'Water Tankers', 'Dust Suppressants'],
                'stakeholders': ['Construction Companies', 'Municipal Corporation', 'Building Department'],
                'success_factors': ['site_monitoring', 'penalty_enforcement', 'contractor_compliance'],
                'historical_effectiveness': 0.60,
                'suitable_conditions': {
                    'aqi_range': [80, 200],
                    'dominant_source': 'construction',
                    'season': ['summer', 'winter']
                }
            },

            # Emergency Actions
            'artificial_rain': {
                'category': 'emergency_action',
                'title': 'Cloud Seeding for Artificial Rain',
                'description': 'Induce artificial rainfall to wash out pollutants from atmosphere',
                'target_sources': ['all'],
                'expected_reduction': {'pm25': 60, 'pm10': 70, 'all_pollutants': 50},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 20000000, 'max': 100000000},  # 2-10 Cr
                'resources_required': ['Aircraft', 'Silver Iodide', 'Meteorological Support'],
                'stakeholders': ['IMD', 'Air Force', 'Environment Ministry'],
                'success_factors': ['weather_conditions', 'cloud_availability', 'wind_patterns'],
                'historical_effectiveness': 0.75,
                'suitable_conditions': {
                    'aqi_range': [300, 500],
                    'cloud_cover': 'available',
                    'urgency': 'critical'
                }
            },

            'work_from_home': {
                'category': 'emergency_action',
                'title': 'Mandatory Work From Home',
                'description': 'Enforce work from home for non-essential services during severe pollution',
                'target_sources': ['vehicular'],
                'expected_reduction': {'pm25': 20, 'pm10': 15, 'no2': 25},
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 1000000, 'max': 10000000},  # 10L - 1Cr
                'resources_required': ['Government Directive', 'IT Infrastructure', 'Monitoring'],
                'stakeholders': ['Private Companies', 'Government Offices', 'Employees'],
                'success_factors': ['digital_infrastructure', 'job_nature', 'employer_compliance'],
                'historical_effectiveness': 0.65,
                'suitable_conditions': {
                    'aqi_range': [200, 400],
                    'dominant_source': 'vehicular'
                }
            },

            'school_closure': {
                'category': 'emergency_action',
                'title': 'School and Educational Institution Closure',
                'description': 'Temporarily close schools to protect children from severe air pollution',
                'target_sources': ['all'],
                'expected_reduction': {'exposure_reduction': 90},  # Health protection measure
                'implementation_timeline': 'immediate',
                'cost_range': {'min': 500000, 'max': 5000000},  # 5L - 50L
                'resources_required': ['Government Order', 'Online Learning Infrastructure'],
                'stakeholders': ['Education Department', 'Schools', 'Parents', 'Students'],
                'success_factors': ['alternative_learning', 'parent_support', 'infrastructure'],
                'historical_effectiveness': 0.95,  # High for health protection
                'suitable_conditions': {
                    'aqi_range': [300, 500],
                    'urgency': 'critical',
                    'vulnerable_population': 'high'
                }
            }
        }

    def create_policy_training_data(self, n_samples=10000):
        """Generate training data for policy effectiveness prediction"""
        np.random.seed(42)
        
        data = []
        
        for i in range(n_samples):
            # Environmental conditions
            current_aqi = np.random.uniform(50, 450)
            pm25_level = current_aqi * 0.6 + np.random.normal(0, 10)
            pm10_level = current_aqi * 0.8 + np.random.normal(0, 15)
            no2_level = current_aqi * 0.4 + np.random.normal(0, 8)
            
            # Dominant pollution sources (one-hot encoded)
            source_types = ['vehicular', 'industrial', 'stubble', 'construction']
            dominant_source = np.random.choice(source_types)
            
            dominant_source_vehicular = 1 if dominant_source == 'vehicular' else 0
            dominant_source_industrial = 1 if dominant_source == 'industrial' else 0
            dominant_source_stubble = 1 if dominant_source == 'stubble' else 0
            dominant_source_construction = 1 if dominant_source == 'construction' else 0
            
            # Weather conditions
            month = np.random.randint(1, 13)
            temperature = 25 + 15 * np.sin(2 * np.pi * (month - 1) / 12) + np.random.normal(0, 5)
            humidity = 60 + 20 * np.sin(2 * np.pi * (month - 1) / 12) + np.random.normal(0, 10)
            wind_speed = np.random.gamma(2, 2)
            season = self.get_season(month)
            
            # Temporal factors
            is_weekend = np.random.choice([0, 1], p=[5/7, 2/7])
            is_winter = 1 if month in [11, 12, 1, 2] else 0
            is_festival_season = 1 if month in [10, 11] else 0
            
            # Contextual factors
            population_affected = np.random.uniform(1000000, 30000000)  # 10L to 3Cr people
            sensitive_locations_nearby = np.random.poisson(5)  # hospitals, schools
            previous_policy_success_rate = np.random.beta(6, 4)  # Skewed towards success
            budget_available = np.random.lognormal(mean=17, sigma=1)  # Log-normal distribution
            enforcement_capacity = np.random.beta(4, 3)  # Government capacity
            public_awareness_level = np.random.beta(5, 3)
            
            # Select policy and calculate effectiveness
            policy_name = self.select_suitable_policy(current_aqi, dominant_source, is_winter, season)
            policy = self.policy_templates[policy_name]
            
            # Calculate policy effectiveness based on conditions
            effectiveness = self.calculate_policy_effectiveness(
                policy, current_aqi, dominant_source, wind_speed, 
                enforcement_capacity, public_awareness_level, budget_available
            )
            
            # Calculate urgency level
            urgency = self.determine_urgency_level(
                current_aqi, pm25_level, sensitive_locations_nearby, is_winter
            )
            
            # Calculate implementation cost
            implementation_cost = self.calculate_implementation_cost(
                policy, population_affected, enforcement_capacity, season
            )
            
            # Calculate predicted impact (AQI reduction)
            predicted_impact = effectiveness * self.get_policy_max_impact(policy, dominant_source)
            
            data_point = {
                'current_aqi': current_aqi,
                'pm25_level': pm25_level,
                'pm10_level': pm10_level,
                'no2_level': no2_level,
                'dominant_source_vehicular': dominant_source_vehicular,
                'dominant_source_industrial': dominant_source_industrial,
                'dominant_source_stubble': dominant_source_stubble,
                'dominant_source_construction': dominant_source_construction,
                'temperature': temperature,
                'humidity': humidity,
                'wind_speed': wind_speed,
                'season': season,
                'is_weekend': is_weekend,
                'is_winter': is_winter,
                'is_festival_season': is_festival_season,
                'population_affected': population_affected,
                'sensitive_locations_nearby': sensitive_locations_nearby,
                'previous_policy_success_rate': previous_policy_success_rate,
                'budget_available': budget_available,
                'enforcement_capacity': enforcement_capacity,
                'public_awareness_level': public_awareness_level,
                'policy_name': policy_name,
                'policy_category': policy['category'],
                'effectiveness_score': effectiveness,
                'urgency_level': urgency,
                'implementation_cost': implementation_cost,
                'predicted_impact': predicted_impact
            }
            
            data.append(data_point)
        
        return pd.DataFrame(data)

    def select_suitable_policy(self, aqi, dominant_source, is_winter, season):
        """Select appropriate policy based on conditions"""
        suitable_policies = []
        
        for policy_name, policy in self.policy_templates.items():
            # Check AQI suitability
            aqi_range = policy.get('suitable_conditions', {}).get('aqi_range', [0, 500])
            if aqi_range[0] <= aqi <= aqi_range[1]:
                # Check source suitability
                if dominant_source in policy.get('target_sources', []) or 'all' in policy.get('target_sources', []):
                    suitable_policies.append(policy_name)
        
        # If no specific suitable policy, select based on urgency
        if not suitable_policies:
            if aqi > 300:
                suitable_policies = ['artificial_rain', 'school_closure', 'industrial_shutdown']
            elif aqi > 200:
                suitable_policies = ['odd_even_scheme', 'work_from_home']
            else:
                suitable_policies = ['construction_dust_control', 'public_transport_enhancement']
        
        return np.random.choice(suitable_policies)

    def calculate_policy_effectiveness(self, policy, aqi, dominant_source, wind_speed, 
                                     enforcement_capacity, public_awareness, budget):
        """Calculate policy effectiveness based on multiple factors"""
        base_effectiveness = policy['historical_effectiveness']
        
        # Adjust based on conditions
        effectiveness = base_effectiveness
        
        # Weather impact
        if wind_speed < 2:  # Low wind - policies more effective
            effectiveness *= 1.2
        elif wind_speed > 6:  # High wind - some policies less effective
            effectiveness *= 0.9
        
        # Enforcement capacity impact
        effectiveness *= (0.5 + 0.5 * enforcement_capacity)
        
        # Public awareness impact
        if policy['category'] in ['transportation', 'emergency_action']:
            effectiveness *= (0.7 + 0.3 * public_awareness)
        
        # Budget constraints
        required_budget = policy['cost_range']['min']
        if budget < required_budget:
            effectiveness *= (budget / required_budget) * 0.8
        
        # AQI level impact - some policies more effective at higher AQI
        if policy['category'] == 'emergency_action' and aqi > 250:
            effectiveness *= 1.1
        elif policy['category'] == 'transportation' and aqi < 150:
            effectiveness *= 0.8
        
        return np.clip(effectiveness, 0.1, 1.0)

    def determine_urgency_level(self, aqi, pm25, sensitive_locations, is_winter):
        """Determine urgency level of intervention needed"""
        urgency_score = 0
        
        # AQI contribution
        if aqi > 400:
            urgency_score += 4
        elif aqi > 300:
            urgency_score += 3
        elif aqi > 200:
            urgency_score += 2
        elif aqi > 100:
            urgency_score += 1
        
        # PM2.5 contribution
        if pm25 > 250:
            urgency_score += 2
        elif pm25 > 150:
            urgency_score += 1
        
        # Sensitive locations
        urgency_score += min(2, sensitive_locations / 3)
        
        # Winter season (worse health impacts)
        if is_winter:
            urgency_score += 1
        
        # Convert to categories
        if urgency_score >= 6:
            return 'critical'
        elif urgency_score >= 4:
            return 'high'
        elif urgency_score >= 2:
            return 'medium'
        else:
            return 'low'

    def calculate_implementation_cost(self, policy, population_affected, enforcement_capacity, season):
        """Calculate implementation cost based on policy and conditions"""
        base_cost = policy['cost_range']['min']
        max_cost = policy['cost_range']['max']
        
        # Population scaling
        population_factor = np.log10(population_affected / 1000000) / 2  # Log scaling
        
        # Enforcement capacity impact
        enforcement_factor = 2 - enforcement_capacity  # Lower capacity = higher cost
        
        # Seasonal factors
        seasonal_factor = 1.0
        if season == 0 and policy['category'] == 'agricultural':  # Winter + agricultural
            seasonal_factor = 1.5
        
        # Calculate final cost
        cost_factor = (population_factor + enforcement_factor + seasonal_factor) / 3
        final_cost = base_cost + (max_cost - base_cost) * cost_factor
        
        return np.clip(final_cost, base_cost, max_cost * 2)

    def get_policy_max_impact(self, policy, dominant_source):
        """Get maximum possible impact of policy"""
        expected_reduction = policy.get('expected_reduction', {})
        
        if dominant_source == 'vehicular':
            return expected_reduction.get('no2', expected_reduction.get('pm25', 20))
        elif dominant_source == 'industrial':
            return expected_reduction.get('so2', expected_reduction.get('pm10', 25))
        elif dominant_source == 'stubble':
            return expected_reduction.get('pm25', 40)
        else:
            return expected_reduction.get('pm10', 20)

    def get_season(self, month):
        """Convert month to season number"""
        if month in [12, 1, 2]:
            return 0  # Winter
        elif month in [3, 4, 5]:
            return 1  # Spring
        elif month in [6, 7, 8, 9]:
            return 2  # Monsoon
        else:
            return 3  # Post-monsoon

    async def train_models_async(self):
        """Train all policy recommendation models asynchronously"""
        return await asyncio.to_thread(self.train_models)

    def train_models(self):
        """Train all policy recommendation models"""
        print("Training policy recommendation models...")
        
        # Generate training data
        df = self.create_policy_training_data(10000)
        print(f"Generated {len(df)} policy scenarios for training")
        
        # Prepare features
        X = df[self.feature_columns]
        X = X.fillna(X.mean())  # Handle any missing values
        
        # Scale features
        X_scaled = self.scalers['features'].fit_transform(X)
        
        # Prepare targets
        y_effectiveness = df['effectiveness_score']
        y_urgency = self.label_encoders['urgency_level'].fit_transform(df['urgency_level'])
        y_cost = df['implementation_cost']
        y_impact = df['predicted_impact']
        
        # Split data
        from sklearn.model_selection import train_test_split
        
        X_train, X_test, y_eff_train, y_eff_test, y_urg_train, y_urg_test, y_cost_train, y_cost_test, y_imp_train, y_imp_test = train_test_split(
            X_scaled, y_effectiveness, y_urgency, y_cost, y_impact,
            test_size=0.2, random_state=42
        )
        
        # Train effectiveness predictor
        print("Training policy effectiveness predictor...")
        self.models['effectiveness_predictor'] = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.models['effectiveness_predictor'].fit(X_train, y_eff_train)
        
        # Train urgency classifier
        print("Training urgency level classifier...")
        self.models['urgency_classifier'] = GradientBoostingClassifier(
            n_estimators=100, max_depth=6, random_state=42
        )
        self.models['urgency_classifier'].fit(X_train, y_urg_train)
        
        # Train cost estimator
        print("Training cost estimator...")
        y_cost_scaled = self.scalers['cost'].fit_transform(y_cost.values.reshape(-1, 1)).ravel()
        y_cost_train_scaled = self.scalers['cost'].transform(y_cost_train.values.reshape(-1, 1)).ravel()
        y_cost_test_scaled = self.scalers['cost'].transform(y_cost_test.values.reshape(-1, 1)).ravel()
        
        self.models['cost_estimator'] = RandomForestRegressor(
            n_estimators=100, max_depth=12, random_state=42, n_jobs=-1
        )
        self.models['cost_estimator'].fit(X_train, y_cost_train_scaled)
        
        # Train impact forecaster
        print("Training impact forecaster...")
        self.models['impact_forecaster'] = RandomForestRegressor(
            n_estimators=150, max_depth=10, random_state=42, n_jobs=-1
        )
        self.models['impact_forecaster'].fit(X_train, y_imp_train)
        
        # Evaluate models
        self.evaluate_models(X_test, y_eff_test, y_urg_test, y_cost_test_scaled, y_imp_test)
        
        self.is_trained = True
        self.save_models()
        print("Policy recommendation model training completed!")

    def evaluate_models(self, X_test, y_eff_test, y_urg_test, y_cost_test, y_imp_test):
        """Evaluate all policy recommendation models"""
        print("\nPolicy Model Performance Evaluation:")
        print("=" * 60)
        
        # Effectiveness predictor
        eff_pred = self.models['effectiveness_predictor'].predict(X_test)
        eff_r2 = r2_score(y_eff_test, eff_pred)
        eff_mae = np.mean(np.abs(y_eff_test - eff_pred))
        print(f"Effectiveness Predictor R²: {eff_r2:.3f} | MAE: {eff_mae:.3f}")
        
        # Urgency classifier
        urg_pred = self.models['urgency_classifier'].predict(X_test)
        urg_acc = accuracy_score(y_urg_test, urg_pred)
        print(f"Urgency Classifier Accuracy: {urg_acc:.3f}")
        
        # Cost estimator
        cost_pred = self.models['cost_estimator'].predict(X_test)
        cost_r2 = r2_score(y_cost_test, cost_pred)
        print(f"Cost Estimator R²: {cost_r2:.3f}")
        
        # Impact forecaster
        imp_pred = self.models['impact_forecaster'].predict(X_test)
        imp_r2 = r2_score(y_imp_test, imp_pred)
        imp_mae = np.mean(np.abs(y_imp_test - imp_pred))
        print(f"Impact Forecaster R²: {imp_r2:.3f} | MAE: {imp_mae:.2f}")
        
        # Store performance metrics
        self.performance_metrics = {
            'effectiveness_r2': eff_r2,
            'effectiveness_mae': eff_mae,
            'urgency_accuracy': urg_acc,
            'cost_r2': cost_r2,
            'impact_r2': imp_r2,
            'impact_mae': imp_mae,
            'last_evaluated': datetime.now()
        }

    async def generate_recommendations_async(self, current_aqi, location, pollution_sources, urgency_level='normal'):
        """Generate policy recommendations asynchronously"""
        return await asyncio.to_thread(
            self.generate_recommendations, current_aqi, location, pollution_sources, urgency_level
        )

    def generate_recommendations(self, current_aqi, location, pollution_sources, urgency_level='normal'):
        """Generate comprehensive policy recommendations"""
        if not self.is_trained:
            self.load_models()
        
        start_time = datetime.now()
        
        # Analyze pollution sources to determine dominant type
        dominant_source = self.analyze_dominant_source(pollution_sources)
        
        # Create feature vector for current situation
        features = self.create_situation_features(
            current_aqi, location, pollution_sources, urgency_level
        )
        
        # Get suitable policies for current conditions
        suitable_policies = self.filter_suitable_policies(current_aqi, dominant_source, urgency_level)
        
        recommendations = []
        
        for policy_name in suitable_policies[:8]:  # Top 8 recommendations
            policy = self.policy_templates[policy_name]
            
            # Predict policy effectiveness
            features_scaled = self.scalers['features'].transform([features])
            predicted_effectiveness = self.models['effectiveness_predictor'].predict(features_scaled)[0]
            predicted_urgency_prob = self.models['urgency_classifier'].predict_proba(features_scaled)[0]
            predicted_cost_scaled = self.models['cost_estimator'].predict(features_scaled)[0]
            predicted_impact = self.models['impact_forecaster'].predict(features_scaled)[0]
            
            # Inverse scale cost
            predicted_cost = self.scalers['cost'].inverse_transform([[predicted_cost_scaled]])[0][0]
            
            # Calculate additional metrics
            cost_effectiveness_ratio = predicted_impact / (predicted_cost / 10000000)  # Impact per 1Cr
            implementation_urgency = self.label_encoders['urgency_level'].inverse_transform([np.argmax(predicted_urgency_prob)])[0]
            
            # Generate detailed recommendation
            recommendation = {
                'policy_id': f"policy_{len(recommendations) + 1}",
                'title': policy['title'],
                'category': policy['category'],
                'description': policy['description'],
                'target_sources': policy['target_sources'],
                'priority': self.calculate_priority_score(predicted_effectiveness, predicted_impact, urgency_level),
                'predicted_effectiveness': float(np.clip(predicted_effectiveness, 0, 1)),
                'predicted_impact': {
                    'aqi_reduction': float(max(0, predicted_impact)),
                    'pollutant_reduction': policy['expected_reduction'],
                    'population_benefited': self.estimate_population_benefit(location, predicted_impact)
                },
                'implementation': {
                    'timeline': policy['implementation_timeline'],
                    'estimated_cost': {
                        'amount': float(predicted_cost),
                        'currency': 'INR',
                        'cost_per_aqi_reduction': float(predicted_cost / max(1, predicted_impact))
                    },
                    'resources_required': policy['resources_required'],
                    'stakeholders': policy['stakeholders']
                },
                'feasibility': {
                    'technical_feasibility': self.assess_technical_feasibility(policy, features),
                    'political_feasibility': self.assess_political_feasibility(policy, current_aqi),
                    'economic_feasibility': self.assess_economic_feasibility(policy, predicted_cost),
                    'social_acceptance': self.assess_social_acceptance(policy, urgency_level)
                },
                'success_factors': policy['success_factors'],
                'risk_mitigation': self.generate_risk_mitigation_strategies(policy, current_aqi),
                'monitoring_indicators': self.generate_monitoring_indicators(policy),
                'urgency_assessment': implementation_urgency,
                'cost_effectiveness_score': float(cost_effectiveness_ratio),
                'confidence_score': float(np.clip(predicted_effectiveness * 0.8 + np.max(predicted_urgency_prob) * 0.2, 0, 1))
            }
            
            recommendations.append(recommendation)
        
        # Sort recommendations by priority
        recommendations.sort(key=lambda x: x['priority'], reverse=True)
        
        # Generate summary insights
        summary = self.generate_recommendation_summary(recommendations, current_aqi, dominant_source)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return {
            'recommendations': recommendations,
            'summary': summary,
            'analysis': {
                'current_situation': {
                    'aqi_level': current_aqi,
                    'severity': self.get_severity_level(current_aqi),
                    'dominant_source': dominant_source,
                    'urgency_level': urgency_level
                },
                'recommendation_count': len(recommendations),
                'high_priority_count': len([r for r in recommendations if r['priority'] > 0.8]),
                'total_estimated_cost': sum([r['implementation']['estimated_cost']['amount'] for r in recommendations]),
                'potential_aqi_reduction': sum([r['predicted_impact']['aqi_reduction'] for r in recommendations[:3]])  # Top 3
            },
            'metadata': {
                'generated_at': datetime.now(),
                'processing_time_seconds': processing_time,
                'model_version': self.version,
                'location': location
            }
        }

    def analyze_dominant_source(self, pollution_sources):
        """Analyze pollution sources to determine the dominant type"""
        if not pollution_sources:
            return 'vehicular'  # Default
        
        source_weights = {}
        for source in pollution_sources:
            source_type = source.get('source_type', 'unknown')
            intensity = source.get('intensity_score', 0)
            confidence = source.get('confidence', 0.5)
            
            weighted_score = intensity * confidence
            source_weights[source_type] = source_weights.get(source_type, 0) + weighted_score
        
        return max(source_weights, key=source_weights.get) if source_weights else 'vehicular'

    def create_situation_features(self, current_aqi, location, pollution_sources, urgency_level):
        """Create feature vector for current situation"""
        # Current conditions
        features = [
            current_aqi,
            current_aqi * 0.6,  # Estimated PM2.5
            current_aqi * 0.8,  # Estimated PM10
            current_aqi * 0.4   # Estimated NO2
        ]
        
        # Dominant source encoding
        dominant_source = self.analyze_dominant_source(pollution_sources)
        features.extend([
            1 if dominant_source == 'vehicular' else 0,
            1 if dominant_source == 'industrial' else 0,
            1 if dominant_source == 'stubble_burning' else 0,
            1 if dominant_source == 'construction' else 0
        ])
        
        # Weather and temporal features (current)
        now = datetime.now()
        current_month = now.month
        current_season = self.get_season(current_month)
        
        base_temp = 25 + 15 * np.sin(2 * np.pi * (current_month - 1) / 12)
        
        features.extend([
            base_temp,  # temperature
            60,  # humidity (default)
            3.5,  # wind_speed (default)
            current_season,
            1 if now.weekday() >= 5 else 0,  # is_weekend
            1 if current_month in [11, 12, 1, 2] else 0,  # is_winter
            1 if current_month in [10, 11] else 0  # is_festival_season
        ])
        
        # Contextual features
        population_affected = self.estimate_affected_population(location, current_aqi)
        features.extend([
            population_affected,
            5,  # sensitive_locations_nearby (estimate)
            0.7,  # previous_policy_success_rate (estimate)
            500000000,  # budget_available (estimate - 50Cr)
            0.6,  # enforcement_capacity (estimate)
            0.7   # public_awareness_level (estimate)
        ])
        
        return features

    def filter_suitable_policies(self, current_aqi, dominant_source, urgency_level):
        """Filter policies suitable for current conditions"""
        suitable = []
        
        for policy_name, policy in self.policy_templates.items():
            # Check AQI suitability
            suitable_conditions = policy.get('suitable_conditions', {})
            aqi_range = suitable_conditions.get('aqi_range', [0, 500])
            
            if aqi_range[0] <= current_aqi <= aqi_range[1]:
                # Check source targeting
                target_sources = policy.get('target_sources', [])
                if dominant_source in target_sources or 'all' in target_sources:
                    # Check urgency compatibility
                    if urgency_level == 'critical' and policy['category'] == 'emergency_action':
                        suitable.insert(0, policy_name)  # High priority
                    elif urgency_level in ['high', 'medium'] and policy['implementation_timeline'] in ['immediate', 'short_term']:
                        suitable.append(policy_name)
                    elif urgency_level == 'low':
                        suitable.append(policy_name)
        
        # If no suitable policies found, add emergency measures for high AQI
        if not suitable and current_aqi > 200:
            suitable = ['artificial_rain', 'industrial_shutdown', 'work_from_home', 'school_closure']
        elif not suitable:
            suitable = ['construction_dust_control', 'emission_standards_enforcement']
        
        return suitable

    def calculate_priority_score(self, effectiveness, impact, urgency_level):
        """Calculate priority score for recommendation ranking"""
        urgency_weights = {'low': 0.3, 'medium': 0.6, 'high': 0.8, 'critical': 1.0}
        urgency_weight = urgency_weights.get(urgency_level, 0.5)
        
        priority = (effectiveness * 0.4 + impact/100 * 0.4 + urgency_weight * 0.2)
        return np.clip(priority, 0, 1)

    def estimate_population_benefit(self, location, predicted_impact):
        """Estimate population that would benefit from policy"""
        # Delhi NCR population estimates by area
        base_population = 30000000  # 3 Cr
        
        # Scale based on predicted impact
        impact_factor = min(1.0, predicted_impact / 50)  # Max benefit at 50 AQI reduction
        
        return int(base_population * impact_factor)

    def assess_technical_feasibility(self, policy, features):
        """Assess technical feasibility of policy implementation"""
        category = policy['category']
        
        if category == 'emergency_action':
            return 0.9  # Usually technically feasible
        elif category == 'transportation':
            enforcement_capacity = features[17] if len(features) > 17 else 0.6
            return 0.7 + enforcement_capacity * 0.2
        elif category == 'industrial':
            return 0.6  # More complex implementation
        elif category == 'agricultural':
            return 0.5  # Most complex, requires coordination
        else:
            return 0.7

    def assess_political_feasibility(self, policy, current_aqi):
        """Assess political feasibility based on policy type and severity"""
        category = policy['category']
        
        # Higher AQI increases political pressure for action
        aqi_factor = min(1.0, current_aqi / 300)
        
        if category == 'emergency_action':
            return 0.6 + aqi_factor * 0.3
        elif category == 'transportation':
            return 0.4 + aqi_factor * 0.4  # Often unpopular but necessary
        elif category == 'industrial':
            return 0.5 + aqi_factor * 0.3  # Industry resistance
        else:
            return 0.7

    def assess_economic_feasibility(self, policy, predicted_cost):
        """Assess economic feasibility based on cost"""
        # Assuming government budget constraints
        if predicted_cost < 50000000:  # < 5Cr
            return 0.9
        elif predicted_cost < 200000000:  # < 20Cr
            return 0.7
        elif predicted_cost < 1000000000:  # < 100Cr
            return 0.5
        else:
            return 0.3

    def assess_social_acceptance(self, policy, urgency_level):
        """Assess likely social acceptance of policy"""
        category = policy['category']
        urgency_weights = {'low': 0.5, 'medium': 0.7, 'high': 0.8, 'critical': 0.9}
        urgency_factor = urgency_weights.get(urgency_level, 0.6)
        
        base_acceptance = {
            'emergency_action': 0.6,
            'transportation': 0.4,  # Often unpopular
            'industrial': 0.7,
            'construction': 0.8,
            'agricultural': 0.5
        }.get(category, 0.6)
        
        return min(1.0, base_acceptance + (urgency_factor - 0.5) * 0.3)

    def generate_risk_mitigation_strategies(self, policy, current_aqi):
        """Generate risk mitigation strategies for policy implementation"""
        category = policy['category']
        strategies = []
        
        if category == 'transportation':
            strategies.extend([
                'Ensure adequate public transport capacity before implementation',
                'Implement gradual phase-in to test effectiveness',
                'Set up real-time monitoring of traffic and air quality',
                'Prepare exemption mechanisms for emergencies'
            ])
        elif category == 'industrial':
            strategies.extend([
                'Provide advance notice to industries for compliance preparation',
                'Establish clear compensation mechanisms for economic losses',
                'Set up rapid response team for essential services',
                'Monitor economic impact and adjust policies accordingly'
            ])
        elif category == 'emergency_action':
            strategies.extend([
                'Coordinate with multiple agencies for synchronized implementation',
                'Prepare public communication strategy',
                'Set up monitoring systems for effectiveness tracking',
                'Plan for extended implementation if needed'
            ])
        
        # Common strategies
        strategies.extend([
            'Establish clear success metrics and monitoring protocols',
            'Prepare contingency plans for policy failure',
            'Engage stakeholders proactively for buy-in'
        ])
        
        return strategies

    def generate_monitoring_indicators(self, policy):
        """Generate monitoring indicators for policy effectiveness"""
        category = policy['category']
        indicators = []
        
        # Common indicators
        indicators.extend([
            'Real-time AQI measurements at multiple locations',
            'PM2.5 and PM10 concentration levels',
            'Public health indicators (hospital admissions, respiratory cases)'
        ])
        
        if category == 'transportation':
            indicators.extend([
                'Traffic volume on major roads',
                'Public transport ridership',
                'Vehicular emission levels (NO2, CO)',
                'Fuel consumption statistics'
            ])
        elif category == 'industrial':
            indicators.extend([
                'Industrial emission monitoring data',
                'Number of industries complying with shutdown orders',
                'SO2 and particulate matter from industrial sources',
                'Economic impact on industrial output'
            ])
        elif category == 'agricultural':
            indicators.extend([
                'Satellite data on fire incidents',
                'Crop residue burning reports',
                'Alternative disposal method adoption rates',
                'Farmer compliance and satisfaction surveys'
            ])
        
        return indicators

    def generate_recommendation_summary(self, recommendations, current_aqi, dominant_source):
        """Generate executive summary of recommendations"""
        if not recommendations:
            return {"message": "No suitable recommendations available for current conditions"}
        
        top_3 = recommendations[:3]
        total_cost = sum([r['implementation']['estimated_cost']['amount'] for r in top_3])
        total_impact = sum([r['predicted_impact']['aqi_reduction'] for r in top_3])
        
        summary = {
            'executive_summary': f"Based on current AQI of {current_aqi:.0f} with dominant {dominant_source} pollution, "
                               f"implementing the top 3 recommended policies could reduce AQI by {total_impact:.0f} points "
                               f"at an estimated cost of ₹{total_cost/10000000:.1f} crores.",
            'immediate_actions': [r['title'] for r in recommendations if r['implementation']['timeline'] == 'immediate'][:3],
            'high_impact_policies': [r['title'] for r in sorted(recommendations, 
                                   key=lambda x: x['predicted_impact']['aqi_reduction'], reverse=True)][:3],
            'cost_effective_options': [r['title'] for r in sorted(recommendations, 
                                     key=lambda x: x['cost_effectiveness_score'], reverse=True)][:3],
            'implementation_timeline': {
                'immediate': len([r for r in recommendations if r['implementation']['timeline'] == 'immediate']),
                'short_term': len([r for r in recommendations if r['implementation']['timeline'] == 'short_term']),
                'medium_term': len([r for r in recommendations if r['implementation']['timeline'] == 'medium_term']),
                'long_term': len([r for r in recommendations if r['implementation']['timeline'] == 'long_term'])
            },
            'key_insights': self.generate_key_insights(recommendations, current_aqi, dominant_source)
        }
        
        return summary

    def generate_key_insights(self, recommendations, current_aqi, dominant_source):
        """Generate key insights from analysis"""
        insights = []
        
        if current_aqi > 300:
            insights.append("Critical pollution levels detected. Emergency measures recommended immediately.")
        
        if dominant_source == 'stubble_burning':
            insights.append("Stubble burning is the primary concern. Long-term agricultural policies needed alongside immediate relief measures.")
        elif dominant_source == 'vehicular':
            insights.append("Vehicle emissions are dominant. Transportation policies will be most effective.")
        elif dominant_source == 'industrial':
            insights.append("Industrial emissions are primary concern. Enforcement-based policies recommended.")
        
        high_cost_policies = [r for r in recommendations if r['implementation']['estimated_cost']['amount'] > 1000000000]
        if high_cost_policies:
            insights.append(f"{len(high_cost_policies)} policies require substantial budget (>₹100 crores). Consider phased implementation.")
        
        immediate_policies = [r for r in recommendations if r['implementation']['timeline'] == 'immediate']
        if len(immediate_policies) >= 3:
            insights.append(f"{len(immediate_policies)} policies can be implemented immediately for quick relief.")
        
        return insights

    def estimate_affected_population(self, location, current_aqi):
        """Estimate population affected based on location and AQI"""
        # Simplified population estimation for Delhi NCR
        base_population = 30000000  # 3 Crore
        
        # Adjust based on AQI severity (higher AQI affects more people due to spread)
        aqi_factor = min(1.0, current_aqi / 200)  # Scale from 0 to 1
        
        return int(base_population * (0.5 + 0.5 * aqi_factor))

    def get_severity_level(self, aqi):
        """Get severity level based on AQI"""
        if aqi <= 50:
            return 'good'
        elif aqi <= 100:
            return 'moderate'
        elif aqi <= 150:
            return 'unhealthy_sensitive'
        elif aqi <= 200:
            return 'unhealthy'
        elif aqi <= 300:
            return 'very_unhealthy'
        else:
            return 'hazardous'

    def save_models(self):
        """Save all trained models and components"""
        import os
        os.makedirs('saved_models', exist_ok=True)
        
        # Save ML models
        for model_name, model in self.models.items():
            if model is not None:
                joblib.dump(model, f'saved_models/policy_{model_name}.pkl')
        
        # Save scalers and encoders
        joblib.dump(self.scalers, 'saved_models/policy_scalers.pkl')
        joblib.dump(self.label_encoders, 'saved_models/policy_label_encoders.pkl')
        
        # Save policy templates and metadata
        joblib.dump(self.policy_templates, 'saved_models/policy_templates.pkl')
        
        metadata = {
            'version': self.version,
            'feature_columns': self.feature_columns,
            'policy_categories': self.policy_categories,
            'performance_metrics': getattr(self, 'performance_metrics', {}),
            'trained_at': datetime.now()
        }
        joblib.dump(metadata, 'saved_models/policy_metadata.pkl')
        
        print("Policy recommendation models saved successfully!")

    def load_models(self):
        """Load pre-trained models"""
        try:
            # Load ML models
            for model_name in self.models.keys():
                try:
                    self.models[model_name] = joblib.load(f'saved_models/policy_{model_name}.pkl')
                except FileNotFoundError:
                    print(f"Warning: {model_name} not found")
            
            # Load scalers and encoders
            self.scalers = joblib.load('saved_models/policy_scalers.pkl')
            self.label_encoders = joblib.load('saved_models/policy_label_encoders.pkl')
            
            # Load policy templates and metadata
            self.policy_templates = joblib.load('saved_models/policy_templates.pkl')
            
            metadata = joblib.load('saved_models/policy_metadata.pkl')
            self.version = metadata['version']
            self.feature_columns = metadata['feature_columns']
            self.policy_categories = metadata['policy_categories']
            self.performance_metrics = metadata.get('performance_metrics', {})
            
            self.is_trained = True
            print("Policy recommendation models loaded successfully!")
            
        except FileNotFoundError:
            print("No saved policy models found. Training new models...")
            self.train_models()

    def is_loaded(self):
        """Check if models are loaded"""
        return self.is_trained and all(model is not None for model in self.models.values())

    def get_performance_metrics(self):
        """Get model performance metrics"""
        return getattr(self, 'performance_metrics', {})

# Initialize and train if run directly
if __name__ == "__main__":
    engine = PolicyRecommendationEngine()
    asyncio.run(engine.train_models_async())