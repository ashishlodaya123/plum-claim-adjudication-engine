import asyncio
import sys
from pathlib import Path

# Add backend directory to python path
sys.path.append(str(Path(__file__).parent))

from app.services.metrics.metrics_service import metrics_service

def run_evaluation():
    print("Running Evaluation Metrics...")
    results = metrics_service.evaluate_accuracy()
    
    if "error" in results:
        print(f"Error: {results['error']}")
        return

    print(f"\nTotal Cases: {results['total_cases']}")
    print(f"Accuracy: {results['accuracy']}")
    print(f"Precision: {results['precision']}")
    print(f"Recall: {results['recall']}")
    print(f"F1 Score: {results['f1_score']}")
    
    print("\nDetailed Results:")
    for case in results['details']:
        status = "✅" if case['correct'] else "❌"
        print(f"{status} Case {case['case_id']}: Expected {case['expected']}, Got {case['actual']}")

if __name__ == "__main__":
    run_evaluation()
