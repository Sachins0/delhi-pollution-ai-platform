from fastapi import HTTPException

def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate geographic coordinates"""
    if not (-90 <= latitude <= 90):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid latitude: {latitude}"
        )
    
    if not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid longitude: {longitude}"
        )
    
    return True

def validate_timeframe(hours: int) -> bool:
    """Validate forecast timeframe"""
    if not (1 <= hours <= 168):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid forecast timeframe: {hours} hours"
        )
    
    return True
