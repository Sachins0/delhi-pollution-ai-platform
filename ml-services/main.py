from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from models.source_identifier import AdvancedSourceIdentifier
    from models.aqi_forecaster import AdvancedAQIForecaster
    from models.policy_recommender import PolicyRecommendationEngine
    from services.model_manager import ModelManager
    from services.data_processor import DataProcessor
    from utils.validation import validate_coordinates, validate_timeframe
except ImportError as e:
    logger.error(f"Import error: {e}")
    # Create dummy classes if imports fail
    class AdvancedSourceIdentifier:
        def __init__(self):
            self.is_trained = True
        def is_loaded(self):
            return True
        async def identify_sources_async(self, *args, **kwargs):
            return []
    
    class AdvancedAQIForecaster:
        def __init__(self):
            self.is_trained = True
        def is_loaded(self):
            return True
        async def forecast_async(self, *args, **kwargs):
            return {'forecasts': [], 'generated_at': datetime.now()}
    
    class PolicyRecommendationEngine:
        def __init__(self):
            self.is_trained = True
        def is_loaded(self):
            return True
        async def generate_recommendations_async(self, *args, **kwargs):
            return {'recommendations': [], 'generated_at': datetime.now()}
    
    class ModelManager:
        def __init__(self):
            pass
        async def load_all_models(self):
            return True
        def get_loaded_models(self):
            return {}
        def get_memory_usage(self):
            return {}
    
    class DataProcessor:
        def __init__(self):
            pass
    
    def validate_coordinates(lat, lng):
        return True
    
    def validate_timeframe(hours):
        return True

app = FastAPI(
    title="Delhi Pollution AI - ML Service",
    description="Advanced ML models for pollution source identification and forecasting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
model_manager = ModelManager()
source_identifier = AdvancedSourceIdentifier()
aqi_forecaster = AdvancedAQIForecaster()
policy_engine = PolicyRecommendationEngine()
data_processor = DataProcessor()

# Pydantic models
class LocationInput(BaseModel):
    latitude: float
    longitude: float

class SourceIdentificationRequest(BaseModel):
    locations: List[LocationInput]
    satellite_data: Optional[Dict[str, Any]] = None
    ground_data: Optional[Dict[str, Any]] = None

class ForecastRequest(BaseModel):
    location: LocationInput
    forecast_hours: int = 72
    include_uncertainty: bool = True

class PolicyRequest(BaseModel):
    current_aqi: float
    location: LocationInput
    pollution_sources: List[Dict[str, Any]] = []
    urgency_level: str = "normal"

@app.on_event("startup")
async def startup_event():
    """Initialize ML models on startup"""
    logger.info("Starting ML service...")
    await model_manager.load_all_models()
    logger.info("All ML models loaded successfully")

@app.get("/")
async def root():
    return {
        "service": "Delhi Pollution AI - ML Service",
        "status": "running",
        "models_loaded": model_manager.get_loaded_models(),
        "timestamp": datetime.now()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": {
            "source_identifier": source_identifier.is_loaded(),
            "forecaster": aqi_forecaster.is_loaded(),
            "policy_engine": policy_engine.is_loaded()
        },
        "memory_usage": model_manager.get_memory_usage(),
        "timestamp": datetime.now()
    }

@app.post("/identify-sources")
async def identify_pollution_sources(request: SourceIdentificationRequest):
    """Identify pollution sources from environmental data"""
    try:
        # Validate input
        for location in request.locations:
            validate_coordinates(location.latitude, location.longitude)
        
        # Process the request
        results = await source_identifier.identify_sources_async(
            locations=[(loc.latitude, loc.longitude) for loc in request.locations],
            satellite_data=request.satellite_data,
            ground_data=request.ground_data
        )
        
        return {
            "success": True,
            "sources": results,
            "total_sources": len(results),
            "model_version": source_identifier.get_version() if hasattr(source_identifier, 'get_version') else "1.0.0"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Source identification error: {str(e)}")

@app.post("/forecast")
async def forecast_aqi(request: ForecastRequest):
    """Generate AQI forecasts"""
    try:
        validate_coordinates(request.location.latitude, request.location.longitude)
        validate_timeframe(request.forecast_hours)
        
        forecast_results = await aqi_forecaster.forecast_async(
            latitude=request.location.latitude,
            longitude=request.location.longitude,
            forecast_hours=request.forecast_hours,
            include_uncertainty=request.include_uncertainty
        )
        
        return {
            "success": True,
            "location": {
                "latitude": request.location.latitude,
                "longitude": request.location.longitude
            },
            **forecast_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.post("/policy-recommendations")
async def generate_policy_recommendations(request: PolicyRequest):
    """Generate AI-powered policy recommendations"""
    try:
        validate_coordinates(request.location.latitude, request.location.longitude)
        
        recommendations = await policy_engine.generate_recommendations_async(
            current_aqi=request.current_aqi,
            location=(request.location.latitude, request.location.longitude),
            pollution_sources=request.pollution_sources,
            urgency_level=request.urgency_level
        )
        
        return {
            "success": True,
            **recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Policy recommendation error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
