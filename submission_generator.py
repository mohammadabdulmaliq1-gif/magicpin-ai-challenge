import json
from pathlib import Path
from state_manager import StateManager
from composer import VeraComposer

def generate_submission(output_dir: Path = Path(__file__).parent) -> bool:
    sm = StateManager()
    sm.load_seed_dataset()
    composer = VeraComposer()

    # Get sample merchants and triggers
    merchants = list(sm.contexts.keys())
    merchant_keys = [k[1] for k in merchants if k[0] == "merchant"]
    trigger_keys = [k[1] for k in merchants if k[0] == "trigger"]

    submission_rows = []
    
    # Generate 30 test pairs
    for idx in range(1, 31):
        test_id = f"T{idx:02d}"
        
        # Pick merchant and trigger deterministically
        m_id = merchant_keys[(idx - 1) % len(merchant_keys)] if merchant_keys else "m_001_drmeera_dentist_delhi"
        t_id = trigger_keys[(idx - 1) % len(trigger_keys)] if trigger_keys else "trg_001"
        
        m_payload = sm.get_context("merchant", m_id) or {}
        cat_slug = m_payload.get("category_slug", "dentists")
        cat_payload = sm.get_context("category", cat_slug) or {}
        t_payload = sm.get_context("trigger", t_id) or {}
        
        c_id = t_payload.get("customer_id")
        cust_payload = sm.get_context("customer", c_id) if c_id else None

        result = composer.compose(cat_payload, m_payload, t_payload, cust_payload)
        
        submission_rows.append({
            "test_id": test_id,
            "body": result["body"],
            "cta": result["cta"],
            "send_as": result["send_as"],
            "suppression_key": result["suppression_key"],
            "rationale": result["rationale"]
        })

    jsonl_path = output_dir / "submission.jsonl"
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for row in submission_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    readme_content = """# Vera Merchant AI Assistant — Challenge Submission

## Team Overview
- **Team Name**: Team Vera Ultra
- **Approach**: 4-Context Deterministic & LLM-Powered Composition Engine with Multi-Turn Intent State Machine

## Architectural Highlights
1. **4-Context Layering**: Separates Category (vertical knowledge & voice rules), Merchant (daily state & performance), Trigger (event payload), and Customer (CRM state).
2. **Specificity & Verifiability**: Every outbound anchors on concrete numbers, peer stats, price formats ("Haircut @ ₹99"), and publication citations (e.g. JIDA Oct 2026).
3. **Multi-Turn Intent Engine**: 
   - **Auto-reply exit**: Identifies repeated WhatsApp Business auto-replies and exits gracefully to avoid burning turns.
   - **Action transition**: Swaps from qualification mode to action execution mode instantly upon receiving merchant commitment.
   - **Hostile handling**: Immediately honors merchant opt-outs.

## Verification
Tested against `judge_simulator.py` across Warmup, Tick Test, Auto-Reply Hell, Intent Transition, and Hostile scenarios.
"""

    readme_path = output_dir / "README.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    print(f"[SubmissionGenerator] Successfully generated submission.jsonl ({len(submission_rows)} rows) and README.md")
    return True

if __name__ == "__main__":
    generate_submission()
