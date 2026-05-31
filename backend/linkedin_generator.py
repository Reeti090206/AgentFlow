import json
import re
from ollama_client import query_ollama

def generate_linkedin_post(content_prompt, tone="professional + engaging", model=None):
    """Generates an optimized LinkedIn post based on user achievements, projects, or resume text.
    
    Args:
        content_prompt (str): Core details about the project/achievement.
        tone (str): Post tone (e.g. professional, enthusiastic, storytelling).
        model (str, optional): Ollama model name.
        
    Returns:
        dict: A structured dictionary of LinkedIn post components.
    """
    system_prompt = (
        "You are an expert LinkedIn copywriter and career brand strategist. "
        "Your task is to turn raw achievements, projects, or experience descriptions into viral, "
        "highly engaging LinkedIn posts that build authority. "
        "You MUST return your response as a valid JSON object matching the exact structure requested, with NO other text."
    )
    
    prompt = (
        f"Create a LinkedIn post based on the following details. "
        f"Structure it to have an attention-grabbing Hook, a readable Body (using line breaks and emojis), "
        f"a metric-driven or result-oriented Impact section, and a list of hashtags.\n\n"
        f"Tone: {tone}\n"
        f"Details: {content_prompt}\n\n"
        f"You must output a JSON object with this exact structure:\n"
        f"{{\n"
        f"  \"hook\": \"A 1-2 sentence hook to stop the scroll. Make it punchy.\",\n"
        f"  \"body\": \"The core story, explanation, or context of the achievement. Use bullet points and paragraphs for readability.\",\n"
        f"  \"impact\": \"The key takeaway or metric-based impact of this project/achievement.\",\n"
        f"  \"hashtags\": [\"#FirstHashtag\", \"#SecondHashtag\"]\n"
        f"}}\n"
        f"Ensure all keys are enclosed in double quotes. Do not include markdown code block styling like ```json in the output itself."
    )
    
    success, response_text = query_ollama(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        response_json=True,
        temperature=0.7
    )
    
    if not success:
        return {
            "success": False,
            "error": f"Ollama failed to process request: {response_text}"
        }
        
    # Attempt to parse the JSON output
    cleaned_response = response_text.strip()
    # Strip markdown code fences if LLM added them despite instructions
    if cleaned_response.startswith("```"):
        cleaned_response = re.sub(r"^```(?:json)?\n", "", cleaned_response)
        cleaned_response = re.sub(r"\n```$", "", cleaned_response)
        cleaned_response = cleaned_response.strip()
        
    try:
        data = json.loads(cleaned_response)
        data["success"] = True
        return data
    except Exception as e:
        return _parse_linkedin_fallback(cleaned_response, e)

def _parse_linkedin_fallback(text, original_exception):
    """Fallback helper when JSON parsing fails. Separates standard markdown headers."""
    result = {
        "success": True,
        "hook": "",
        "body": text,
        "impact": "",
        "hashtags": [],
        "parse_error": str(original_exception)
    }
    
    # Try separating the sections if the model returned them as clear blocks
    hook_match = re.search(r'(?:Hook|HOOK)[:\-]?\s*(.*?)(?=\n\n|\n(?:Body|BODY|Impact|IMPACT|Hashtags|HASHTAGS)|$)', text, re.DOTALL | re.IGNORECASE)
    body_match = re.search(r'(?:Body|BODY)[:\-]?\s*(.*?)(?=\n\n|\n(?:Impact|IMPACT|Hashtags|HASHTAGS)|$)', text, re.DOTALL | re.IGNORECASE)
    impact_match = re.search(r'(?:Impact|IMPACT)[:\-]?\s*(.*?)(?=\n\n|\n(?:Hashtags|HASHTAGS)|$)', text, re.DOTALL | re.IGNORECASE)
    hashtags_match = re.search(r'(?:Hashtags|HASHTAGS)[:\-]?\s*(.*)', text, re.DOTALL | re.IGNORECASE)
    
    if hook_match:
        result["hook"] = hook_match.group(1).strip()
    if body_match:
        result["body"] = body_match.group(1).strip()
    if impact_match:
        result["impact"] = impact_match.group(1).strip()
        
    # Extract hashtags using regex
    hashtags = re.findall(r'#\w+', text)
    if hashtags:
        result["hashtags"] = list(set(hashtags))
        
    return result
