import asyncio
import psutil
import os
from datetime import datetime, timedelta
import joblib
import numpy as np
from typing import Dict, List, Any
import logging

from models.source_identifier import AdvancedSourceIdentifier
from models.aqi_forecaster import AdvancedAQIForecaster
from models.policy_recommender import PolicyRecommendationEngine

class ModelManager:
    def __init__(self):
        self.models = {
            'source_identifier': AdvancedSourceIdentifier(),
            'aqi_forecaster': AdvancedAQIForecaster(),
            'policy_engine': PolicyRecommendationEngine()
        }
        
        self.model_status = {
            'source_identifier': {'loaded': False, 'last_updated': None, 'performance': {}},
            'aqi_forecaster': {'loaded': False, 'last_updated': None, 'performance': {}},
            'policy_engine': {'loaded': False, 'last_updated': None, 'performance': {}}
        }
        
        self.batch_processing_active = False
        self.performance_history = []
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    async def load_all_models(self):
        """Load all ML models asynchronously"""
        self.logger.info("Loading all ML models...")
        
        tasks = []
        for model_name, model in self.models.items():
            task = asyncio.create_task(self._load_single_model(model_name, model))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        loaded_count = 0
        for model_name, result in zip(self.models.keys(), results):
            if isinstance(result, Exception):
                self.logger.error(f"Failed to load {model_name}: {result}")
                self.model_status[model_name]['loaded'] = False
            else:
                self.logger.info(f"Successfully loaded {model_name}")
                self.model_status[model_name]['loaded'] = True
                self.model_status[model_name]['last_updated'] = datetime.now()
                loaded_count += 1
        
        self.logger.info(f"Loaded {loaded_count}/{len(self.models)} models successfully")
        return loaded_count == len(self.models)

    async def _load_single_model(self, model_name: str, model):
        """Load a single model"""
        try:
            if hasattr(model, 'load_models'):
                await asyncio.to_thread(model.load_models)
            else:
                # If no async method, run in thread
                await asyncio.to_thread(getattr(model, 'train_models', lambda: None))
            
            return True
        except Exception as e:
            self.logger.error(f"Error loading {model_name}: {e}")
            raise e

    async def batch_retrain(self):
        """Perform batch retraining of all models"""
        if self.batch_processing_active:
            self.logger.warning("Batch processing already active, skipping...")
            return
        
        self.batch_processing_active = True
        self.logger.info("Starting batch retraining process...")
        
        try:
            # Retrain models in parallel
            tasks = []
            for model_name, model in self.models.items():
                if hasattr(model, 'train_models_async'):
                    task = asyncio.create_task(model.train_models_async())
                else:
                    task = asyncio.create_task(asyncio.to_thread(model.train_models))
                tasks.append((model_name, task))
            
            # Wait for all retraining to complete
            for model_name, task in tasks:
                try:
                    await task
                    self.model_status[model_name]['last_updated'] = datetime.now()
                    self.logger.info(f"Successfully retrained {model_name}")
                except Exception as e:
                    self.logger.error(f"Failed to retrain {model_name}: {e}")
            
            # Update performance history
            await self._update_performance_history()
            
        finally:
            self.batch_processing_active = False
            self.logger.info("Batch retraining process completed")

    async def _update_performance_history(self):
        """Update performance history for all models"""
        performance_snapshot = {
            'timestamp': datetime.now(),
            'models': {}
        }
        
        for model_name, model in self.models.items():
            if hasattr(model, 'get_performance_metrics'):
                performance_snapshot['models'][model_name] = model.get_performance_metrics()
                self.model_status[model_name]['performance'] = model.get_performance_metrics()
        
        self.performance_history.append(performance_snapshot)
        
        # Keep only last 100 snapshots
        if len(self.performance_history) > 100:
            self.performance_history = self.performance_history[-100:]

    def get_loaded_models(self) -> Dict[str, bool]:
        """Get status of loaded models"""
        return {name: status['loaded'] for name, status in self.model_status.items()}

    def get_model_status(self) -> Dict[str, Any]:
        """Get detailed status of all models"""
        return self.model_status.copy()

    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage statistics"""
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        return {
            'rss': memory_info.rss / 1024 / 1024,  # MB
            'vms': memory_info.vms / 1024 / 1024,  # MB
            'percent': process.memory_percent(),
            'available': psutil.virtual_memory().available / 1024 / 1024,  # MB
            'total': psutil.virtual_memory().total / 1024 / 1024  # MB
        }

    def get_performance_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance trends over specified hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        recent_history = [
            snapshot for snapshot in self.performance_history
            if snapshot['timestamp'] >= cutoff_time
        ]
        
        if not recent_history:
            return {'message': 'No recent performance data available'}
        
        trends = {}
        for model_name in self.models.keys():
            model_metrics = []
            timestamps = []
            
            for snapshot in recent_history:
                if model_name in snapshot['models']:
                    model_metrics.append(snapshot['models'][model_name])
                    timestamps.append(snapshot['timestamp'])
            
            if model_metrics:
                trends[model_name] = {
                    'data_points': len(model_metrics),
                    'latest_metrics': model_metrics[-1] if model_metrics else {},
                    'time_range': {
                        'start': min(timestamps).isoformat() if timestamps else None,
                        'end': max(timestamps).isoformat() if timestamps else None
                    }
                }
        
        return trends

    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'models': {},
            'system': {},
            'issues': []
        }
        
        # Check model status
        for model_name, status in self.model_status.items():
            model_health = {
                'loaded': status['loaded'],
                'last_updated': status['last_updated'].isoformat() if status['last_updated'] else None,
                'status': 'healthy' if status['loaded'] else 'unhealthy'
            }
            
            # Check if model is stale (not updated in 24 hours)
            if status['last_updated'] and datetime.now() - status['last_updated'] > timedelta(hours=24):
                model_health['status'] = 'stale'
                health_status['issues'].append(f"{model_name} model is stale (last updated > 24h ago)")
            
            health_status['models'][model_name] = model_health
        
        # Check system resources
        memory_usage = self.get_memory_usage()
        health_status['system']['memory'] = memory_usage
        
        if memory_usage['percent'] > 90:
            health_status['issues'].append(f"High memory usage: {memory_usage['percent']:.1f}%")
            health_status['overall_status'] = 'warning'
        
        # Check disk space
        disk_usage = psutil.disk_usage('/')
        disk_percent = (disk_usage.used / disk_usage.total) * 100
        health_status['system']['disk'] = {
            'used_percent': disk_percent,
            'free_gb': disk_usage.free / 1024 / 1024 / 1024
        }
        
        if disk_percent > 90:
            health_status['issues'].append(f"High disk usage: {disk_percent:.1f}%")
            health_status['overall_status'] = 'warning'
        
        # Overall status assessment
        if health_status['issues']:
            if len(health_status['issues']) > 3:
                health_status['overall_status'] = 'unhealthy'
            elif health_status['overall_status'] != 'warning':
                health_status['overall_status'] = 'warning'
        
        return health_status

    async def optimize_models(self):
        """Optimize model performance and memory usage"""
        self.logger.info("Starting model optimization...")
        
        # Clear any cached predictions
        for model in self.models.values():
            if hasattr(model, 'clear_cache'):
                model.clear_cache()
        
        # Force garbage collection
        import gc
        gc.collect()
        
        self.logger.info("Model optimization completed")

    def get_prediction_stats(self) -> Dict[str, Any]:
        """Get prediction statistics for all models"""
        stats = {}
        
        for model_name, model in self.models.items():
            if hasattr(model, 'get_prediction_stats'):
                stats[model_name] = model.get_prediction_stats()
            else:
                stats[model_name] = {'message': 'Statistics not available'}
        
        return stats

    async def schedule_maintenance(self):
        """Schedule regular maintenance tasks"""
        self.logger.info("Starting scheduled maintenance...")
        
        # Update performance metrics
        await self._update_performance_history()
        
        # Optimize models
        await self.optimize_models()
        
        # Check for model updates needed
        for model_name, status in self.model_status.items():
            if status['last_updated']:
                time_since_update = datetime.now() - status['last_updated']
                if time_since_update > timedelta(days=7):
                    self.logger.warning(f"{model_name} hasn't been updated in {time_since_update.days} days")
        
        self.logger.info("Scheduled maintenance completed")

    def export_model_metadata(self) -> Dict[str, Any]:
        """Export comprehensive model metadata"""
        metadata = {
            'export_timestamp': datetime.now().isoformat(),
            'models': {},
            'system_info': {
                'memory_usage': self.get_memory_usage(),
                'performance_history_length': len(self.performance_history)
            }
        }
        
        for model_name, model in self.models.items():
            model_metadata = {
                'version': getattr(model, 'version', 'unknown'),
                'status': self.model_status[model_name],
                'class_name': model.__class__.__name__,
                'is_trained': getattr(model, 'is_trained', False)
            }
            
            # Add model-specific metadata
            if hasattr(model, 'feature_columns'):
                model_metadata['feature_count'] = len(model.feature_columns)
            
            if hasattr(model, 'performance_metrics'):
                model_metadata['performance'] = model.performance_metrics
            
            metadata['models'][model_name] = model_metadata
        
        return metadata

# Initialize model manager
model_manager = ModelManager()