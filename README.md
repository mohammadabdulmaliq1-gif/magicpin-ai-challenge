# Vera Merchant AI Assistant — Challenge Submission

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
