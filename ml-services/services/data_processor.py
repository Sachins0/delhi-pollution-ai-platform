import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

class DataProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def process_aqi_data(self, raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Process raw AQI data into structured format"""
        try:
            df = pd.DataFrame(raw_data)
            
            # Handle missing values
            df = self.handle_missing_values(df)
            
            # Validate and clean AQI values
            df = self.clean_aqi_values(df)
            
            # Add derived features
            df = self.add_temporal_features(df)
            
            return df
            
        except Exception as e:
            self.logger.error(f"Error processing AQI data: {e}")
            raise

    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        # Forward fill for time series data
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(method='ffill')
        
        # Fill remaining missing values with median
        for col in numeric_columns:
            if df[col].isna().sum() > 0:
                df[col] = df[col].fillna(df[col].median())
        
        return df

    def clean_aqi_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate AQI values"""
        if 'aqi_value' in df.columns:
            # Remove impossible values
            df = df[(df['aqi_value'] >= 0) & (df['aqi_value'] <= 500)]
            
            # Flag outliers but don't remove them
            q1 = df['aqi_value'].quantile(0.25)
            q3 = df['aqi_value'].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            df['is_outlier'] = (df['aqi_value'] < lower_bound) | (df['aqi_value'] > upper_bound)
        
        return df

    def add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add temporal features to the dataset"""
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
            
            # Add rolling averages
            df = df.sort_values('timestamp')
            df['aqi_1h_avg'] = df['aqi_value'].rolling(window=1, min_periods=1).mean()
            df['aqi_3h_avg'] = df['aqi_value'].rolling(window=3, min_periods=1).mean()
            df['aqi_24h_avg'] = df['aqi_value'].rolling(window=24, min_periods=1).mean()
        
        return df

    def calculate_data_quality_score(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate data quality metrics"""
        quality_metrics = {
            'total_records': len(df),
            'missing_data_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'duplicate_percentage': (df.duplicated().sum() / len(df)) * 100,
            'data_freshness_hours': 0,
            'quality_score': 0
        }
        
        if 'timestamp' in df.columns:
            latest_timestamp = df['timestamp'].max()
            if pd.notna(latest_timestamp):
                time_diff = datetime.now() - latest_timestamp
                quality_metrics['data_freshness_hours'] = time_diff.total_seconds() / 3600
        
        # Calculate overall quality score (0-1)
        freshness_score = max(0, 1 - quality_metrics['data_freshness_hours'] / 24)  # Declines over 24h
        completeness_score = 1 - quality_metrics['missing_data_percentage'] / 100
        uniqueness_score = 1 - quality_metrics['duplicate_percentage'] / 100
        
        quality_metrics['quality_score'] = (freshness_score * 0.4 + 
                                          completeness_score * 0.4 + 
                                          uniqueness_score * 0.2)
        
        return quality_metrics

    def aggregate_spatial_data(self, df: pd.DataFrame, grid_size: float = 0.01) -> pd.DataFrame:
        """Aggregate data spatially using a grid system"""
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            return df
        
        # Create grid coordinates
        df['grid_lat'] = (df['latitude'] // grid_size) * grid_size
        df['grid_lng'] = (df['longitude'] // grid_size) * grid_size
        
        # Aggregate by grid cell
        agg_functions = {
            'aqi_value': ['mean', 'median', 'std', 'count'],
            'pm25': 'mean',
            'pm10': 'mean',
            'no2': 'mean',
            'so2': 'mean',
            'co': 'mean',
            'o3': 'mean'
        }
        
        # Filter out columns that don't exist
        existing_agg_functions = {}
        for col, func in agg_functions.items():
            if col in df.columns:
                existing_agg_functions[col] = func
        
        if existing_agg_functions:
            aggregated = df.groupby(['grid_lat', 'grid_lng']).agg(existing_agg_functions)
            
            # Flatten column names
            aggregated.columns = ['_'.join(col).strip() for col in aggregated.columns]
            aggregated = aggregated.reset_index()
            
            return aggregated
        
        return df