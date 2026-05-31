import os
import shutil
from typing import List, Tuple, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import local modules
import auth
import memory_db
import ollama_client
import tools
import resume_optimizer
import linkedin_generator
import agent

# Create scratch directory for temporary uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="AgentFlow REST API", version="1.0.0")

# Setup CORS for the Next.js frontend (default Next.js runs on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize databases
auth.init_auth_db()
memory_db.init_memory_db()

# --- PYDANTIC SCHEMAS ---

class AuthRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    query: str
    username: str
    chat_history: List[Tuple[str, str]] = []  # List of (role, message)
    model: Optional[str] = None

class DocQueryRequest(BaseModel):
    query: str
    document_text: str
    model: Optional[str] = None

class DataQueryRequest(BaseModel):
    query: str
    dataset_report: str
    model: Optional[str] = None

class ResumeOptimizeRequest(BaseModel):
    resume_text: str
    job_description: str = ""
    model: Optional[str] = None

class LinkedInRequest(BaseModel):
    content_prompt: str
    tone: str = "professional + engaging"
    model: Optional[str] = None

class MemoryStoreRequest(BaseModel):
    username: str
    key: str
    value: str

class SettingsConfigRequest(BaseModel):
    host: str

class CalculatorRequest(BaseModel):
    expression: str

class ReadFileRequest(BaseModel):
    filepath: str

class SummarizeRequest(BaseModel):
    text: str
    model: Optional[str] = None


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "AgentFlow REST API is fully operational"}

# Auth API
@app.post("/api/auth/register")
def api_register(payload: AuthRequest):
    success, msg = auth.register_user(payload.username, payload.password)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/auth/login")
def api_login(payload: AuthRequest):
    success, username_or_msg = auth.login_user(payload.username, payload.password)
    if not success:
        raise HTTPException(status_code=401, detail=username_or_msg)
    return {"success": True, "username": username_or_msg, "message": "Login successful"}

# Agent Chat API
@app.post("/api/agent/chat")
def api_agent_chat(payload: ChatRequest):
    try:
        # Override active model if specified in session state/payload
        if payload.model:
            import streamlit as st
            # Just set in ollama client if needed or pass down
            pass
            
        result = agent.execute_agent_cycle(
            user_input=payload.query,
            username=payload.username,
            model=payload.model,
            chat_history=payload.chat_history
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Document Intel API
@app.post("/api/doc/summarize")
async def api_doc_summarize(
    file: UploadFile = File(...),
    model: Optional[str] = Form(None)
):
    # Save uploaded file temporarily
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text and summarize
        text_content = tools.read_file(file_path)
        if text_content.startswith("File Error"):
            raise HTTPException(status_code=400, detail=text_content)
            
        summary = tools.summarize_text(text_content, model=model)
        
        return {
            "success": True,
            "filename": file.filename,
            "text": text_content,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/doc/query")
def api_doc_query(payload: DocQueryRequest):
    prompt = (
        f"Use the document text below to answer the question: {payload.query}\n\n"
        f"--- DOCUMENT CONTENT ---\n{payload.document_text[:12000]}"
    )
    success, answer = ollama_client.query_ollama(
        prompt=prompt,
        system_prompt="You are a document analyzer. Help the user answer questions based strictly on the content provided.",
        model=payload.model
    )
    if not success:
        raise HTTPException(status_code=500, detail=answer)
    return {"answer": answer}

# Data Analysis API
@app.post("/api/data/analyze")
async def api_data_analyze(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Perform pandas stats analysis
        stats_report = tools.analyze_csv(file_path)
        if stats_report.startswith("CSV Error"):
            raise HTTPException(status_code=400, detail=stats_report)
            
        import pandas as pd
        df = pd.read_csv(file_path)
        preview_rows = df.head(5).to_dict(orient="records")
        columns = list(df.columns)
        
        return {
            "success": True,
            "filename": file.filename,
            "report": stats_report,
            "columns": columns,
            "rows_count": df.shape[0],
            "columns_count": df.shape[1],
            "preview": preview_rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/data/query")
def api_data_query(payload: DataQueryRequest):
    prompt = (
        f"Analyze the dataset overview and answer the user question: {payload.query}\n\n"
        f"--- DATASET STATISTICAL OVERVIEW ---\n{payload.dataset_report}"
    )
    success, answer = ollama_client.query_ollama(
        prompt=prompt,
        system_prompt="You are a senior data analyst. Review statistics and make insights.",
        model=payload.model
    )
    if not success:
        raise HTTPException(status_code=500, detail=answer)
    return {"answer": answer}

# Resume Optimizer API
@app.post("/api/resume/upload")
async def api_resume_upload(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        text_content = tools.read_file(file_path)
        if text_content.startswith("File Error"):
            raise HTTPException(status_code=400, detail=text_content)
            
        return {
            "success": True,
            "filename": file.filename,
            "text": text_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/resume/optimize")
def api_resume_optimize(payload: ResumeOptimizeRequest):
    result = resume_optimizer.optimize_resume(
        resume_text=payload.resume_text,
        job_description=payload.job_description,
        model=payload.model
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to optimize resume"))
    return result

# LinkedIn Generator API
@app.post("/api/linkedin/generate")
def api_linkedin_generate(payload: LinkedInRequest):
    result = linkedin_generator.generate_linkedin_post(
        content_prompt=payload.content_prompt,
        tone=payload.tone,
        model=payload.model
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate LinkedIn post"))
    return result

# Memory DB API
@app.get("/api/memory")
def api_get_memories(username: str = Query(...)):
    memories = memory_db.list_memories(username)
    return {"memories": memories}

@app.post("/api/memory")
def api_store_memory(payload: MemoryStoreRequest):
    success, msg = memory_db.store_memory(payload.username, payload.key, payload.value)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.delete("/api/memory")
def api_delete_memory(username: str = Query(...), key: str = Query(...)):
    success, msg = memory_db.delete_memory(username, key)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

# Settings API
@app.get("/api/settings/models")
def api_get_models():
    models = ollama_client.get_installed_models()
    return {"models": models}

@app.get("/api/settings/status")
def api_get_status():
    import streamlit as st
    # Check current host config
    host = ollama_client.get_ollama_host()
    models = ollama_client.get_installed_models()
    return {
        "online": len(models) > 0,
        "host": host,
        "models": models
    }

@app.post("/api/settings/host")
def api_update_host(payload: SettingsConfigRequest):
    import streamlit as st
    # Set the host in session state equivalent or custom override
    st.session_state["ollama_host"] = payload.host
    return {"success": True, "message": f"Ollama host updated to {payload.host}"}

@app.post("/api/tools/calculator")
def api_calculator(payload: CalculatorRequest):
    result = tools.calculator(payload.expression)
    return {"result": result}

@app.post("/api/tools/read_file")
def api_read_file(payload: ReadFileRequest):
    result = tools.read_file(payload.filepath)
    return {"content": result}

@app.post("/api/tools/summarize")
def api_summarize(payload: SummarizeRequest):
    result = tools.summarize_text(payload.text, model=payload.model)
    return {"summary": result}

