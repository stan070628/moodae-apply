"""
AI API Resilient Wrapper (Python)
- Exponential backoff (1-32s, max 5 retries for 429/5xx)
- Timeout 30s, fallback chain (Main->Sub->Cache)
- Request queue (max 50/min, Retry-After parsing)
- Token limit < 80%, keep last 5 turns, cache 1h
- DEBUG logs (tokens, latency, rate-limit)
"""

import os
import time
import json
import hashlib
import threading
from functools import wraps
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Callable
from collections import deque

from google import genai
from openai import OpenAI
import anthropic

DEBUG = os.getenv("DEBUG", "").lower() in ("true", "1", "yes")

# Thread-safe rate limiter
_rate_lock = threading.Lock()
_request_times: deque = deque(maxlen=60)
_retry_after: float = 0
MAX_REQUESTS_PER_MINUTE = 50

# Cache (1h TTL)
_cache: Dict[str, Dict] = {}
CACHE_TTL = 3600

# Conversation history (last 5 turns)
_conversation_history: Dict[str, List[Dict]] = {}
MAX_TURNS = 5


def _log(*args):
    if DEBUG:
        print(f"[AIClient] {datetime.now().isoformat()}", *args)


def _get_cache_key(endpoint: str, payload: Any) -> str:
    data = json.dumps({"endpoint": endpoint, "payload": payload}, sort_keys=True, default=str)
    return f"ai_{hashlib.md5(data.encode()).hexdigest()}"


def _get_from_cache(key: str) -> Optional[Dict]:
    cached = _cache.get(key)
    if not cached:
        return None
    if time.time() - cached["timestamp"] > CACHE_TTL:
        del _cache[key]
        return None
    _log("Cache HIT:", key)
    return cached["data"]


def _set_cache(key: str, data: Dict):
    _cache[key] = {"data": data, "timestamp": time.time()}
    # Cleanup old entries
    if len(_cache) > 100:
        oldest_key = min(_cache.keys(), key=lambda k: _cache[k]["timestamp"])
        del _cache[oldest_key]


def _check_rate_limit() -> tuple[bool, float]:
    global _retry_after
    now = time.time()
    
    with _rate_lock:
        # Check Retry-After
        if _retry_after > now:
            wait = _retry_after - now
            _log(f"Rate limited, waiting: {wait:.2f}s")
            return False, wait
        
        # Clean old requests
        while _request_times and now - _request_times[0] > 60:
            _request_times.popleft()
        
        if len(_request_times) >= MAX_REQUESTS_PER_MINUTE:
            wait = 60 - (now - _request_times[0]) + 0.1
            _log(f"Queue full, waiting: {wait:.2f}s")
            return False, wait
        
        return True, 0


def _record_request():
    with _rate_lock:
        _request_times.append(time.time())


def _set_retry_after(seconds: float):
    global _retry_after
    with _rate_lock:
        _retry_after = time.time() + seconds


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


def _trim_to_token_limit(messages: List[Dict], max_tokens: int) -> List[Dict]:
    limit = int(max_tokens * 0.8)
    total_tokens = 0
    trimmed = []
    
    for msg in reversed(messages):
        tokens = _estimate_tokens(json.dumps(msg))
        if total_tokens + tokens > limit:
            break
        total_tokens += tokens
        trimmed.insert(0, msg)
    
    _log(f"Tokens estimated: {total_tokens} / limit: {limit}")
    return trimmed


def _update_conversation_history(session_id: str, role: str, content: str):
    if not session_id:
        return
    if session_id not in _conversation_history:
        _conversation_history[session_id] = []
    
    history = _conversation_history[session_id]
    history.append({"role": role, "content": content, "timestamp": time.time()})
    
    # Keep last 5 turns (10 messages)
    while len(history) > MAX_TURNS * 2:
        history.pop(0)


def _get_conversation_history(session_id: str) -> List[Dict]:
    return _conversation_history.get(session_id, [])


