 import numpy as np
 import pandas as pd
 import tensorflow as tf
 from tensorflow.keras.models import Sequential, Model
 from tensorflow.keras.layers import LSTM, GRU, Dense, Dropout, Attention, MultiHeadAttent
 from tensorflow.keras.layers import Input, Concatenate, BatchNormalization, LayerNormaliz
 from tensorflow.keras.optimizers import Adam
 from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
 from sklearn.preprocessing import MinMaxScaler, StandardScaler
 from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
 import joblib
 import asyncio
 from datetime import datetime, timedelta
 import warnings
 warnings.filterwarnings('ignore')
 class AdvancedAQIForecaster:
 def __init__(self, sequence_length=168):  # 1 week of hourly data
 self.sequence_length = sequence_length
 self.models = {
 'lstm_model': None,
 'transformer_model': None,
 'ensemble_model': None
 }
 self.scalers = {
 'aqi': MinMaxScaler(),
 'weather': StandardScaler(),
 'pollutants': MinMaxScaler()
 }
 self.feature_columns = {
            'aqi_features': ['aqi', 'aqi_category_encoded'],
            'pollutant_features': ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'],
            'weather_features': ['temperature', 'humidity', 'wind_speed', 'wind_direction
                               'pressure', 'precipitation', 'boundary_layer_height'],
            'temporal_features': ['hour', 'day_of_week', 'month', 'season', 'is_weekend',
            'contextual_features': ['traffic_index', 'industrial_activity', 'construction
        }
        
        self.forecast_horizons = [1, 6, 12, 24, 48, 72]  # hours
        self.is_trained = False
        self.version = "2.0.0"
        
    def generate_comprehensive_training_data(self, n_days=730):
        """Generate 2 years of realistic hourly AQI time series data"""
        print(f"Generating {n_days} days of training data...")
        
        # Start date
        start_date = datetime(2022, 1, 1)
        date_range = pd.date_range(start=start_date, periods=n_days*24, freq='H')
        
        # Initialize data container
        data = []
        
        # Seasonal and daily patterns
        for i, timestamp in enumerate(date_range):
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            month = timestamp.month
            season = self.get_season(month)
            
            # Base AQI with multiple components
            seasonal_component = self.get_seasonal_aqi_pattern(month)
            daily_component = self.get_daily_aqi_pattern(hour)
            weekly_component = self.get_weekly_aqi_pattern(day_of_week)
            
            # Weather-driven component
            temperature = 25 + 15 * np.sin(2 * np.pi * (timestamp.dayofyear - 80) / 365.2
            humidity = 60 + 20 * np.sin(2 * np.pi * (timestamp.dayofyear - 80) / 365.25) 
            humidity = np.clip(humidity, 10, 95)
            
            wind_speed = np.random.gamma(2, 2)
            wind_direction = np.random.uniform(0, 360)
            pressure = 1013 + np.sin(2 * np.pi * timestamp.dayofyear / 365.25) * 5 + np.r
            
            # Precipitation (monsoon effect)
            if month in [6, 7, 8, 9]:
                precipitation = np.random.exponential(3) if np.random.random() < 0.3 else
            else:
                precipitation = np.random.exponential(0.5) if np.random.random() < 0.1 el
            
            boundary_layer_height = 500 + 500 * np.sin(2 * np.pi * hour / 24) + np.random
            boundary_layer_height = np.clip(boundary_layer_height, 200, 2000)
            
            # Weather impact on AQI
            weather_impact = 1.0
            if wind_speed < 2:  # Low wind dispersion
                weather_impact *= 1.4
            elif wind_speed > 6:  # High wind dispersion
                weather_impact *= 0.7
            
            if precipitation > 5:  # Rain washing effect
                weather_impact *= 0.4
            elif humidity > 85:  # High humidity effect
                weather_impact *= 1.1
            
            if boundary_layer_height < 400:  # Low mixing height
                weather_impact *= 1.3
            
            # Special events and anomalies
            special_events = self.generate_special_events(timestamp, month, day_of_week)
            
            # Calculate base AQI
            base_aqi = (seasonal_component + daily_component + weekly_component) * weathe
            base_aqi += special_events
            
            # Add noise and persistence
            if i > 0:
                persistence_factor = 0.7  # Previous hour influence
                noise_factor = 0.3
                base_aqi = persistence_factor * data[-1]['aqi'] + noise_factor * base_aqi
            
            base_aqi += np.random.normal(0, 10)  # Random noise
            base_aqi = np.clip(base_aqi, 10, 500)
            
            # Calculate individual pollutants based on AQI
            pollutants = self.calculate_pollutants_from_aqi(base_aqi, season, hour, preci
            
            # Contextual features
            traffic_index = self.get_traffic_index(hour, day_of_week)
            industrial_activity = self.get_industrial_activity(hour, day_of_week, month)
            construction_activity = self.get_construction_activity(hour, day_of_week, mon
            
            # Create data point
            data_point = {
                'timestamp': timestamp,
                'aqi': base_aqi,
                'aqi_category_encoded': self.encode_aqi_category(base_aqi),
                'pm25': pollutants['pm25'],
                'pm10': pollutants['pm10'],
                'co': pollutants['co'],
                'no2': pollutants['no2'],
                'so2': pollutants['so2'],
                'o3': pollutants['o3'],
                'temperature': temperature,
                'humidity': humidity,
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'pressure': pressure,
                'precipitation': precipitation,
                'boundary_layer_height': boundary_layer_height,
                'hour': hour,
                'day_of_week': day_of_week,
                'month': month,
                'season': season,
                'is_weekend': 1 if day_of_week >= 5 else 0,
                'is_holiday': self.is_holiday(timestamp),
                'traffic_index': traffic_index,
                'industrial_activity': industrial_activity,
                'construction_activity': construction_activity
            }
            
            data.append(data_point)
        
        return pd.DataFrame(data)
    
    def get_seasonal_aqi_pattern(self, month):
        """Get seasonal AQI base level"""
        # Winter months have higher pollution
        seasonal_factors = {
            1: 180, 2: 170, 3: 140, 4: 120, 5: 110, 6: 80,
            7: 70, 8: 75, 9: 90, 10: 130, 11: 160, 12: 190
        }
        return seasonal_factors.get(month, 120)
    
    def get_daily_aqi_pattern(self, hour):
        """Get daily AQI variation pattern"""
        # Rush hour peaks
        if hour in [7, 8, 9]:  # Morning rush
            return 40
        elif hour in [18, 19, 20, 21]:  # Evening rush
            return 50
        elif hour in [22, 23, 0, 1, 2, 3, 4, 5]:  # Night time
            return -20
        else:
            return 0
    
    def get_weekly_aqi_pattern(self, day_of_week):
        """Get weekly AQI variation pattern"""
        # Weekends typically have lower pollution
        if day_of_week >= 5:  # Weekend
            return -25
        else:
            return 0
    
    def generate_special_events(self, timestamp, month, day_of_week):
        """Generate special pollution events"""
        special_boost = 0
        
        # Diwali period (October/November)
        if month in [10, 11] and np.random.random() < 0.05:
            special_boost += np.random.uniform(100, 200)  # Firecracker pollution
        
        # Stubble burning period (October-December)
        if month in [10, 11, 12] and np.random.random() < 0.15:
            special_boost += np.random.uniform(50, 150)
        
        # Construction dust events
        if 6 <= timestamp.hour <= 18 and day_of_week < 5 and np.random.random() < 0.08:
            special_boost += np.random.uniform(20, 80)
        
        # Dust storm events (pre-monsoon)
        if month in [4, 5, 6] and np.random.random() < 0.03:
            special_boost += np.random.uniform(80, 200)
        
        return special_boost
    
    def calculate_pollutants_from_aqi(self, aqi, season, hour, precipitation):
        """Calculate individual pollutant concentrations based on AQI"""
        # Base relationships with some variability
        pm25 = aqi * 0.6 + np.random.normal(0, aqi * 0.1)
        pm10 = pm25 * np.random.uniform(1.5, 2.5)
        
        # NO2 higher during rush hours
        no2_base = aqi * 0.4
        if hour in [7, 8, 9, 18, 19, 20]:
            no2_base *= 1.3
        no2 = no2_base + np.random.normal(0, no2_base * 0.15)
        
        # CO correlates with traffic
        co = aqi * 0.08 + np.random.normal(0, aqi * 0.02)
        
        # SO2 from industrial sources
        so2 = aqi * 0.15 + np.random.normal(0, aqi * 0.05)
        
        # O3 has different pattern (photochemical)
        if 10 <= hour <= 16:  # Daytime photochemical formation
            o3 = aqi * 0.3 + np.random.normal(0, aqi * 0.1)
        else:
            o3 = aqi * 0.1 + np.random.normal(0, aqi * 0.05)
        
        # Rain reduces pollutants
        if precipitation > 1:
            reduction_factor = min(0.5, precipitation / 20)
            pm25 *= (1 - reduction_factor)
            pm10 *= (1 - reduction_factor)
            no2 *= (1 - reduction_factor * 0.3)
            so2 *= (1 - reduction_factor * 0.4)
        
        return {
            'pm25': max(0, pm25),
            'pm10': max(0, pm10),
            'co': max(0, co),
            'no2': max(0, no2),
            'so2': max(0, so2),
            'o3': max(0, o3)
        }
    
    def encode_aqi_category(self, aqi):
        """Encode AQI category as numerical value"""
        if aqi <= 50:
            return 0  # Good
        elif aqi <= 100:
            return 1  # Moderate
        elif aqi <= 150:
            return 2  # Unhealthy for Sensitive
        elif aqi <= 200:
            return 3  # Unhealthy
        elif aqi <= 300:
            return 4  # Very Unhealthy
        else:
            return 5  # Hazardous
    
    def get_traffic_index(self, hour, day_of_week):
        """Get traffic intensity index"""
        base_traffic = 0.3
        
        if day_of_week < 5:  # Weekdays
            if hour in [7, 8, 9]:  # Morning rush
                base_traffic = 0.9
            elif hour in [17, 18, 19, 20]:  # Evening rush
                base_traffic = 1.0
            elif 10 <= hour <= 16:  # Day time
                base_traffic = 0.6
        else:  # Weekends
            if 10 <= hour <= 22:
                base_traffic = 0.5
        
        return base_traffic + np.random.normal(0, 0.1)
    
    def get_industrial_activity(self, hour, day_of_week, month):
        """Get industrial activity level"""
        if day_of_week < 5 and 6 <= hour <= 22:  # Weekday working hours
            return 0.8 + np.random.normal(0, 0.1)
        elif day_of_week < 5:  # Weekday non-working hours
            return 0.4 + np.random.normal(0, 0.1)
        else:  # Weekend
            return 0.2 + np.random.normal(0, 0.05)
    
    def get_construction_activity(self, hour, day_of_week, month):
        """Get construction activity level"""
        if day_of_week < 6 and 6 <= hour <= 18:  # Working hours
            if month in [6, 7, 8, 9]:  # Monsoon - reduced activity
                return 0.3 + np.random.normal(0, 0.1)
            else:
                return 0.7 + np.random.normal(0, 0.1)
        else:
            return 0.1 + np.random.normal(0, 0.05)
    
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
    
    def is_holiday(self, timestamp):
        """Check if date is a holiday (simplified)"""
        # Major Indian holidays (simplified)
        holidays = [
            (1, 26),   # Republic Day
            (8, 15),   # Independence Day
            (10, 2),   # Gandhi Jayanti
        ]
        
        for month, day in holidays:
            if timestamp.month == month and timestamp.day == day:
                return 1
        
        return 0
    
    def prepare_sequences(self, data, forecast_horizon=24):
        """Prepare sequences for training"""
        # Get all feature columns
        all_features = []
        for feature_group in self.feature_columns.values():
            all_features.extend(feature_group)
        
        # Scale different feature groups separately
        aqi_data = data[self.feature_columns['aqi_features']].values
        pollutant_data = data[self.feature_columns['pollutant_features']].values
        weather_data = data[self.feature_columns['weather_features']].values
        temporal_data = data[self.feature_columns['temporal_features']].values
        contextual_data = data[self.feature_columns['contextual_features']].values
        
        # Fit scalers
        aqi_scaled = self.scalers['aqi'].fit_transform(aqi_data)
        pollutant_scaled = self.scalers['pollutants'].fit_transform(pollutant_data)
        weather_scaled = self.scalers['weather'].fit_transform(weather_data)
        
        # Combine all features
        scaled_features = np.concatenate([
            aqi_scaled, pollutant_scaled, weather_scaled, temporal_data, contextual_data
        ], axis=1)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_features) - forecast_horizon):
            X.append(scaled_features[i-self.sequence_length:i])
            y.append(aqi_scaled[i:i+forecast_horizon, 0])  # AQI values for forecast hori
        
        return np.array(X), np.array(y)
    
    def build_lstm_model(self, input_shape, forecast_horizon):
        """Build LSTM-based forecasting model"""
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(32, activation='relu'),
            Dense(forecast_horizon, activation='linear')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def build_transformer_model(self, input_shape, forecast_horizon):
        """Build Transformer-based forecasting model"""
        inputs = Input(shape=input_shape)
        
        # Multi-head attention
        attention_output = MultiHeadAttention(
            num_heads=8, 
            key_dim=64
        )(inputs, inputs)
        
        attention_output = LayerNormalization()(attention_output + inputs)
        
        # Feed forward network
        ffn_output = Dense(128, activation='relu')(attention_output)
        ffn_output = Dropout(0.2)(ffn_output)
        ffn_output = Dense(input_shape[-1])(ffn_output)
        ffn_output = LayerNormalization()(ffn_output + attention_output)
        
        # Global average pooling and output
        pooled = tf.keras.layers.GlobalAveragePooling1D()(ffn_output)
        outputs = Dense(64, activation='relu')(pooled)
        outputs = Dropout(0.2)(outputs)
        outputs = Dense(forecast_horizon, activation='linear')(outputs)
        
        model = Model(inputs=inputs, outputs=outputs)
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def build_ensemble_model(self, input_shape, forecast_horizon):
        """Build ensemble model combining LSTM and Transformer"""
        inputs = Input(shape=input_shape)
        
        # LSTM branch
        lstm_out = LSTM(64, return_sequences=True)(inputs)
        lstm_out = Dropout(0.2)(lstm_out)
        lstm_out = LSTM(32, return_sequences=False)(lstm_out)
        lstm_out = Dense(32, activation='relu')(lstm_out)
        
        # Transformer branch
        transformer_out = MultiHeadAttention(num_heads=4, key_dim=32)(inputs, inputs)
        transformer_out = LayerNormalization()(transformer_out + inputs)
        transformer_out = tf.keras.layers.GlobalAveragePooling1D()(transformer_out)
        transformer_out = Dense(32, activation='relu')(transformer_out)
        
        # Combine branches
        combined = Concatenate()([lstm_out, transformer_out])
        combined = Dense(64, activation='relu')(combined)
        combined = Dropout(0.2)(combined)
        outputs = Dense(forecast_horizon, activation='linear')(combined)
        
        model = Model(inputs=inputs, outputs=outputs)
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    async def train_models_async(self):
        """Train all forecasting models asynchronously"""
        return await asyncio.to_thread(self.train_models)
    
    def train_models(self):
        """Train all forecasting models"""
        print("Training advanced AQI forecasting models...")
        
        # Generate training data
        df = self.generate_comprehensive_training_data(730)  # 2 years
        print(f"Generated {len(df)} hourly data points")
        
        # Train models for different forecast horizons
        self.models = {}
        
        for horizon in [24, 48, 72]:  # 1, 2, 3 day forecasts
            print(f"\nTraining models for {horizon}-hour forecast...")
            
            # Prepare sequences
            X, y = self.prepare_sequences(df, forecast_horizon=horizon)
            print(f"Created {len(X)} training sequences")
            
            # Split data
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Build models
            input_shape = (X.shape[1], X.shape[2])
            
            # LSTM Model
            print(f"Training LSTM model for {horizon}h...")
            lstm_model = self.build_lstm_model(input_shape, horizon)
            
            callbacks = [
                EarlyStopping(patience=10, restore_best_weights=True),
                ReduceLROnPlateau(patience=5, factor=0.5, min_lr=1e-6),
                ModelCheckpoint(f'saved_models/lstm_{horizon}h.h5', save_best_only=True)
            ]
            
            lstm_history = lstm_model.fit(
                X_train, y_train,
                epochs=100,
                batch_size=32,
                validation_data=(X_test, y_test),
                callbacks=callbacks,
                verbose=0
            )
            
            # Transformer Model
            print(f"Training Transformer model for {horizon}h...")
            transformer_model = self.build_transformer_model(input_shape, horizon)
            
            transformer_history = transformer_model.fit(
                X_train, y_train,
                epochs=80,
                batch_size=32,
                validation_data=(X_test, y_test),
                callbacks=[
                    EarlyStopping(patience=8, restore_best_weights=True),
                    ReduceLROnPlateau(patience=4, factor=0.5, min_lr=1e-6)
                ],
                verbose=0
            )
            
            # Ensemble Model
            print(f"Training Ensemble model for {horizon}h...")
            ensemble_model = self.build_ensemble_model(input_shape, horizon)
            
            ensemble_history = ensemble_model.fit(
                X_train, y_train,
                epochs=80,
                batch_size=32,
                validation_data=(X_test, y_test),
                callbacks=[
                    EarlyStopping(patience=8, restore_best_weights=True),
                    ReduceLROnPlateau(patience=4, factor=0.5, min_lr=1e-6)
                ],
                verbose=0
            )
            
            # Store models
            self.models[f'lstm_{horizon}h'] = lstm_model
            self.models[f'transformer_{horizon}h'] = transformer_model
            self.models[f'ensemble_{horizon}h'] = ensemble_model
            
            # Evaluate models
            self.evaluate_forecast_models(
                [lstm_model, transformer_model, ensemble_model],
                ['LSTM', 'Transformer', 'Ensemble'],
                X_test, y_test, horizon
            )
        
        self.is_trained = True
        self.save_models()
        print("\nForecasting model training completed!")
    
    def evaluate_forecast_models(self, models, model_names, X_test, y_test, horizon):
        """Evaluate forecasting model performance"""
        print(f"\nEvaluation Results for {horizon}-hour forecast:")
        print("=" * 60)
        
        for model, name in zip(models, model_names):
            y_pred = model.predict(X_test, verbose=0)
            
            # Calculate metrics for each forecast step
            mae_scores = []
            mse_scores = []
            r2_scores = []
            
            for step in range(horizon):
                mae = mean_absolute_error(y_test[:, step], y_pred[:, step])
                mse = mean_squared_error(y_test[:, step], y_pred[:, step])
                r2 = r2_score(y_test[:, step], y_pred[:, step])
                
                mae_scores.append(mae)
                mse_scores.append(mse)
                r2_scores.append(r2)
            
            print(f"{name:12} | MAE: {np.mean(mae_scores):.2f} | "
                  f"RMSE: {np.sqrt(np.mean(mse_scores)):.2f} | "
                  f"R²: {np.mean(r2_scores):.3f}")
    
    async def forecast_async(self, latitude, longitude, forecast_hours=72, 
                           include_uncertainty=True, model_ensemble=True):
        """Generate AQI forecasts asynchronously"""
        return await asyncio.to_thread(
            self.forecast, latitude, longitude, forecast_hours, 
            include_uncertainty, model_ensemble
        )
    
    def forecast(self, latitude, longitude, forecast_hours=72, 
                include_uncertainty=True, model_ensemble=True):
        """Generate AQI forecasts for specified location"""
        if not self.is_trained:
            self.load_models()
        
        # Get current and historical data for the location
        current_sequence = self.prepare_current_sequence(latitude, longitude)
        
        # Determine which model to use based on forecast horizon
        if forecast_hours <= 24:
            model_key = 'ensemble_24h'
        elif forecast_hours <= 48:
            model_key = 'ensemble_48h'
        else:
            model_key = 'ensemble_72h'
        
        if model_key not in self.models:
            raise ValueError(f"Model for {forecast_hours}-hour forecast not available")
        
        # Generate base forecast
        forecast_scaled = self.models[model_key].predict(
            current_sequence.reshape(1, *current_sequence.shape), verbose=0
        )[0]
        
        # Inverse scale the forecast
        forecast_aqi = self.inverse_scale_aqi(forecast_scaled[:forecast_hours])
        
        # Generate ensemble predictions if requested
        ensemble_predictions = []
        if model_ensemble:
            for model_type in ['lstm', 'transformer', 'ensemble']:
                if f'{model_type}_{self.get_model_horizon(forecast_hours)}h' in self.mode
                    model = self.models[f'{model_type}_{self.get_model_horizon(forecast_h
                    pred = model.predict(current_sequence.reshape(1, *current_sequence.sh
                    pred_aqi = self.inverse_scale_aqi(pred[:forecast_hours])
                    ensemble_predictions.append(pred_aqi)
        
        # Calculate uncertainty bounds
        uncertainty_bounds = None
        if include_uncertainty and ensemble_predictions:
            uncertainty_bounds = self.calculate_uncertainty_bounds(ensemble_predictions)
        
        # Format forecast results
        forecast_results = []
        base_time = datetime.now()
        
        for hour in range(forecast_hours):
            forecast_time = base_time + timedelta(hours=hour + 1)
            
            result = {
                'forecast_hour': hour + 1,
                'forecast_time': forecast_time,
                'predicted_aqi': float(np.clip(forecast_aqi[hour], 0, 500)),
                'aqi_category': self.get_aqi_category(forecast_aqi[hour]),
                'confidence': self.calculate_forecast_confidence(hour, forecast_hours)
            }
            
            if uncertainty_bounds:
                result['uncertainty'] = {
                    'lower_bound': float(uncertainty_bounds['lower'][hour]),
                    'upper_bound': float(uncertainty_bounds['upper'][hour]),
                    'std_dev': float(uncertainty_bounds['std'][hour])
                }
            
            if ensemble_predictions:
                result['ensemble_mean'] = float(np.mean([pred[hour] for pred in ensemble_
                result['ensemble_std'] = float(np.std([pred[hour] for pred in ensemble_pr
            
            forecast_results.append(result)
        
        return {
            'forecasts': forecast_results,
            'model_info': {
                'model_used': model_key,
                'model_version': self.version,
                'ensemble_models': len(ensemble_predictions) if ensemble_predictions else
                'forecast_horizon_hours': forecast_hours
            },
            'overall_confidence': np.mean([f['confidence'] for f in forecast_results]),
            'generated_at': datetime.now()
        }
    
    def prepare_current_sequence(self, latitude, longitude):
        """Prepare current sequence for forecasting"""
        # This would typically fetch real historical data
        # For demo, we generate a realistic current sequence
        
        sequence_data = []
        base_time = datetime.now()
        
        for i in range(self.sequence_length):
            timestamp = base_time - timedelta(hours=self.sequence_length - i)
            
            # Generate realistic current data
            hour = timestamp.hour
            day_of_week = timestamp.weekday()
            month = timestamp.month
            
            # Simulate current AQI and features
            seasonal_aqi = self.get_seasonal_aqi_pattern(month)
            daily_aqi = self.get_daily_aqi_pattern(hour)
            weekly_aqi = self.get_weekly_aqi_pattern(day_of_week)
            
            current_aqi = seasonal_aqi + daily_aqi + weekly_aqi + np.random.normal(0, 15)
            current_aqi = np.clip(current_aqi, 30, 400)
            
            # Create feature vector
            features = {
                'aqi': current_aqi,
                'aqi_category_encoded': self.encode_aqi_category(current_aqi),
                'pm25': current_aqi * 0.6 + np.random.normal(0, 5),
                'pm10': current_aqi * 0.8 + np.random.normal(0, 8),
                'co': current_aqi * 0.08 + np.random.normal(0, 2),
                'no2': current_aqi * 0.4 + np.random.normal(0, 3),
                'so2': current_aqi * 0.15 + np.random.normal(0, 2),
                'o3': current_aqi * 0.2 + np.random.normal(0, 3),
                'temperature': 25 + 15 * np.sin(2 * np.pi * (month - 1) / 12) + np.random
                'humidity': 60 + np.random.normal(0, 10),
                'wind_speed': np.random.gamma(2, 2),
                'wind_direction': np.random.uniform(0, 360),
                'pressure': 1013 + np.random.normal(0, 5),
                'precipitation': 0 if month not in [6, 7, 8, 9] else np.random.exponentia
                'boundary_layer_height': 500 + 300 * np.sin(2 * np.pi * hour / 24) + np.r
                'hour': hour,
                'day_of_week': day_of_week,
                'month': month,
                'season': self.get_season(month),
                'is_weekend': 1 if day_of_week >= 5 else 0,
                'is_holiday': self.is_holiday(timestamp),
                'traffic_index': self.get_traffic_index(hour, day_of_week),
                'industrial_activity': self.get_industrial_activity(hour, day_of_week, mo
                'construction_activity': self.get_construction_activity(hour, day_of_week
            }
            
            sequence_data.append(features)
        
        # Convert to DataFrame and scale
        df = pd.DataFrame(sequence_data)
        
        # Scale features same way as training
        aqi_data = df[self.feature_columns['aqi_features']].values
        pollutant_data = df[self.feature_columns['pollutant_features']].values
        weather_data = df[self.feature_columns['weather_features']].values
        temporal_data = df[self.feature_columns['temporal_features']].values
        contextual_data = df[self.feature_columns['contextual_features']].values
        
        aqi_scaled = self.scalers['aqi'].transform(aqi_data)
        pollutant_scaled = self.scalers['pollutants'].transform(pollutant_data)
        weather_scaled = self.scalers['weather'].transform(weather_data)
        
        # Combine features
        scaled_sequence = np.concatenate([
            aqi_scaled, pollutant_scaled, weather_scaled, temporal_data, contextual_data
        ], axis=1)
        
        return scaled_sequence
    
    def inverse_scale_aqi(self, scaled_aqi):
        """Inverse scale AQI predictions"""
        # Create dummy array for inverse transform
        dummy_features = np.zeros((len(scaled_aqi), len(self.feature_columns['aqi_feature
        dummy_features[:, 0] = scaled_aqi
        
        # Inverse transform
        inverse_transformed = self.scalers['aqi'].inverse_transform(dummy_features)
        return inverse_transformed[:, 0]
    
    def get_model_horizon(self, forecast_hours):
        """Get appropriate model horizon"""
        if forecast_hours <= 24:
            return 24
        elif forecast_hours <= 48:
            return 48
        else:
            return 72
    
    def calculate_uncertainty_bounds(self, ensemble_predictions):
        """Calculate uncertainty bounds from ensemble predictions"""
        ensemble_array = np.array(ensemble_predictions)
        
        return {
            'lower': np.percentile(ensemble_array, 10, axis=0),
            'upper': np.percentile(ensemble_array, 90, axis=0),
            'std': np.std(ensemble_array, axis=0)
        }
    
    def calculate_forecast_confidence(self, hour, total_hours):
        """Calculate confidence score for forecast hour"""
        # Confidence decreases with forecast horizon
        base_confidence = 0.9
        decay_rate = 0.015  # Confidence decays by ~1.5% per hour
        
        confidence = base_confidence * np.exp(-decay_rate * hour)
        return max(0.3, confidence)  # Minimum 30% confidence
    
    def get_aqi_category(self, aqi):
        """Get AQI category from AQI value"""
        if aqi <= 50:
            return 'Good'
        elif aqi <= 100:
            return 'Moderate'
        elif aqi <= 150:
            return 'Unhealthy for Sensitive Groups'
        elif aqi <= 200:
            return 'Unhealthy'
        elif aqi <= 300:
            return 'Very Unhealthy'
        else:
            return 'Hazardous'
    
    def save_models(self):
        """Save all trained models and scalers"""
        import os
        os.makedirs('saved_models', exist_ok=True)
        
        # Save Keras models
        for model_name, model in self.models.items():
            if model is not None:
                model.save(f'saved_models/{model_name}.h5')
        
        # Save scalers
        joblib.dump(self.scalers, 'saved_models/forecast_scalers.pkl')
        
        # Save metadata
        metadata = {
            'version': self.version,
            'sequence_length': self.sequence_length,
            'feature_columns': self.feature_columns,
            'forecast_horizons': self.forecast_horizons,
            'trained_at': datetime.now()
        }
        joblib.dump(metadata, 'saved_models/forecast_metadata.pkl')
        
        print("Forecasting models saved successfully!")
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            import os
            
            # Load metadata
            metadata = joblib.load('saved_models/forecast_metadata.pkl')
            self.version = metadata['version']
            self.sequence_length = metadata['sequence_length']
            self.feature_columns = metadata['feature_columns']
            self.forecast_horizons = metadata['forecast_horizons']
            
            # Load scalers
            self.scalers = joblib.load('saved_models/forecast_scalers.pkl')
            
            # Load Keras models
            model_files = [f for f in os.listdir('saved_models') if f.endswith('.h5')]
            self.models = {}
            
            for model_file in model_files:
                model_name = model_file.replace('.h5', '')
                try:
                    self.models[model_name] = tf.keras.models.load_model(
                        f'saved_models/{model_file}',
                        compile=False
                    )
                except Exception as e:
                    print(f"Warning: Could not load {model_file}: {e}")
            
            self.is_trained = True
            print(f"Loaded {len(self.models)} forecasting models successfully!")
            
        except FileNotFoundError:
            print("No saved models found. Training new models...")
            self.train_models()
    
    def is_loaded(self):
        """Check if models are loaded"""
        return self.is_trained and len(self.models) > 0
    
    def get_performance_metrics(self):
        """Get model performance metrics"""
        return getattr(self, 'performance_metrics', {})
 # Initialize and train if run directly
 if __name__ == "__main__":
    forecaster = AdvancedAQIForecaster()
    asyncio.run(forecaster.train_models_async())
