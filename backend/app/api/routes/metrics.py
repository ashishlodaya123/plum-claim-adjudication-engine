from fastapi import APIRouter
from prometheus_client import REGISTRY
import time
import math

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    """
    Expose parsed metrics for the frontend dashboard.
    """
    metrics = {
        "total_requests": 0,
        "average_latency": 0.0,
        "active_requests": 0,
        "status_distribution": {},
        "endpoint_usage": {}
    }

    total_duration = 0.0
    total_count = 0

    # Iterate over the registry to find relevant metrics
    for metric in REGISTRY.collect():
        
        if metric.name == "http_requests_total":
            for sample in metric.samples:
                # Extract labels
                labels = sample.labels
                status = labels.get("status", "unknown")
                count = int(sample.value)
                
                # Update Status Distribution
                metrics["status_distribution"][status] = metrics["status_distribution"].get(status, 0) + count

        elif metric.name == "http_request_duration_seconds":
            # This histogram has _count and _sum
            for sample in metric.samples:
                if sample.name.endswith("_sum"):
                    total_duration += sample.value
                elif sample.name.endswith("_count"):
                    count = int(sample.value)
                    total_count += count
                    
                    # Extract labels
                    labels = sample.labels
                    handler = labels.get("handler", "unknown")
                    
                    # Update Endpoint Usage from duration metrics (more reliable)
                    if handler != "/admin/metrics":
                        metrics["endpoint_usage"][handler] = metrics["endpoint_usage"].get(handler, 0) + count
        
        elif metric.name == "http_requests_in_progress":
             for sample in metric.samples:
                metrics["active_requests"] += sample.value

    metrics["total_requests"] = total_count

    # Calculate average latency
    if total_count > 0:
        metrics["average_latency"] = total_duration / total_count
    
    # Round for display
    metrics["average_latency"] = round(metrics["average_latency"], 4)

    return metrics
