"""Verify Ollama LLM connectivity — pre-flight check."""

import json
import os
import sys
import urllib.request
import urllib.error

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)


def main() -> None:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

    # 1. Check Ollama is running
    print(f"Checking Ollama at {host} ...")
    try:
        req = urllib.request.Request(f"{host}/api/tags")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            models = [m["name"] for m in data.get("models", [])]
            print(f"[OK] Ollama is running. Available models: {models}")
    except urllib.error.URLError as e:
        print(f"[FAIL] Cannot reach Ollama at {host}")
        print(f"  Error: {e}")
        print("  Start Ollama with: ollama serve")
        sys.exit(1)
    except Exception as e:
        print(f"[FAIL] Unexpected error checking Ollama: {e}")
        sys.exit(1)

    # 2. Check model is available
    if model not in models:
        print(f"[FAIL] Model '{model}' not found. Available: {models}")
        print(f"  Pull it with: ollama pull {model}")
        sys.exit(1)
    print(f"[OK] Model '{model}' is available.")

    # 3. Test generation
    print(f"Testing generation with {model} ...")
    try:
        payload = json.dumps({
            "model": model,
            "prompt": "Say 'NyayaMitra is ready.' and nothing else.",
            "stream": False,
            "options": {"num_predict": 50, "temperature": 0.1},
        }).encode()
        req = urllib.request.Request(
            f"{host}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            text = result.get("response", "").strip()
            total_duration = result.get("total_duration", 0)
            duration_ms = total_duration / 1_000_000 if total_duration else 0
            print(f"  Model says: {text}")
            print(f"  Latency: {duration_ms:.0f}ms")
            print(f"\n[OK] Ollama LLM connection verified!")
    except urllib.error.URLError as e:
        print(f"[FAIL] Generation request failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[FAIL] Unexpected error during generation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