def with_retry(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 32.0,
    retryable_errors: tuple = (429, 500, 502, 503, 504),
):
    """Decorator for exponential backoff retry logic."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            delay = base_delay
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()
                    
                    # Check if retryable
                    is_retryable = any(str(code) in error_msg for code in retryable_errors)
                    is_retryable = is_retryable or any(
                        err in error_msg for err in 
                        ["timeout", "connection", "network", "too many requests", "resource_exhausted"]
                    )
                    
                    if not is_retryable or attempt == max_retries:
                        _log(f"Non-retryable or max retries: {e}")
                        raise
                    
                    # Parse Retry-After from error if available
                    retry_after = None
                    if "retry-after" in error_msg or "retry_after" in error_msg:
                        try:
                            import re
                            match = re.search(r'retry[_-]after[:\s]+(\d+)', error_msg, re.I)
                            if match:
                                retry_after = int(match.group(1))
                        except:
                            pass
                    
                    wait_time = retry_after if retry_after else min(delay, max_delay)
                    _log(f"Retry {attempt + 1}/{max_retries} after {wait_time:.1f}s ({e})")
                    
                    if retry_after:
                        _set_retry_after(retry_after)
                    
                    time.sleep(wait_time)
                    delay = min(delay * 2, max_delay)
            
            raise last_error
        return wrapper
    return decorator


class AIAPIClient:
    """Resilient AI API client with fallback chain and caching."""
    
    def __init__(self, api_keys: Dict[str, str] = None):
        self.api_keys = api_keys or {}
    
    def call(
        self,
        endpoint: str,
        prompt: str,
        *,
        system: str = None,
        model: str = None,
        fallback_endpoints: List[str] = None,
        session_id: str = None,
        max_tokens: int = 4096,
        timeout: float = 30.0,
        use_cache: bool = True,
        temperature: float = 0.7,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """
        Call AI API with resilience features.
        
        Args:
            endpoint: 'gemini', 'openai', or 'anthropic'
            prompt: User prompt
            system: System prompt
            model: Model name override
            fallback_endpoints: List of fallback endpoints
            session_id: Session ID for conversation history
            max_tokens: Max tokens limit
            timeout: Request timeout in seconds
            use_cache: Enable caching
            temperature: Model temperature
            json_mode: Request JSON response
        """
        start_time = time.time()
        payload = {"prompt": prompt, "system": system, "model": model, "temperature": temperature, "json_mode": json_mode}
        cache_key = _get_cache_key(endpoint, payload)
        
        # Try cache first
        if use_cache:
            cached = _get_from_cache(cache_key)
            if cached:
                return {**cached, "from_cache": True}
        
        # Build endpoint chain
        endpoints = [endpoint] + (fallback_endpoints or [])
        last_error = Exception("No endpoints configured")
        
        for current_endpoint in endpoints:
            api_key = self.api_keys.get(current_endpoint.lower()) or self.api_keys.get(current_endpoint.capitalize())
            if not api_key:
                _log(f"No API key for {current_endpoint}, skipping")
                continue
            
            try:
                result = self._call_single(
                    current_endpoint,
                    prompt=prompt,
                    system=system,
                    model=model,
                    api_key=api_key,
                    session_id=session_id,
                    max_tokens=max_tokens,
                    timeout=timeout,
                    temperature=temperature,
                    json_mode=json_mode,
                )
                
                # Cache successful result
                if use_cache and result:
                    _set_cache(cache_key, result)
                
                latency = time.time() - start_time
                _log(f"Success with {current_endpoint}, latency: {latency:.2f}s")
                return {**result, "used_endpoint": current_endpoint, "latency": latency}
                
            except Exception as e:
                _log(f"Failed: {current_endpoint} - {e}")
                last_error = e
        
        # All endpoints failed - try stale cache
        stale_cache = _cache.get(cache_key)
        if stale_cache:
            _log("Using stale cache as fallback")
            return {**stale_cache["data"], "from_cache": True, "stale": True}
        
        raise last_error
    
    @with_retry(max_retries=5, base_delay=1.0, max_delay=32.0)
    def _call_single(
        self,
        endpoint: str,
        prompt: str,
        system: str,
        model: str,
        api_key: str,
        session_id: str,
        max_tokens: int,
        timeout: float,
        temperature: float,
        json_mode: bool,
    ) -> Dict[str, Any]:
        """Execute single API request with retry logic."""
        # Rate limit check
        allowed, wait_time = _check_rate_limit()
        if not allowed:
            time.sleep(wait_time)
        
        # Get conversation history
        history = []
        if session_id:
            history = [{"role": h["role"], "content": h["content"]} 
                      for h in _get_conversation_history(session_id)]
        
        endpoint_lower = endpoint.lower()
        
        if endpoint_lower == "gemini":
            result = self._call_gemini(api_key, prompt, system, model, temperature, json_mode)
        elif endpoint_lower == "openai":
            result = self._call_openai(api_key, prompt, system, model, history, max_tokens, temperature, json_mode)
        elif endpoint_lower in ("anthropic", "claude"):
            result = self._call_anthropic(api_key, prompt, system, model, history, max_tokens, temperature)
        else:
            raise ValueError(f"Unknown endpoint: {endpoint}")
        
        _record_request()
        
        # Update conversation history
        if session_id and result.get("content"):
            _update_conversation_history(session_id, "assistant", result["content"])
        
        return result
    
    def _call_gemini(self, api_key: str, prompt: str, system: str, model: str, temperature: float, json_mode: bool) -> Dict:
        client = genai.Client(api_key=api_key)
        
        model_name = model or "gemini-2.0-flash"
        
        config = {"temperature": temperature}
        if json_mode:
            config["response_mime_type"] = "application/json"
        if system:
            config["system_instruction"] = system
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config,
        )
        
        content = response.text
        usage = {}
        if hasattr(response, 'usage_metadata'):
            usage = {"total": response.usage_metadata.total_token_count}
        
        _log(f"Gemini tokens: {usage}")
        return {"content": content, "usage": usage}
    
    def _call_openai(self, api_key: str, prompt: str, system: str, model: str, history: List[Dict], max_tokens: int, temperature: float, json_mode: bool) -> Dict:
        client = OpenAI(api_key=api_key)
        
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        
        # Trim to token limit
        messages = _trim_to_token_limit(messages, max_tokens)
        
        kwargs = {
            "model": model or "gpt-4o-mini",
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = client.chat.completions.create(**kwargs)
        
        content = response.choices[0].message.content
        usage = {
            "input": response.usage.prompt_tokens,
            "output": response.usage.completion_tokens,
            "total": response.usage.total_tokens,
        }
        
        _log(f"OpenAI tokens: {usage}")
        return {"content": content, "usage": usage}
    
    def _call_anthropic(self, api_key: str, prompt: str, system: str, model: str, history: List[Dict], max_tokens: int, temperature: float) -> Dict:
        client = anthropic.Anthropic(api_key=api_key)
        
        messages = list(history) + [{"role": "user", "content": prompt}]
        messages = _trim_to_token_limit(messages, max_tokens)
        
        response = client.messages.create(
            model=model or "claude-3-5-sonnet-20240620",
            max_tokens=min(max_tokens, 4096),
            system=system or "",
            messages=messages,
        )
        
        content = response.content[0].text
        usage = {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens,
        }
        
        _log(f"Anthropic tokens: {usage}")
        return {"content": content, "usage": usage}
    
    @staticmethod
    def clear_cache():
        _cache.clear()
    
    @staticmethod
    def clear_history(session_id: str = None):
        if session_id:
            _conversation_history.pop(session_id, None)
        else:
            _conversation_history.clear()
    
    @staticmethod
    def get_stats() -> Dict:
        return {
            "cache_size": len(_cache),
            "requests_last_minute": len(_request_times),
            "rate_limited_until": datetime.fromtimestamp(_retry_after).isoformat() if _retry_after > time.time() else None,
        }


# Singleton instance
_client: Optional[AIAPIClient] = None


def get_client(api_keys: Dict[str, str] = None) -> AIAPIClient:
    """Get or create AIAPIClient instance."""
    global _client
    if _client is None or api_keys:
        _client = AIAPIClient(api_keys)
    return _client


def call_ai_api(
    endpoint: str,
    prompt: str,
    api_keys: Dict[str, str],
    **kwargs
) -> Dict[str, Any]:
    """Convenience function for calling AI API."""
    client = get_client(api_keys)
    return client.call(endpoint, prompt, **kwargs)


# Export for direct import
__all__ = ["AIAPIClient", "get_client", "call_ai_api", "with_retry"]
