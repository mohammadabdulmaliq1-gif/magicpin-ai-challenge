import os
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

DATASET_DIR = Path(__file__).parent / "dataset"

class StateManager:
    def __init__(self, dataset_dir: Path = DATASET_DIR):
        self.dataset_dir = dataset_dir
        self.start_time = time.time()
        
        # Context stores: (scope, context_id) -> {"version": int, "payload": dict, "delivered_at": str}
        self.contexts: Dict[Tuple[str, str], Dict[str, Any]] = {}
        
        # Conversation stores: conversation_id -> List[Dict[str, Any]]
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        
        # Load base dataset initially
        self.load_seed_dataset()

    def load_seed_dataset(self) -> bool:
        try:
            # 1. Load categories
            cat_dir = self.dataset_dir / "categories"
            if cat_dir.exists():
                for f in cat_dir.glob("*.json"):
                    with open(f, "r", encoding="utf-8") as file:
                        data = json.load(file)
                        slug = data.get("slug", f.stem)
                        self.push_context("category", slug, 1, data)

            # 2. Load merchants seed
            m_path = self.dataset_dir / "merchants_seed.json"
            if m_path.exists():
                with open(m_path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    for m in data.get("merchants", []):
                        mid = m.get("merchant_id")
                        if mid:
                            self.push_context("merchant", mid, 1, m)

            # 3. Load customers seed
            c_path = self.dataset_dir / "customers_seed.json"
            if c_path.exists():
                with open(c_path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    for c in data.get("customers", []):
                        cid = c.get("customer_id")
                        if cid:
                            self.push_context("customer", cid, 1, c)

            # 4. Load triggers seed
            t_path = self.dataset_dir / "triggers_seed.json"
            if t_path.exists():
                with open(t_path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    for t in data.get("triggers", []):
                        tid = t.get("id")
                        if tid:
                            self.push_context("trigger", tid, 1, t)

            return True
        except Exception as e:
            print(f"[StateManager Error] Base dataset load failed: {e}")
            return False

    def push_context(self, scope: str, context_id: str, version: int, payload: Dict[str, Any], delivered_at: Optional[str] = None) -> Dict[str, Any]:
        key = (scope, context_id)
        cur = self.contexts.get(key)
        if cur and cur["version"] >= version:
            return {"accepted": False, "reason": "stale_version", "current_version": cur["version"]}
        
        self.contexts[key] = {
            "version": version,
            "payload": payload,
            "delivered_at": delivered_at or datetime.utcnow().isoformat() + "Z"
        }
        return {
            "accepted": True,
            "ack_id": f"ack_{context_id}_v{version}",
            "stored_at": datetime.utcnow().isoformat() + "Z"
        }

    def get_context(self, scope: str, context_id: str) -> Optional[Dict[str, Any]]:
        key = (scope, context_id)
        item = self.contexts.get(key)
        return item["payload"] if item else None

    def list_contexts(self, scope: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for (s, cid), data in self.contexts.items():
            if scope is None or s == scope:
                results.append({
                    "scope": s,
                    "context_id": cid,
                    "version": data["version"],
                    "delivered_at": data.get("delivered_at"),
                    "payload": data["payload"]
                })
        return results

    def get_context_counts(self) -> Dict[str, int]:
        counts = {"category": 0, "merchant": 0, "customer": 0, "trigger": 0}
        for (scope, _), _ in self.contexts.items():
            if scope in counts:
                counts[scope] += 1
        return counts

    def record_turn(self, conversation_id: str, from_role: str, message: str, merchant_id: Optional[str] = None, customer_id: Optional[str] = None):
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        self.conversations[conversation_id].append({
            "from_role": from_role,
            "message": message,
            "merchant_id": merchant_id,
            "customer_id": customer_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })

    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        return self.conversations.get(conversation_id, [])

    def detect_auto_reply(self, conversation_id: str, latest_message: str) -> bool:
        """
        Detects if the message is an automated business auto-reply.
        Triggers if:
        1. Identical message repeated 2+ times in conversation history.
        2. Matches standard automated reply text patterns.
        """
        msg_clean = latest_message.strip().lower()
        history = self.conversations.get(conversation_id, [])
        
        # Check repeated verbatim messages from merchant
        merchant_messages = [t["message"].strip().lower() for t in history if t["from_role"] == "merchant"]
        if merchant_messages.count(msg_clean) >= 2:
            return True

        auto_reply_phrases = [
            "thank you for contacting",
            "automated assistant",
            "our team will respond",
            "out of office",
            "hamari team tak pahuncha",
            "aapki jaankari ke liye bahut-bahut shukriya",
            "main ek automated assistant hoon",
            "reply shortly",
            "we are currently closed"
        ]
        
        for phrase in auto_reply_phrases:
            if phrase in msg_clean:
                return True
                
        return False

    def detect_hostile_or_optout(self, message: str) -> bool:
        msg_clean = message.lower()
        hostile_keywords = [
            "stop messaging", "useless spam", "remove me", "unsubscribe", "don't text",
            "dont text", "stop sending", "block", "spam", "bakwaas"
        ]
        return any(k in msg_clean for k in hostile_keywords)

    def detect_intent_action(self, message: str) -> bool:
        msg_clean = message.lower()
        intent_keywords = [
            "yes", "ok", "lets do it", "let's do it", "send me", "go ahead",
            "sure", "done", "update my profile", "focus on", "i want to join",
            "agree", "sounds good", "whats next", "what's next"
        ]
        return any(k in msg_clean for k in intent_keywords)
