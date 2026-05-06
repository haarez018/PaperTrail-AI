"""Verify LLM connectivity — Phase 0 check."""

import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))



def main() -> None:
    api_key = os.getenv("LLM_API_KEY", "")
    if not api_key or api_key.startswith("your-api-key-here"):
        print("ERROR: Set a valid LLM_API_KEY in nyayamitra/.env")
        print("  cp .env.example .env  # then paste your real key")
        sys.exit(1)

    client = None  # migrated
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
    print("\n✅ LLM API connection verified!")


if __name__ == "__main__":
    main()
