"""Verify LLM connectivity — Phase 0 check."""

import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)



def main() -> None:
    api_key = os.getenv("LLM_API_KEY", "")
    if not api_key or api_key.startswith("your-api-key-here"):
        print("ERROR: Set a valid LLM_API_KEY in nyayamitra/.env")
        print("  cp .env.example .env  # then paste your real key")
        sys.exit(1)

    client = None  # migrated
    try:
        response = client.messages.create(
            model="llm-model-haiku",
            max_tokens=100,
            messages=[{"role": "user", "content": "Say 'NyayaMitra is ready.' and nothing else."}],
        )
        text = response.content[0].text
        print(f"LLM says: {text}")
        print(f"Model: {response.model}")
        print(f"Input tokens: {response.usage.input_tokens}")
        print(f"Output tokens: {response.usage.output_tokens}")
        print("\n[OK] LLM API connection verified!")
    except Exception as e:
        error_msg = str(e)
        if "credit balance" in error_msg:
            print("[!]  API key is VALID but your account needs credits.")
            print("   Go to: https://ollama.ai")
            print("   Top up credits, then re-run this script.")
            print("\n[OK] API key verified (billing issue only).")
        elif "authentication" in error_msg.lower() or "401" in error_msg:
            print("[FAIL] API key is INVALID. Check your key in .env")
            sys.exit(1)
        else:
            print(f"[FAIL] Unexpected error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
