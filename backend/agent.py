import json
import re
import streamlit as st
import tools
import memory_db
from ollama_client import query_ollama

INTENT_SYSTEM_PROMPT = """You are an Intent Classifier and Decision Agent for a multi-purpose local AI Assistant.
For every user input, you must detect the intent, select the appropriate response mode, and decide if a tool should be executed.

Response modes available:
- CHAT: General conversational questions, advice, brainstorming, greeting, standard QA.
- DOCUMENT: QA/summarization on TXT or PDF documents (excluding resumes and CSVs).
- DATA: Analytical questions on CSV data.
- RESUME: ATS scoring, keyword check, bullet rewriting, skill-gap analysis.
- LINKEDIN: Generating professional LinkedIn posts from achievements/projects.
- TOOL: Direct tool queries (e.g. direct calculations, direct memory commands).

Tools available:
- calculator (args: {"expression": "math expression to evaluate"})
- read_file (args: {"file": "absolute or relative path of TXT/PDF file"})
- summarize_text (args: {"text": "text content to summarize"})
- analyze_csv (args: {"file": "absolute or relative path of CSV file"})
- store_memory (args: {"key": "memory key name", "value": "memory value"})
- get_memory (args: {"key": "memory key to retrieve"})
- none

Priority Rules:
- If query mentions reading/opening a file (excluding CSVs), use read_file.
- If query mentions analyzing, importing, or showing a CSV dataset, use analyze_csv.
- If query mentions optimizing a resume or job keywords/match, select RESUME mode.
- If query asks to write or format a LinkedIn post, select LINKEDIN mode.
- If query asks to evaluate a math expression (e.g. 5+10*2), use calculator.
- If user wants you to remember details (e.g. "Remember that my name is Jack" or "save my name as Jack"), use store_memory.
- If user asks what you remember or asks for a saved preference (e.g. "what is my name?"), use get_memory.

You MUST respond ONLY with a valid JSON block of this structure:
{
  "mode": "CHAT" | "DOCUMENT" | "DATA" | "RESUME" | "LINKEDIN" | "TOOL",
  "tool_required": true | false,
  "tool_name": "calculator" | "read_file" | "summarize_text" | "analyze_csv" | "store_memory" | "get_memory" | "none",
  "tool_args": {
    "expression": "",
    "file": "",
    "text": "",
    "key": "",
    "value": ""
  },
  "reasoning": "brief step-by-step reasoning"
}
Ensure all keys are double-quoted. Do not include markdown code fences (like ```json) in the response."""

def run_intent_classifier(user_input, model=None):
    """Classifies user intent and returns tool execution instructions."""
    success, result = query_ollama(
        prompt=f"Classify this input:\n\n{user_input}",
        system_prompt=INTENT_SYSTEM_PROMPT,
        model=model,
        response_json=True,
        temperature=0.0
    )
    
    if not success:
        return {
            "mode": "CHAT",
            "tool_required": False,
            "tool_name": "none",
            "tool_args": {},
            "reasoning": f"Failed to connect to Ollama. Defaulting to CHAT mode. Error: {result}"
        }
        
    cleaned = result.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
        cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()
        
    try:
        data = json.loads(cleaned)
        return data
    except Exception as e:
        # Robust regex-based fallback classifier
        return _fallback_intent_classifier(user_input, e)

def _fallback_intent_classifier(user_input, err):
    """Regex fallback for intent classification if JSON parsing fails."""
    lower_input = user_input.lower()
    mode = "CHAT"
    tool_required = False
    tool_name = "none"
    tool_args = {}
    
    # Check for direct calculation
    math_chars = set("0123456789+-*/()^% ")
    if all(c in math_chars for c in lower_input) or ("calc" in lower_input or "evaluate" in lower_input):
        mode = "TOOL"
        tool_required = True
        tool_name = "calculator"
        tool_args["expression"] = re.sub(r'[a-zA-Z\s]', '', user_input)
    # Check for resume
    elif any(x in lower_input for x in ["resume", "cv", "ats", "job description", "job ad"]):
        mode = "RESUME"
    # Check for linkedin
    elif any(x in lower_input for x in ["linkedin", "linkedin post", "hashtag", "post hook"]):
        mode = "LINKEDIN"
    # Check for csv
    elif "csv" in lower_input or "dataset" in lower_input:
        mode = "DATA"
        if "analyze" in lower_input or "load" in lower_input:
            tool_required = True
            tool_name = "analyze_csv"
            # Attempt to extract path
            file_match = re.search(r'[\w\/\.\:]+\.csv', user_input)
            tool_args["file"] = file_match.group(0) if file_match else ""
    # Check for memory storage
    elif any(x in lower_input for x in ["remember", "save my", "store my"]):
        mode = "TOOL"
        tool_required = True
        tool_name = "store_memory"
        # Try to guess key/value
        tool_args["key"] = "user_preference"
        tool_args["value"] = user_input
    # Check for memory retrieval
    elif any(x in lower_input for x in ["what is my", "what do you remember", "get my"]):
        mode = "TOOL"
        tool_required = True
        tool_name = "get_memory"
        tool_args["key"] = "user_preference"
        
    return {
        "mode": mode,
        "tool_required": tool_required,
        "tool_name": tool_name,
        "tool_args": tool_args,
        "reasoning": f"Fallback applied due to JSON parse error ({str(err)})."
    }

