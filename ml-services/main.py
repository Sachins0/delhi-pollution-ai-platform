 from fastapi import FastAPI, HTTPException, BackgroundTasks
 from fastapi.middleware.cors import CORSMiddleware
 from pydantic import BaseModel
 from typing import List, Optional, Dict, Any
 import pandas as pd
 import numpy as np
 from datetime import datetime, timedelta
 import asyncio
 import uvicorn
from models.source_identifier import AdvancedSourceIdentifier
 from models.aqi_forecaster import AdvancedAQIForecaster
 from models.policy_recommender import PolicyRecommendationEngine
 from services.model_manager import ModelManager
 from services.data_processor import DataProcessor
 from utils.validation import validate_coordinates, validate_timeframe
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
 # Pydantic models for request/response
 class LocationInput(BaseModel):
    latitude: float
    longitude: float
 class SourceIdentificationRequest(BaseModel):
    locations: List[LocationInput]
    satellite_data: Optional[Dict[str, Any]] = None
    ground_data: Optional[Dict[str, Any]] = None
    time_range: Optional[Dict[str, datetime]] = None
 class ForecastRequest(BaseModel):
    location: LocationInput
    forecast_hours: int = 72
    include_uncertainty: bool = True
    model_ensemble: bool = True
 class PolicyRequest(BaseModel):
    current_aqi: float
    location: LocationInput
    pollution_sources: List[Dict[str, Any]]
    urgency_level: str = "normal"
 @app.on_event("startup")
 async def startup_event():
    """Initialize and load ML models on startup"""
    print("Starting ML service...")
    await model_manager.load_all_models()
    print("All ML models loaded successfully")
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
            ground_data=request.ground_data,
            time_range=request.time_range
        )
        
        return {
            "success": True,
            "sources": results,
            "total_sources": len(results),
            "processing_time": results[0].get("processing_time") if results else 0,
            "model_version": source_identifier.get_version()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Source identification error: {str(e
 @app.post("/forecast")
 async def forecast_aqi(request: ForecastRequest):
    """Generate AQI forecasts for specified location and timeframe"""
    try:
        # Validate input
        validate_coordinates(request.location.latitude, request.location.longitude)
        validate_timeframe(request.forecast_hours)
        
        # Generate forecast
        forecast_results = await aqi_forecaster.forecast_async(
            latitude=request.location.latitude,
            longitude=request.location.longitude,
            forecast_hours=request.forecast_hours,
            include_uncertainty=request.include_uncertainty,
            model_ensemble=request.model_ensemble
        )
        
        return {
            "success": True,
            "location": {
                "latitude": request.location.latitude,
                "longitude": request.location.longitude
            },
            "forecast": forecast_results,
            "forecast_horizon_hours": request.forecast_hours,
            "model_confidence": forecast_results.get("overall_confidence", 0.8),
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")
 @app.post("/policy-recommendations")
 async def generate_policy_recommendations(request: PolicyRequest):
    """Generate AI-powered policy recommendations"""
    try:
        # Validate input
        validate_coordinates(request.location.latitude, request.location.longitude)
        
        # Generate recommendations
        recommendations = await policy_engine.generate_recommendations_async(
            current_aqi=request.current_aqi,
            location=(request.location.latitude, request.location.longitude),
            pollution_sources=request.pollution_sources,
            urgency_level=request.urgency_level
        )
        
        return {
            "success": True,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations),
            "urgency_level": request.urgency_level,
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Policy recommendation error: {str(e
@app.post("/batch-process")
 async def batch_process_data(background_tasks: BackgroundTasks):
    """Trigger batch processing of accumulated data"""
    background_tasks.add_task(model_manager.batch_retrain)
    
    return {
        "success": True,
        "message": "Batch processing initiated",
        "timestamp": datetime.now()
    }
 @app.get("/model-performance")
 async def get_model_performance():
    """Get performance metrics for all models"""
    return {
        "source_identifier": source_identifier.get_performance_metrics(),
        "forecaster": aqi_forecaster.get_performance_metrics(),
        "policy_engine": policy_engine.get_performance_metrics(),
        "last_updated": datetime.now()
    }
 if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
