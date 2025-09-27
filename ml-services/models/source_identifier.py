 import numpy as np
 import pandas as pd
 from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
 from sklearn.preprocessing import StandardScaler, LabelEncoder
 from sklearn.model_selection import train_test_split, cross_val_score
 from sklearn.metrics import classification_report, accuracy_score, r2_score
 import xgboost as xgb
 import lightgbm as lgb
 import joblib
 import asyncio
 from datetime import datetime, timedelta
 from typing import List, Tuple, Dict, Any, Optional
 import warnings
 warnings.filterwarnings('ignore')
 class AdvancedSourceIdentifier:
    def __init__(self):
        self.models = {
            'source_classifier': None,
            'intensity_regressor': None,
            'confidence_estimator': None
        }
        self.scalers = {
            'features': StandardScaler(),
            'satellite': StandardScaler()
        }
        self.label_encoder = LabelEncoder()
 Advanced Source Identification Model
        self.feature_importance = {}
        self.is_trained = False
        self.version = "2.0.0"
        
        # Enhanced feature engineering parameters
        self.feature_columns = [
            'hour', 'day_of_week', 'month', 'season',
            'latitude', 'longitude', 'elevation',
            'aod_550nm', 'aod_470nm', 'angstrom_exponent',
            'fire_radiative_power', 'fire_confidence', 'fire_count_5km',
            'temperature', 'humidity', 'wind_speed', 'wind_direction',
            'boundary_layer_height', 'pressure', 'precipitation',
            'population_density', 'road_density', 'industrial_density',
            'distance_to_highway', 'distance_to_industrial', 'distance_to_airport',
            'pm25_background', 'pm10_background', 'no2_background',
            'seasonal_pattern', 'weekend_factor', 'rush_hour_factor'
        ]
        
        # Source type mapping
        self.source_types = [
            'vehicular', 'industrial', 'stubble_burning', 'construction',
            'domestic', 'power_plant', 'waste_burning', 'dust_storm',
            'airport', 'biomass_burning', 'fireworks'
        ]
    def create_enhanced_training_data(self, n_samples=50000):
        """Generate sophisticated synthetic training data based on real Delhi-NCR pattern
        np.random.seed(42)
        
        print(f"Generating {n_samples} training samples...")
        data = []
        
        for i in range(n_samples):
            # Temporal features
            timestamp = datetime(2022, 1, 1) + timedelta(
                hours=np.random.randint(0, 24*365*2)  # 2 years of data
            )
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            month = timestamp.month
            season = self.get_season(month)
            
            # Spatial features (Delhi-NCR region)
            latitude = np.random.uniform(28.4, 28.8)
            longitude = np.random.uniform(76.8, 77.4)
            elevation = np.random.uniform(200, 250)  # Delhi elevation
            
            # Satellite features
            aod_550nm = np.random.lognormal(mean=-0.5, sigma=0.8)  # Aerosol Optical Dept
            aod_470nm = aod_550nm * (1 + np.random.normal(0, 0.1))
            angstrom_exponent = np.random.uniform(0.5, 2.0)  # Particle size indicator
            
            # Fire detection features
            fire_radiative_power = np.random.exponential(10)
            fire_confidence = np.random.uniform(0, 100)
            fire_count_5km = np.random.poisson(2)
            
            # Meteorological features
            temperature = 25 + 15 * np.sin(2 * np.pi * (month - 1) / 12) + np.random.norm
            humidity = 60 + 20 * np.sin(2 * np.pi * (month - 1) / 12) + np.random.normal(
            humidity = np.clip(humidity, 10, 95)
            
            wind_speed = np.random.gamma(2, 2)
            wind_direction = np.random.uniform(0, 360)
            boundary_layer_height = np.random.uniform(200, 2000)
            pressure = np.random.normal(1013, 10)
            precipitation = np.random.exponential(2) if month in [6, 7, 8, 9] else np.ran
            
            # Geographic context features
            population_density = self.calculate_population_density(latitude, longitude)
            road_density = self.calculate_road_density(latitude, longitude)
            industrial_density = self.calculate_industrial_density(latitude, longitude)
            
            distance_to_highway = np.random.exponential(3)
            distance_to_industrial = np.random.exponential(5)
            distance_to_airport = self.calculate_airport_distance(latitude, longitude)
            
            # Background pollution levels
            pm25_background = np.random.lognormal(3.5, 0.5)
            pm10_background = pm25_background * np.random.uniform(1.5, 2.5)
            no2_background = np.random.lognormal(3.0, 0.4)
            
            # Pattern features
            seasonal_pattern = self.get_seasonal_pollution_factor(month)
            weekend_factor = 0.8 if day_of_week >= 5 else 1.0
            rush_hour_factor = 1.3 if hour in [7, 8, 9, 17, 18, 19, 20] else 1.0
            
            # Create feature vector
            features = {
                'hour': hour, 'day_of_week': day_of_week, 'month': month, 'season': seaso
                'latitude': latitude, 'longitude': longitude, 'elevation': elevation,
                'aod_550nm': aod_550nm, 'aod_470nm': aod_470nm, 'angstrom_exponent': angs
                'fire_radiative_power': fire_radiative_power, 'fire_confidence': fire_con
                'fire_count_5km': fire_count_5km, 'temperature': temperature, 'humidity':
                'wind_speed': wind_speed, 'wind_direction': wind_direction,
                'boundary_layer_height': boundary_layer_height, 'pressure': pressure,
                'precipitation': precipitation, 'population_density': population_density,
                'road_density': road_density, 'industrial_density': industrial_density,
                'distance_to_highway': distance_to_highway, 'distance_to_industrial': dis
                'distance_to_airport': distance_to_airport, 'pm25_background': pm25_backg
                'pm10_background': pm10_background, 'no2_background': no2_background,
                'seasonal_pattern': seasonal_pattern, 'weekend_factor': weekend_factor,
                'rush_hour_factor': rush_hour_factor
            }
            
            # Generate labels based on sophisticated rules
            source_type, intensity, confidence = self.generate_labels(features)
            
            features.update({
                'source_type': source_type,
                'intensity': intensity,
                'confidence': confidence
            })
            
            data.append(features)
        
        return pd.DataFrame(data)
    def generate_labels(self, features):
        """Generate realistic labels based on feature combinations"""
        # Initialize probabilities for each source type
        source_probs = {source: 0.01 for source in self.source_types}
        
        # Stubble burning logic
        if features['month'] in [10, 11, 12] and features['fire_radiative_power'] > 15:
            source_probs['stubble_burning'] = 0.6 + features['fire_confidence'] / 200
            if features['aod_550nm'] > 1.0:
                source_probs['stubble_burning'] += 0.2
        
        # Vehicular emissions logic
        if features['distance_to_highway'] < 2:
            base_vehicular = 0.4
            if features['hour'] in [7, 8, 9, 17, 18, 19, 20]:  # Rush hours
                base_vehicular += 0.3
            if features['day_of_week'] < 5:  # Weekdays
                base_vehicular += 0.2
            source_probs['vehicular'] = min(0.9, base_vehicular)
        
        # Industrial emissions logic
        if features['distance_to_industrial'] < 3 and features['industrial_density'] > 0.
            source_probs['industrial'] = 0.5 + features['industrial_density'] * 0.3
            if features['hour'] in range(6, 22):  # Operating hours
                source_probs['industrial'] += 0.2
        
        # Construction logic
        if features['hour'] in range(6, 20) and features['day_of_week'] < 6:
            if np.random.random() < 0.1:  # Random construction activity
                source_probs['construction'] = 0.4 + np.random.random() * 0.3
        
        # Dust storm logic
        if features['wind_speed'] > 8 and features['humidity'] < 30:
            if features['month'] in [4, 5, 6]:  # Pre-monsoon
                source_probs['dust_storm'] = 0.3 + (features['wind_speed'] - 8) * 0.05
        
        # Power plant logic
        if features['distance_to_industrial'] < 5 and features['so2_background'] > np.exp
            source_probs['power_plant'] = 0.3 + features['industrial_density'] * 0.2
        
        # Domestic heating (winter months)
        if features['month'] in [11, 12, 1, 2] and features['hour'] in [6, 7, 18, 19, 20]
            source_probs['domestic'] = 0.2 + (1 / (features['temperature'] + 10)) * 0.3
        
        # Airport emissions
        airport_prob = max(0, 0.5 - features['distance_to_airport'] / 10)
        if airport_prob > 0.1:
            source_probs['airport'] = airport_prob
        
        # Waste burning
        if features['hour'] in [5, 6, 18, 19] and np.random.random() < 0.05:
            source_probs['waste_burning'] = 0.3 + np.random.random() * 0.2
        
        # Fireworks (festival seasons)
        if features['month'] in [10, 11] and np.random.random() < 0.02:
            source_probs['fireworks'] = 0.6 + np.random.random() * 0.3
        
        # Select source type based on probabilities
        source_type = max(source_probs, key=source_probs.get)
        max_prob = source_probs[source_type]
        
        # If no strong signal, default to background
        if max_prob < 0.15:
            source_type = 'vehicular'  # Most common source
            max_prob = 0.15
        
        # Calculate intensity (0-500 scale like AQI)
        base_intensity = max_prob * 300
        
        # Add feature-based intensity modifiers
        if source_type == 'stubble_burning':
            intensity = base_intensity + features['fire_radiative_power'] * 2
        elif source_type == 'vehicular':
            intensity = base_intensity + (1 / (features['distance_to_highway'] + 0.1)) * 
        elif source_type == 'industrial':
            intensity = base_intensity + features['industrial_density'] * 100
        else:
            intensity = base_intensity
        
        # Add meteorological effects
        if features['wind_speed'] < 2:  # Low wind dispersal
            intensity *= 1.3
        elif features['wind_speed'] > 6:  # High wind dispersal
            intensity *= 0.7
        
        if features['boundary_layer_height'] < 500:  # Low mixing height
            intensity *= 1.4
        
        # Add seasonal effects
        intensity *= features['seasonal_pattern']
        
        # Ensure realistic bounds
        intensity = np.clip(intensity, 10, 500)
        
        # Calculate confidence based on signal strength and data quality
        confidence = max_prob * 0.8
        if features['fire_confidence'] > 80 and source_type in ['stubble_burning', 'waste
            confidence += 0.15
        if features['aod_550nm'] > 1.0:
            confidence += 0.1
        
        confidence = np.clip(confidence, 0.1, 0.95)
        
        return source_type, intensity, confidence
    def get_season(self, month):
        """Convert month to season"""
        if month in [12, 1, 2]:
            return 0  # Winter
        elif month in [3, 4, 5]:
            return 1  # Spring
        elif month in [6, 7, 8, 9]:
            return 2  # Monsoon
        else:
            return 3  # Post-monsoon
    def get_seasonal_pollution_factor(self, month):
        """Get seasonal pollution multiplication factor"""
        # Higher pollution in winter months
        factors = {
            1: 1.4, 2: 1.3, 3: 1.1, 4: 1.0, 5: 0.9, 6: 0.7,
            7: 0.6, 8: 0.6, 9: 0.8, 10: 1.2, 11: 1.4, 12: 1.5
        }
        return factors.get(month, 1.0)
    def calculate_population_density(self, lat, lng):
        """Calculate population density based on location"""
        # Delhi city center has highest density
        center_distance = np.sqrt((lat - 28.6139)**2 + (lng - 77.2090)**2)
        return max(0.1, 1.0 - center_distance * 2)
    def calculate_road_density(self, lat, lng):
        """Calculate road network density"""
        # Higher near major highways
        return 0.5 + np.random.random() * 0.5
    def calculate_industrial_density(self, lat, lng):
        """Calculate industrial area density"""
        # Industrial clusters in specific areas
        if 28.5 <= lat <= 28.7 and 77.0 <= lng <= 77.3:
            return 0.3 + np.random.random() * 0.6
        return np.random.random() * 0.3
    def calculate_airport_distance(self, lat, lng):
        """Calculate distance to nearest airport"""
        # IGI Airport coordinates
        igi_lat, igi_lng = 28.5665, 77.1031
        return np.sqrt((lat - igi_lat)**2 + (lng - igi_lng)**2) * 111  # Convert to km
    async def train_models_async(self):
        """Train all models asynchronously"""
        return await asyncio.to_thread(self.train_models)
    def train_models(self):
        """Train the source identification models"""
        print("Training advanced source identification models...")
        
        # Generate training data
        df = self.create_enhanced_training_data(50000)
        print(f"Generated {len(df)} training samples")
        
        # Prepare features and targets
        X = df[self.feature_columns]
        y_source = df['source_type']
        y_intensity = df['intensity']
        y_confidence = df['confidence']
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Scale features
        X_scaled = self.scalers['features'].fit_transform(X)
        
        # Encode source types
        y_source_encoded = self.label_encoder.fit_transform(y_source)
        
        # Split data
        X_train, X_test, y_source_train, y_source_test, y_intensity_train, y_intensity_te
            X_scaled, y_source_encoded, y_intensity, y_confidence, 
            test_size=0.2, random_state=42, stratify=y_source_encoded
        )
        
        # Train source classifier (XGBoost for better performance)
        print("Training source classifier...")
        self.models['source_classifier'] = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='mlogloss'
        )
        
        self.models['source_classifier'].fit(
            X_train, y_source_train,
            eval_set=[(X_test, y_source_test)],
            verbose=False
        )
        
        # Train intensity regressor (LightGBM)
        print("Training intensity regressor...")
        self.models['intensity_regressor'] = lgb.LGBMRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbose=-1
        )
        
        self.models['intensity_regressor'].fit(
            X_train, y_intensity_train,
            eval_set=[(X_test, y_intensity_test)],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
        )
        
        # Train confidence estimator
        print("Training confidence estimator...")
        self.models['confidence_estimator'] = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.models['confidence_estimator'].fit(X_train, y_conf_train)
        
        # Evaluate models
        self.evaluate_models(X_test, y_source_test, y_intensity_test, y_conf_test)
        
        # Calculate feature importance
        self.calculate_feature_importance()
        
        self.is_trained = True
        self.save_models()
        
        print("Model training completed successfully!")
    def evaluate_models(self, X_test, y_source_test, y_intensity_test, y_conf_test):
        """Evaluate model performance"""
        print("\nModel Performance Evaluation:")
        print("=" * 50)
        
        # Source classifier evaluation
        source_pred = self.models['source_classifier'].predict(X_test)
        source_accuracy = accuracy_score(y_source_test, source_pred)
        print(f"Source Classification Accuracy: {source_accuracy:.3f}")
        
        # Intensity regressor evaluation
        intensity_pred = self.models['intensity_regressor'].predict(X_test)
        intensity_r2 = r2_score(y_intensity_test, intensity_pred)
        intensity_mae = np.mean(np.abs(y_intensity_test - intensity_pred))
        print(f"Intensity Prediction R²: {intensity_r2:.3f}")
        print(f"Intensity Prediction MAE: {intensity_mae:.2f}")
        
        # Confidence estimator evaluation
        conf_pred = self.models['confidence_estimator'].predict(X_test)
        conf_r2 = r2_score(y_conf_test, conf_pred)
        print(f"Confidence Estimation R²: {conf_r2:.3f}")
        
        # Store performance metrics
        self.performance_metrics = {
            'source_accuracy': source_accuracy,
            'intensity_r2': intensity_r2,
            'intensity_mae': intensity_mae,
            'confidence_r2': conf_r2,
            'last_evaluated': datetime.now()
        }
    def calculate_feature_importance(self):
        """Calculate and store feature importance"""
        # Source classifier feature importance
        source_importance = self.models['source_classifier'].feature_importances_
        
        # Intensity regressor feature importance
        intensity_importance = self.models['intensity_regressor'].feature_importances_
        
        # Create feature importance dictionary
        self.feature_importance = {
            'source_classification': dict(zip(self.feature_columns, source_importance)),
            'intensity_estimation': dict(zip(self.feature_columns, intensity_importance))
        }
        
        # Print top 10 most important features
        print("\nTop 10 Features for Source Classification:")
        source_sorted = sorted(self.feature_importance['source_classification'].items(), 
                             key=lambda x: x[1], reverse=True)
        for i, (feature, importance) in enumerate(source_sorted[:10]):
            print(f"{i+1:2d}. {feature:<25} {importance:.4f}")
    async def identify_sources_async(self, locations, satellite_data=None, ground_data=No
        """Identify pollution sources asynchronously"""
        return await asyncio.to_thread(
            self.identify_sources, locations, satellite_data, ground_data, time_range
        )
    def identify_sources(self, locations, satellite_data=None, ground_data=None, time_ran
        """Identify pollution sources for given locations"""
        if not self.is_trained:
            self.load_models()
        
        start_time = datetime.now()
        results = []
        
        for lat, lng in locations:
            try:
                # Create feature vector for this location
                features = self.create_feature_vector(lat, lng, satellite_data, ground_da
                
                # Scale features
                features_scaled = self.scalers['features'].transform([features])
                
                # Predict source type
                source_prob = self.models['source_classifier'].predict_proba(features_sca
                source_class = self.models['source_classifier'].predict(features_scaled)[
                source_type = self.label_encoder.inverse_transform([source_class])[0]
                
                # Predict intensity and confidence
                intensity = max(0, self.models['intensity_regressor'].predict(features_sc
                confidence = np.clip(self.models['confidence_estimator'].predict(features
                
                # Get top 3 source probabilities
                top_sources = []
                for i, prob in enumerate(source_prob):
                    source_name = self.label_encoder.inverse_transform([i])[0]
                    top_sources.append({'source': source_name, 'probability': float(prob)
                
                top_sources = sorted(top_sources, key=lambda x: x['probability'], reverse
                
                result = {
                    'location': {'latitude': lat, 'longitude': lng},
                    'primary_source': {
                        'type': source_type,
                        'intensity': float(intensity),
                        'confidence': float(confidence)
                    },
                    'alternative_sources': top_sources,
                    'timestamp': datetime.now(),
                    'model_version': self.version
                }
                
                results.append(result)
                
            except Exception as e:
                print(f"Error processing location ({lat}, {lng}): {e}")
                continue
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Add processing metadata
        for result in results:
            result['processing_time'] = processing_time / len(locations)
        
        return results
    def create_feature_vector(self, lat, lng, satellite_data=None, ground_data=None, time
        """Create feature vector for a specific location and time"""
        now = datetime.now()
        
        # Base temporal features
        features = {
            'hour': now.hour,
            'day_of_week': now.weekday(),
            'month': now.month,
            'season': self.get_season(now.month),
            'latitude': lat,
            'longitude': lng,
            'elevation': 220,  # Default Delhi elevation
        }
        
        # Satellite features (use provided data or defaults)
        if satellite_data:
            features.update({
                'aod_550nm': satellite_data.get('aod_550nm', 0.5),
                'aod_470nm': satellite_data.get('aod_470nm', 0.6),
                'angstrom_exponent': satellite_data.get('angstrom_exponent', 1.2),
                'fire_radiative_power': satellite_data.get('fire_radiative_power', 0),
                'fire_confidence': satellite_data.get('fire_confidence', 0),
                'fire_count_5km': satellite_data.get('fire_count_5km', 0)
            })
        else:
            # Use simulated values based on season and location
            season_factor = self.get_seasonal_pollution_factor(now.month)
            features.update({
                'aod_550nm': 0.4 * season_factor + np.random.normal(0, 0.1),
                'aod_470nm': 0.5 * season_factor + np.random.normal(0, 0.1),
                'angstrom_exponent': 1.2 + np.random.normal(0, 0.2),
                'fire_radiative_power': np.random.exponential(5) if season_factor > 1.2 e
                'fire_confidence': np.random.uniform(60, 95) if features.get('fire_radiat
                'fire_count_5km': np.random.poisson(1) if season_factor > 1.2 else 0
            })
        
        # Meteorological features (use provided data or typical values)
        if ground_data:
            features.update({
                'temperature': ground_data.get('temperature', 25),
                'humidity': ground_data.get('humidity', 60),
                'wind_speed': ground_data.get('wind_speed', 3),
                'wind_direction': ground_data.get('wind_direction', 180),
                'boundary_layer_height': ground_data.get('boundary_layer_height', 800),
                'pressure': ground_data.get('pressure', 1013),
                'precipitation': ground_data.get('precipitation', 0)
            })
        else:
            # Use seasonal defaults
            base_temp = 25 + 15 * np.sin(2 * np.pi * (now.month - 1) / 12)
            features.update({
                'temperature': base_temp + np.random.normal(0, 3),
                'humidity': 60 + 20 * np.sin(2 * np.pi * (now.month - 1) / 12) + np.rando
                'wind_speed': np.random.gamma(2, 1.5),
                'wind_direction': np.random.uniform(0, 360),
                'boundary_layer_height': 500 + np.random.uniform(0, 1000),
                'pressure': 1013 + np.random.normal(0, 5),
                'precipitation': 0 if now.month not in [6, 7, 8, 9] else np.random.expone
            })
        
        # Geographic context features
        features.update({
            'population_density': self.calculate_population_density(lat, lng),
            'road_density': self.calculate_road_density(lat, lng),
            'industrial_density': self.calculate_industrial_density(lat, lng),
            'distance_to_highway': np.random.exponential(3),
            'distance_to_industrial': np.random.exponential(5),
            'distance_to_airport': self.calculate_airport_distance(lat, lng),
            'pm25_background': 50 + np.random.normal(0, 15),
            'pm10_background': 80 + np.random.normal(0, 20),
            'no2_background': 40 + np.random.normal(0, 10),
            'seasonal_pattern': self.get_seasonal_pollution_factor(now.month),
            'weekend_factor': 0.8 if now.weekday() >= 5 else 1.0,
            'rush_hour_factor': 1.3 if now.hour in [7, 8, 9, 17, 18, 19, 20] else 1.0
        })
        
        return [features[col] for col in self.feature_columns]
    def save_models(self):
        """Save trained models and scalers"""
        import os
        os.makedirs('saved_models', exist_ok=True)
        
        # Save models
        joblib.dump(self.models['source_classifier'], 'saved_models/source_classifier.pkl
        joblib.dump(self.models['intensity_regressor'], 'saved_models/intensity_regressor
        joblib.dump(self.models['confidence_estimator'], 'saved_models/confidence_estimat
        
        # Save scalers and encoders
        joblib.dump(self.scalers, 'saved_models/scalers.pkl')
        joblib.dump(self.label_encoder, 'saved_models/label_encoder.pkl')
        
        # Save metadata
        metadata = {
            'version': self.version,
            'feature_columns': self.feature_columns,
            'source_types': self.source_types,
            'performance_metrics': getattr(self, 'performance_metrics', {}),
            'feature_importance': getattr(self, 'feature_importance', {}),
            'trained_at': datetime.now()
        }
        joblib.dump(metadata, 'saved_models/metadata.pkl')
        
        print("Models saved successfully!")
    def load_models(self):
        """Load pre-trained models"""
        try:
            self.models['source_classifier'] = joblib.load('saved_models/source_classifie
            self.models['intensity_regressor'] = joblib.load('saved_models/intensity_regr
            self.models['confidence_estimator'] = joblib.load('saved_models/confidence_es
            
            self.scalers = joblib.load('saved_models/scalers.pkl')
            self.label_encoder = joblib.load('saved_models/label_encoder.pkl')
            
            metadata = joblib.load('saved_models/metadata.pkl')
            self.version = metadata['version']
            self.feature_columns = metadata['feature_columns']
            self.source_types = metadata['source_types']
            self.performance_metrics = metadata.get('performance_metrics', {})
            self.feature_importance = metadata.get('feature_importance', {})
            
            self.is_trained = True
            print("Models loaded successfully!")
            
        except FileNotFoundError:
            print("No saved models found. Training new models...")
            self.train_models()
    def is_loaded(self):
        """Check if models are loaded"""
        return self.is_trained and all(model is not None for model in self.models.values(
    def get_version(self):
        """Get model version"""
        return self.version
    def get_performance_metrics(self):
        """Get model performance metrics"""
        return getattr(self, 'performance_metrics', {})
# Initialize and train if run directly
 if __name__ == "__main__":
 identifier = AdvancedSourceIdentifier()
 identifier.train_models()
