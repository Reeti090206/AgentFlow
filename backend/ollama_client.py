import requests
import json

DEFAULT_OLLAMA_HOST = "http://localhost:11434"

# In-memory host override (set via /api/settings/host endpoint)
_ollama_host_override = None


def get_ollama_host():
    """Returns the active Ollama host URL."""
    if _ollama_host_override:
        return _ollama_host_override.strip().rstrip('/')
    return DEFAULT_OLLAMA_HOST


def set_ollama_host(host: str):
    """Updates the in-memory Ollama host override."""
    global _ollama_host_override
    _ollama_host_override = host.strip().rstrip('/')


def get_installed_models():
    """Fetches list of installed models from local Ollama instance."""
    host = get_ollama_host()
    url = f"{host}/api/tags"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = [model["name"] for model in data.get("models", [])]
            return models
        return []
    except Exception:
        return []


def query_ollama(prompt, system_prompt=None, model=None, response_json=False, temperature=0.7, max_tokens=2048):
    """Sends a request to the local Ollama /api/generate endpoint.

    Args:
        prompt (str): User prompt text.
        system_prompt (str, optional): System instruction string.
        model (str, optional): Ollama model name. Falls back to first installed model.
        response_json (bool): If True, forces JSON output format.
        temperature (float): Controls response randomness (0.0 = deterministic).
        max_tokens (int): Maximum number of tokens to generate.

    Returns:
        tuple: (success: bool, response_text_or_error: str)
    """
    host = get_ollama_host()
    url = f"{host}/api/generate"

    # Resolve model
    if not model:
        installed = get_installed_models()
        if installed:
            model = installed[0]
        else:
            return False, "No models installed in Ollama. Run 'ollama pull <model>' (e.g. ollama pull llama3)."

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        }
    }

    if system_prompt:
        payload["system"] = system_prompt

    if response_json:
        payload["format"] = "json"

    try:
        response = requests.post(url, json=payload, timeout=180)
        if response.status_code == 200:
            result = response.json()
            return True, result.get("response", "")
        else:
            return False, f"Ollama API Error: HTTP {response.status_code} — {response.text[:300]}"
    except requests.exceptions.ConnectionError:
        return False, f"Cannot connect to Ollama at {host}. Is Ollama running?"
    except requests.exceptions.ReadTimeout:
        return False, "Ollama timed out generating a response. Try a lighter model (e.g. qwen2.5:1.5b)."
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"