def execute_agent_cycle(user_input, username, model=None, chat_history=None):
    """Executes the complete Intent-First Execution cycle for a user query.
    
    1. Detect intent and response mode.
    2. Retrieve relevant memory database context.
    3. Execute tools if required.
    4. Call Ollama with compiled context to get final structured answer.
    """
    if chat_history is None:
        chat_history = []
        
    # Step 1: Detect intent
    intent = run_intent_classifier(user_input, model=model)
    
    # Step 2: Retrieve user memories for context
    user_memories = memory_db.list_memories(username)
    memory_context = ""
    if user_memories:
        memory_context = "Stored User Preferences (Memories):\n"
        for k, v in user_memories.items():
            memory_context += f"- {k}: {v}\n"
            
    tool_executed_msg = None
    tool_output = None
    
    # Step 3: Tool execution if required
    if intent.get("tool_required"):
        t_name = intent.get("tool_name")
        t_args = intent.get("tool_args", {})
        
        if t_name == "calculator" and t_args.get("expression"):
            tool_executed_msg = f"Executing Tool: calculator(expression='{t_args.get('expression')}')"
            tool_output = tools.calculator(t_args.get("expression"))
            
        elif t_name == "read_file" and t_args.get("file"):
            tool_executed_msg = f"Executing Tool: read_file(file='{t_args.get('file')}')"
            tool_output = tools.read_file(t_args.get("file"))
            
        elif t_name == "summarize_text" and t_args.get("text"):
            tool_executed_msg = f"Executing Tool: summarize_text(length={len(t_args.get('text'))} chars)"
            tool_output = tools.summarize_text(t_args.get("text"), model=model)
            
        elif t_name == "analyze_csv" and t_args.get("file"):
            tool_executed_msg = f"Executing Tool: analyze_csv(file='{t_args.get('file')}')"
            tool_output = tools.analyze_csv(t_args.get("file"))
            
        elif t_name == "store_memory" and t_args.get("key") and t_args.get("value"):
            # If key-value were specified, we store them.
            # We can also let the LLM extract the key and value from user input.
            key = t_args.get("key")
            value = t_args.get("value")
            # If key is user_preference or too generic, try to clean it
            tool_executed_msg = f"Executing Tool: store_memory(key='{key}', value='{value}')"
            tool_output = tools.store_memory(username, key, value)
            
        elif t_name == "get_memory" and t_args.get("key"):
            key = t_args.get("key")
            tool_executed_msg = f"Executing Tool: get_memory(key='{key}')"
            tool_output = tools.get_memory(username, key)
            
    # Step 4: Core response generation based on detected mode
    final_prompt = ""
    system_instruction = (
        "You are an intelligent, friendly, and structured local AI assistant. "
        "Format your answer beautifully using markdown. Keep your writing clear and professional. "
    )
    
    # Add memory context to system instruction if available
    if memory_context:
        system_instruction += f"\nAlways be mindful of this user context:\n{memory_context}\n"
        
    # Append past chat history
    history_context = ""
    if chat_history:
        history_context = "Recent conversation history:\n"
        for role, text in chat_history[-5:]: # Keep last 5 exchanges
            history_context += f"- {role.capitalize()}: {text}\n"
            
    if intent["mode"] == "CHAT":
        final_prompt = (
            f"{history_context}\n"
            f"User input: {user_input}\n"
        )
        if tool_output:
            final_prompt += f"\nTool results: {tool_output}\n"
            
    elif intent["mode"] == "TOOL":
        # Direct tool output presentation
        system_instruction += " Present the tool outcome clearly to the user. Do not explain technical details unless asked."
        final_prompt = (
            f"User requested a tool action: {user_input}\n"
            f"Tool Output: {tool_output}\n"
        )
        
    elif intent["mode"] == "DOCUMENT":
        system_instruction += " You are an expert document analyzer. Base your answers strictly on the file contents provided."
        final_prompt = (
            f"The user wants to analyze document information.\n"
            f"User Prompt: {user_input}\n"
        )
        if tool_output:
            final_prompt += f"\nDocument Content:\n{tool_output}\n"
            
    elif intent["mode"] == "DATA":
        system_instruction += " You are a senior data analyst. Explain statistics, column correlations, and patterns clearly."
        final_prompt = (
            f"The user is asking questions about a CSV dataset.\n"
            f"User Question: {user_input}\n"
        )
        if tool_output:
            final_prompt += f"\nDataset Summary:\n{tool_output}\n"
            
    elif intent["mode"] == "RESUME":
        system_instruction += " Guide the user through resume ATS score optimization. Break down keywords and missing skills."
        final_prompt = (
            f"The user has resume/career questions:\n{user_input}\n"
        )
        if tool_output:
            final_prompt += f"\nRelated file content:\n{tool_output}\n"
            
    elif intent["mode"] == "LINKEDIN":
        system_instruction += " Help the user write or edit a compelling professional LinkedIn post."
        final_prompt = (
            f"The user is draft/posting on LinkedIn:\n{user_input}\n"
        )
        
    # Generate final answer from Ollama
    success, response_answer = query_ollama(
        prompt=final_prompt,
        system_prompt=system_instruction,
        model=model,
        temperature=0.7
    )
    
    if not success:
        response_answer = f"Error: Could not retrieve final response. Details: {response_answer}"
        
    return {
        "intent": intent,
        "tool_executed": tool_executed_msg,
        "tool_output": tool_output,
        "response": response_answer
    }
