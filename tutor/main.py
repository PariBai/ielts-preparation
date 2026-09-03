"""IELTS tutor service.

A thin FastAPI wrapper around Gemini or OpenAI. It is never exposed to the
internet: only the Node app can reach it, on the internal Docker network, and
Node requires a logged-in session before proxying anything here.
"""

import json
import os
import re

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import prompts

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o").strip()
TIMEOUT = float(os.getenv("AI_TIMEOUT", "120"))

# Explicit override wins; otherwise use whichever key was supplied.
PROVIDER = os.getenv("AI_PROVIDER", "").strip().lower()
if not PROVIDER:
    PROVIDER = "gemini" if GEMINI_KEY else ("openai" if OPENAI_KEY else "")

app = FastAPI(title="IELTS Tutor")


class Ctx(BaseModel):
    topic: str
    day_number: int | None = None
    module: str | None = "Writing"
    concept: str | None = None
    task_type: str | None = None
    drill: str | None = None
    exam_date: str | None = None
    topic_focus: str | None = None


class EvalReq(Ctx):
    task_prompt: str
    essay: str
    minutes_taken: int | None = None
    min_words: int | None = None


def _strip_fences(text: str) -> str:
    """Models sometimes wrap JSON in ```json fences despite being told not to."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _parse_json(text: str) -> dict:
    t = _strip_fences(text)
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        # Last resort: pull the outermost JSON object out of surrounding prose.
        start, end = t.find("{"), t.rfind("}")
        if start != -1 and end > start:
            return json.loads(t[start : end + 1])
        raise


async def _call_gemini(system: str, user: str, schema: dict) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
            "responseSchema": _gemini_schema(schema),
        },
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(url, json=payload, headers={"x-goog-api-key": GEMINI_KEY})
    if r.status_code != 200:
        raise HTTPException(502, f"Gemini error {r.status_code}: {r.text[:400]}")
    data = r.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(502, f"Unexpected Gemini response: {json.dumps(data)[:400]}")
    return _parse_json(text)


def _gemini_schema(schema: dict) -> dict:
    """Gemini rejects the `description` keyword on some node types; strip it."""
    if isinstance(schema, dict):
        out = {}
        for k, v in schema.items():
            if k == "description":
                continue
            out[k] = _gemini_schema(v)
        return out
    if isinstance(schema, list):
        return [_gemini_schema(v) for v in schema]
    return schema


async def _call_openai(system: str, user: str, schema: dict) -> dict:
    payload = {
        "model": OPENAI_MODEL,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system + "\n\nJSON shape:\n" + json.dumps(schema)},
            {"role": "user", "content": user},
        ],
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {OPENAI_KEY}"},
        )
    if r.status_code != 200:
        raise HTTPException(502, f"OpenAI error {r.status_code}: {r.text[:400]}")
    data = r.json()
    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise HTTPException(502, f"Unexpected OpenAI response: {json.dumps(data)[:400]}")
    return _parse_json(text)


async def ask(system: str, user: str, schema: dict) -> dict:
    if PROVIDER == "gemini":
        if not GEMINI_KEY:
            raise HTTPException(503, "GEMINI_API_KEY is not set")
        return await _call_gemini(system, user, schema)
    if PROVIDER == "openai":
        if not OPENAI_KEY:
            raise HTTPException(503, "OPENAI_API_KEY is not set")
        return await _call_openai(system, user, schema)
    raise HTTPException(503, "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env")


@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "provider": PROVIDER or None,
        "model": GEMINI_MODEL if PROVIDER == "gemini" else (OPENAI_MODEL if PROVIDER == "openai" else None),
        "configured": bool(PROVIDER),
    }


@app.get("/models")
async def models():
    """List the model ids this API key can actually use."""
    if PROVIDER == "gemini":
        if not GEMINI_KEY:
            raise HTTPException(503, "GEMINI_API_KEY is not set")
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                headers={"x-goog-api-key": GEMINI_KEY},
            )
        if r.status_code != 200:
            raise HTTPException(502, f"Gemini error {r.status_code}: {r.text[:300]}")
        names = [
            m.get("name", "").replace("models/", "")
            for m in r.json().get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        return {"provider": "gemini", "configured": GEMINI_MODEL, "available": sorted(names)}

    if PROVIDER == "openai":
        if not OPENAI_KEY:
            raise HTTPException(503, "OPENAI_API_KEY is not set")
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            )
        if r.status_code != 200:
            raise HTTPException(502, f"OpenAI error {r.status_code}: {r.text[:300]}")
        names = [m.get("id", "") for m in r.json().get("data", [])]
        return {"provider": "openai", "configured": OPENAI_MODEL, "available": sorted(names)}

    raise HTTPException(503, "No AI provider configured")


@app.post("/teach")
async def teach(ctx: Ctx):
    system, schema = prompts.teach_prompt(ctx.model_dump())
    return await ask(system, f"Teach me: {ctx.topic}", schema)


@app.post("/quiz")
async def quiz(ctx: Ctx):
    system, schema = prompts.quiz_prompt(ctx.model_dump())
    return await ask(system, f"Write the quiz for: {ctx.topic}", schema)


@app.post("/task")
async def task(ctx: Ctx):
    system, schema = prompts.task_prompt(ctx.model_dump())
    return await ask(system, f"Set my writing task for: {ctx.topic}", schema)


class MarkItem(BaseModel):
    q: str
    reference: str = ""
    student: str = ""


class MarkReq(Ctx):
    items: list[MarkItem]


@app.post("/quiz/mark")
async def quiz_mark(req: MarkReq):
    if not req.items:
        return {"results": []}
    system, schema = prompts.mark_prompt(req.model_dump())
    lines = []
    for i, it in enumerate(req.items, 1):
        lines.append(
            f"ITEM {i}\nQuestion: {it.q}\nModel answer: {it.reference}\nStudent wrote: {it.student or '(blank)'}\n"
        )
    return await ask(system, "\n".join(lines), schema)


class Turn(BaseModel):
    role: str  # "user" or "tutor"
    text: str


class AskReq(Ctx):
    lesson_digest: str = ""
    history: list[Turn] = []
    question: str


@app.post("/ask")
async def ask_followup(req: AskReq):
    """Free-text Q&A about the lesson. The client holds the history and replays
    it here, so the service itself stays stateless."""
    system = prompts.ask_prompt(req.model_dump(), req.lesson_digest[:12000])

    # Keep the replayed history bounded so a long chat cannot balloon the bill.
    history = req.history[-12:]

    if PROVIDER == "gemini":
        if not GEMINI_KEY:
            raise HTTPException(503, "GEMINI_API_KEY is not set")
        contents = [
            {"role": "model" if t.role == "tutor" else "user", "parts": [{"text": t.text}]}
            for t in history
        ]
        contents.append({"role": "user", "parts": [{"text": req.question}]})
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.5},
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(url, json=payload, headers={"x-goog-api-key": GEMINI_KEY})
        if r.status_code != 200:
            raise HTTPException(502, f"Gemini error {r.status_code}: {r.text[:400]}")
        data = r.json()
        try:
            return {"answer": data["candidates"][0]["content"]["parts"][0]["text"]}
        except (KeyError, IndexError):
            raise HTTPException(502, f"Unexpected Gemini response: {json.dumps(data)[:400]}")

    if PROVIDER == "openai":
        if not OPENAI_KEY:
            raise HTTPException(503, "OPENAI_API_KEY is not set")
        messages = [{"role": "system", "content": system}]
        for t in history:
            messages.append({"role": "assistant" if t.role == "tutor" else "user", "content": t.text})
        messages.append({"role": "user", "content": req.question})
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json={"model": OPENAI_MODEL, "temperature": 0.5, "messages": messages},
                headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            )
        if r.status_code != 200:
            raise HTTPException(502, f"OpenAI error {r.status_code}: {r.text[:400]}")
        data = r.json()
        try:
            return {"answer": data["choices"][0]["message"]["content"]}
        except (KeyError, IndexError):
            raise HTTPException(502, f"Unexpected OpenAI response: {json.dumps(data)[:400]}")

    raise HTTPException(503, "No AI provider configured")


@app.post("/evaluate")
async def evaluate(req: EvalReq):
    body = req.model_dump()
    system, schema = prompts.evaluate_prompt(body)
    words = len(re.findall(r"\b[\w'-]+\b", req.essay))
    user = (
        f"THE TASK I WAS SET:\n{req.task_prompt}\n\n"
        f"MY ANSWER ({words} words"
        + (f", written in {req.minutes_taken} minutes" if req.minutes_taken else "")
        + (f"; the minimum was {req.min_words} words" if req.min_words else "")
        + f"):\n{req.essay}"
    )
    result = await ask(system, user, schema)
    # Trust our own count over the model's arithmetic.
    result["word_count"] = words

    # The model reports one array per marking criterion so that no criterion goes
    # unexamined; the browser only ever wanted one list, ordered the way a report
    # reads — what the answer failed to do first, spelling slips last.
    buckets = [
        ("task_errors", "task"),
        ("cohesion_errors", "cohesion"),
        ("lexical_errors", "vocabulary"),
        ("grammar_errors", "grammar"),
    ]
    mistakes = []
    for field, fallback in buckets:
        for m in result.pop(field, None) or []:
            if not isinstance(m, dict):
                continue
            m.setdefault("category", fallback)
            m["criterion"] = fallback
            if str(m.get("severity", "")).lower() not in ("major", "minor"):
                m["severity"] = "minor"
            mistakes.append(m)
    result["mistakes"] = mistakes
    return result
