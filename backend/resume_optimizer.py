import json
import re
from ollama_client import query_ollama

def optimize_resume(resume_text, job_description="", model=None):
    """Optimizes a resume against a target job description using the local Ollama LLM.
    
    Args:
        resume_text (str): Raw resume text.
        job_description (str, optional): Target job description text.
        model (str, optional): Ollama model name.
        
    Returns:
        dict: A structured dictionary of optimization results.
    """
    system_prompt = (
        "You are a professional Resume Coach and ATS (Applicant Tracking System) Expert. "
        "Your task is to analyze resumes, identify keyword matches, rewrite bullet points for impact "
        "(using action verbs and metric structures), score the resume's match for the job, and list missing skills. "
        "You MUST return your response as a valid JSON object matching the exact structure requested, with NO other text."
    )
    
    prompt = (
        f"Analyze this Resume and optional Job Description. Match keywords, calculate an ATS score, "
        f"rewrite at least 3-4 bullet points for higher impact, and identify skill gaps.\n\n"
        f"--- RESUME ---\n{resume_text}\n\n"
        f"--- JOB DESCRIPTION ---\n{job_description if job_description else 'General ATS Optimization'}\n\n"
        f"You must output a JSON object with this exact structure:\n"
        f"{{\n"
        f"  \"ats_score\": 75,  // an integer between 0 and 100 representing job match or general quality\n"
        f"  \"keyword_suggestions\": [\"list\", \"of\", \"suggested\", \"keywords\", \"to\", \"incorporate\"],\n"
        f"  \"bullet_rewriting\": [\n"
        f"    {{\"original\": \"original bullet point from resume\", \"improved\": \"optimized version with action verbs and metrics\"}}\n"
        f"  ],\n"
        f"  \"missing_skills\": [\"list\", \"of\", \"skills\", \"present\", \"in\", \"job\", \"desc\", \"but\", \"missing\", \"in\", \"resume\"],\n"
        f"  \"suggestions\": [\"general\", \"formatting\", \"or\", \"content\", \"suggestions\"],\n"
        f"  \"improved_resume\": \"A concise markdown list of ONLY the updated/modified sections of the resume (e.g. Summary, updated Experience bullets). Do not rewrite unchanged sections to save processing time.\"\n"
        f"}}\n"
        f"Ensure all keys are enclosed in double quotes. Do not include markdown code block styling like ```json in the output itself."
    )
    
    success, response_text = query_ollama(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        response_json=True,
        temperature=0.3
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
        # Fallback parsing/regex if LLM returned invalid JSON but has structured parts
        # Let's log the error and try to build a basic fallback structure
        return _parse_resume_fallback(cleaned_response, e)

def _parse_resume_fallback(text, original_exception):
    """Fallback helper when JSON parsing fails. Extracts key insights from the text response."""
    result = {
        "success": True,
        "ats_score": 60,
        "keyword_suggestions": [],
        "bullet_rewriting": [],
        "missing_skills": [],
        "suggestions": ["Could not parse structured JSON. Displaying raw output instead."],
        "improved_resume": text,
        "parse_error": str(original_exception)
    }
    
    # Try simple regex extractions
    score_match = re.search(r'"ats_score"\s*:\s*(\d+)', text)
    if score_match:
        result["ats_score"] = int(score_match.group(1))
        
    # Extract list patterns for keywords
    keywords_match = re.search(r'"keyword_suggestions"\s*:\s*\[(.*?)\]', text, re.DOTALL)
    if keywords_match:
        items = re.findall(r'"([^"]+)"', keywords_match.group(1))
        result["keyword_suggestions"] = items
        
    # Extract missing skills
    skills_match = re.search(r'"missing_skills"\s*:\s*\[(.*?)\]', text, re.DOTALL)
    if skills_match:
        items = re.findall(r'"([^"]+)"', skills_match.group(1))
        result["missing_skills"] = items
        
    return result
