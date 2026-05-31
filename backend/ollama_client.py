import requests
import json
import streamlit as st

DEFAULT_OLLAMA_HOST = "http://localhost:11434"

def get_ollama_host():
    """Returns the Ollama host URL configured in Streamlit session state or defaults."""
    if "ollama_host" in st.session_state and st.session_state["ollama_host"]:
        return st.session_state["ollama_host"].strip().rstrip('/')
    return DEFAULT_OLLAMA_HOST

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

def query_ollama(prompt, system_prompt=None, model=None, response_json=False, temperature=0.7):
    """Sends a request to local Ollama API generate endpoint.
    
    Args:
        prompt (str): User prompt.
        system_prompt (str, optional): System system instructions.
        model (str, optional): Ollama model to use. If None, tries to use st.session_state['selected_model'] or first installed model.
        response_json (bool): If True, requests JSON output structure.
        temperature (float): Controls response randomness.
        
    Returns:
        tuple: (success (bool), response_text_or_error_msg (str))
    """
    host = get_ollama_host()
    url = f"{host}/api/generate"
    
    # Resolve which model to use
    if not model:
        if "selected_model" in st.session_state and st.session_state["selected_model"]:
            model = st.session_state["selected_model"]
        else:
            installed = get_installed_models()
            if installed:
                model = installed[0]
            else:
                return False, "No models installed in local Ollama. Please run 'ollama pull <model>' (e.g. llama3) in your terminal."
                
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }
    
    if system_prompt:
        payload["system"] = system_prompt
        
    if response_json:
        payload["format"] = "json"
        
    try:
        response = requests.post(url, json=payload, timeout=600)
        if response.status_code == 200:
            result = response.json()
            return True, result.get("response", "")
        else:
            return False, f"Ollama API Error: HTTP {response.status_code} - {response.text}"
    except requests.exceptions.ConnectionError:
        return False, f"Could not connect to local Ollama at {host}. Please verify Ollama is running and accessible."
    except Exception as e:
        return False, f"Request failed: {str(e)}"
