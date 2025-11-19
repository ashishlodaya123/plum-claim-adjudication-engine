import pytest
import json
from pathlib import Path
from app.services.rules.rules_engine import RulesEngine

# Load test cases
test_cases_path = Path(__file__).parent / "test_cases.json"
with open(test_cases_path) as f:
    test_cases = json.load(f)

# Dynamically create tests for each test case
@pytest.mark.parametrize("test_case", test_cases)
def test_claim_adjudication(test_case):
    # Initialize the rules engine
    rules_engine = RulesEngine()

    # Adjudicate the claim
    decision = rules_engine.adjudicate(test_case["mock_extracted_data"])

    # Assert the decision
    assert decision["decision"] == test_case["expected_decision"]["decision"]
    assert decision["approved_amount"] == test_case["expected_decision"]["approved_amount"]
    assert decision["rejection_reasons"] == test_case["expected_decision"]["rejection_reasons"]
    # The notes can be slightly different, so we check for substrings
    assert all(note.strip() in decision["notes"] for note in test_case["expected_decision"]["notes"].split(","))
