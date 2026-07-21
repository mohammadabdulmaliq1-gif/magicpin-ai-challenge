import os
import sys
import time
import json
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from state_manager import StateManager
from composer import VeraComposer
from submission_generator import generate_submission

app = FastAPI(title="magicpin Vera Bot AI Portal API", version="1.0.0")

# Enable CORS for frontend portal communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singletons
state = StateManager()
composer = VeraComposer()
judge_logs: List[Dict[str, Any]] = []

# =============================================================================
# Pydantic Request Models
# =============================================================================

class ContextPushModel(BaseModel):
    scope: str
    context_id: str
    version: int
    payload: Dict[str, Any]
    delivered_at: Optional[str] = None

class TickModel(BaseModel):
    now: Optional[str] = None
    available_triggers: List[str] = []

class ReplyModel(BaseModel):
    conversation_id: str
    merchant_id: Optional[str] = None
    customer_id: Optional[str] = None
    from_role: str = "merchant"
    message: str
    received_at: Optional[str] = None
    turn_number: int = 1

class SandboxComposeModel(BaseModel):
    category_slug: str = "dentists"
    merchant_id: str = "m_001_drmeera_dentist_delhi"
    trigger_id: str = "trg_2026_04_26_research_digest"
    customer_id: Optional[str] = None

class JudgeRunModel(BaseModel):
    scenario: str = "all"
    provider: str = "openai"
    api_key: Optional[str] = ""

# =============================================================================
# 1. Official Judging Endpoints (HTTP Specification)
# =============================================================================

@app.get("/v1/healthz")
async def healthz():
    counts = state.get_context_counts()
    uptime = int(time.time() - state.start_time)
    return {
        "status": "ok",
        "uptime_seconds": uptime,
        "contexts_loaded": counts
    }

@app.get("/v1/metadata")
async def metadata():
    return {
        "team_name": "Team Vera Ultra",
        "team_members": ["AI Architect"],
        "model": "gpt-4o / gemini-1.5-flash / vera-hybrid",
        "approach": "4-context deterministic & prompt composer with intent state machine",
        "contact_email": "vera-team@magicpin.in",
        "version": "1.0.0",
        "submitted_at": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/v1/context")
async def push_context(body: ContextPushModel):
    res = state.push_context(
        scope=body.scope,
        context_id=body.context_id,
        version=body.version,
        payload=body.payload,
        delivered_at=body.delivered_at
    )
    if not res.get("accepted"):
        raise HTTPException(status_code=409, detail=res)
    return res

@app.post("/v1/tick")
async def tick(body: TickModel):
    actions = []
    triggers = body.available_triggers or list(state.get_context_counts().keys())
    
    # Process up to 5 available triggers per tick
    for trg_id in body.available_triggers[:5]:
        trg_payload = state.get_context("trigger", trg_id)
        if not trg_payload:
            continue
            
        merchant_id = trg_payload.get("merchant_id") or "m_001_drmeera_dentist_delhi"
        merchant_payload = state.get_context("merchant", merchant_id) or {}
        cat_slug = merchant_payload.get("category_slug", "dentists")
        cat_payload = state.get_context("category", cat_slug) or {}
        
        cust_id = trg_payload.get("customer_id")
        cust_payload = state.get_context("customer", cust_id) if cust_id else None

        composed = composer.compose(cat_payload, merchant_payload, trg_payload, cust_payload)

        actions.append({
            "conversation_id": f"conv_{merchant_id}_{trg_id}",
            "merchant_id": merchant_id,
            "customer_id": cust_id,
            "send_as": composed["send_as"],
            "trigger_id": trg_id,
            "template_name": "vera_compose_v1",
            "template_params": [merchant_payload.get("identity", {}).get("name", ""), "digest"],
            "body": composed["body"],
            "cta": composed["cta"],
            "suppression_key": composed["suppression_key"],
            "rationale": composed["rationale"]
        })

    return {"actions": actions}

@app.post("/v1/reply")
async def reply(body: ReplyModel):
    # Record current turn in state
    state.record_turn(
        conversation_id=body.conversation_id,
        from_role=body.from_role,
        message=body.message,
        merchant_id=body.merchant_id,
        customer_id=body.customer_id
    )

    # Detect auto-reply and intent transitions
    is_auto = state.detect_auto_reply(body.conversation_id, body.message)
    is_hostile = state.detect_hostile_or_optout(body.message)
    is_intent = state.detect_intent_action(body.message)

    res = composer.respond(
        conversation_id=body.conversation_id,
        merchant_id=body.merchant_id,
        customer_id=body.customer_id,
        from_role=body.from_role,
        message=body.message,
        turn_number=body.turn_number,
        is_auto_reply=is_auto,
        is_hostile=is_hostile,
        is_intent_action=is_intent
    )

    return res

# =============================================================================
# 2. Portal Management & Diagnostic Endpoints
# =============================================================================

@app.get("/api/contexts")
async def list_contexts(scope: Optional[str] = None):
    return {"contexts": state.list_contexts(scope)}

@app.post("/api/sandbox/compose")
async def sandbox_compose(body: SandboxComposeModel):
    cat_payload = state.get_context("category", body.category_slug) or {}
    m_payload = state.get_context("merchant", body.merchant_id) or {}
    t_payload = state.get_context("trigger", body.trigger_id) or {}
    c_payload = state.get_context("customer", body.customer_id) if body.customer_id else None

    result = composer.compose(cat_payload, m_payload, t_payload, c_payload)
    return {
        "result": result,
        "inputs": {
            "category": cat_payload,
            "merchant": m_payload,
            "trigger": t_payload,
            "customer": c_payload
        }
    }

@app.post("/api/sandbox/reply")
async def sandbox_reply(body: ReplyModel):
    return await reply(body)

@app.post("/api/submission/generate")
async def api_generate_submission():
    success = generate_submission()
    return {"success": success, "message": "submission.jsonl & README.md generated"}

@app.get("/api/submission/view")
async def view_submission():
    jsonl_path = os.path.join(os.path.dirname(__file__), "submission.jsonl")
    readme_path = os.path.join(os.path.dirname(__file__), "README.md")
    
    submission_rows = []
    if os.path.exists(jsonl_path):
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    submission_rows.append(json.loads(line))

    readme_text = ""
    if os.path.exists(readme_path):
        with open(readme_path, "r", encoding="utf-8") as f:
            readme_text = f.read()

    return {
        "rows": submission_rows,
        "readme": readme_text
    }

@app.post("/api/judge/run")
async def run_judge(body: JudgeRunModel):
    global judge_logs
    cmd = [sys.executable, "judge_simulator.py"]
    
    # Run locally against running server
    env = os.environ.copy()
    env["BOT_URL"] = "http://localhost:8080"
    
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=os.path.dirname(__file__),
        env=env
    )
    stdout, _ = proc.communicate(timeout=60)
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "scenario": body.scenario,
        "return_code": proc.returncode,
        "output": stdout
    }
    judge_logs.append(log_entry)
    return log_entry

@app.get("/api/logs")
async def get_logs():
    return {"judge_logs": judge_logs}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bot:app", host="0.0.0.0", port=8080, reload=False)
