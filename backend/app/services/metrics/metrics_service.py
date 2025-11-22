import json
from pathlib import Path
from typing import List, Dict
from app.services.rules.rules_engine import rules_engine

class MetricsService:
    def __init__(self):
        self.test_cases = self.load_test_cases()

    def load_test_cases(self) -> List[Dict]:
        # Assuming test_cases.json is in the root or a known location
        # Adjust path as needed based on project structure
        root_path = Path(__file__).parent.parent.parent.parent.parent # backend/app/services/metrics -> backend -> root
        test_cases_path = root_path / "test_cases.json"
        if not test_cases_path.exists():
             # Fallback if running from backend dir
             test_cases_path = Path("test_cases.json")
        
        if test_cases_path.exists():
            with open(test_cases_path) as f:
                return json.load(f)
        return []

    def evaluate_accuracy(self) -> Dict[str, float]:
        if not self.test_cases:
            return {"error": "No test cases found"}

        total = len(self.test_cases)
        correct = 0
        true_positives = 0 # System Approved, Actual Approved
        false_positives = 0 # System Approved, Actual Rejected
        false_negatives = 0 # System Rejected, Actual Approved
        
        results = []

        for case in self.test_cases:
            # Simulate extraction data from the test case input
            # In a real scenario, we might run the full pipeline, but here we test the Rules Engine logic
            # assuming perfect extraction for the sake of rule validation, 
            # OR we can mock the extraction based on the 'input' in test case.
            
            # For this bonus point, let's assume we are testing the Rules Engine logic primarily
            extracted_data = case.get("extracted_data_mock", {})
            
            # If mock data isn't in test_cases.json, we might need to derive it or skip
            # Let's assume the test_cases.json has 'input' which mimics extracted fields
            if not extracted_data:
                extracted_data = case.get("input", {})

            decision_data = rules_engine.adjudicate(extracted_data)
            system_decision = decision_data["decision"]
            expected_decision = case.get("expected_output", {}).get("decision")

            is_correct = (system_decision == expected_decision)
            if is_correct:
                correct += 1
            
            # Metrics for Approved class
            if system_decision == "APPROVED" and expected_decision == "APPROVED":
                true_positives += 1
            elif system_decision == "APPROVED" and expected_decision != "APPROVED":
                false_positives += 1
            elif system_decision != "APPROVED" and expected_decision == "APPROVED":
                false_negatives += 1

            results.append({
                "case_id": case.get("id"),
                "expected": expected_decision,
                "actual": system_decision,
                "correct": is_correct
            })

        accuracy = correct / total if total > 0 else 0.0
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "total_cases": total,
            "accuracy": round(accuracy, 2),
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "f1_score": round(f1_score, 2),
            "details": results
        }

metrics_service = MetricsService()
