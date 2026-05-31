import streamlit as st
import os
import pandas as pd
from datetime import datetime

# Initialize backends
import auth
import memory_db
import ollama_client
import tools
import resume_optimizer
import linkedin_generator
import agent

# Configure page metadata
st.set_page_config(
    page_title="AgentFlow | Local AI Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Elegant Styling (Aesthetic override)
st.markdown("""
<style>
    /* Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Outfit', sans-serif;
        color: #1e293b;
        font-weight: 600;
    }

    /* Elegant Dashboard Cards */
    .dashboard-card {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        border: 1px solid #f1f5f9;
        margin-bottom: 20px;
    }
    
    .card-title {
        font-size: 0.875rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 8px;
    }
    
    .card-val {
        font-size: 1.875rem;
        font-weight: 700;
        color: #0f172a;
    }
    
    /* Clean chat interface tweaks */
    .stChatMessage {
        border-radius: 12px !important;
        margin-bottom: 12px !important;
        padding: 16px !important;
    }
    
    .stChatMessage[data-testid="stChatMessageUser"] {
        background-color: #f8fafc !important;
        border: 1px solid #f1f5f9 !important;
    }

    .stChatMessage[data-testid="stChatMessageAssistant"] {
        background-color: #f1f5f9 !important;
        border: 1px solid #e2e8f0 !important;
    }

    /* Style the sidebar */
    .css-1d391kg {
        background-color: #0f172a !important;
    }
    
    /* Nice metric displays */
    .ats-score-container {
        text-align: center;
        background: #f8fafc;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
    }
    
    .ats-val {
        font-size: 3rem;
        font-weight: 800;
        color: #4f46e5;
    }
    
    .ats-label {
        font-size: 0.875rem;
        color: #475569;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SESSION AUTH CHECK -----------------
if "authenticated" not in st.session_state or not st.session_state["authenticated"]:
    auth.show_auth_page()
    st.stop()

# ----------------- SESSION STATE INITS -----------------
username = st.session_state["username"]

if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

if "active_page" not in st.session_state:
    st.session_state["active_page"] = "Dashboard"

if "selected_model" not in st.session_state:
    # Set default model preference
    installed_models = ollama_client.get_installed_models()
    if installed_models:
        st.session_state["selected_model"] = installed_models[0]
    else:
        st.session_state["selected_model"] = "llama3"

# Initialize databases
auth.init_auth_db()
memory_db.init_memory_db()

# Log activity helper
def log_activity(action_name):
    if "activities" not in st.session_state:
        st.session_state["activities"] = []
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state["activities"].insert(0, {"time": timestamp, "action": action_name})
    if len(st.session_state["activities"]) > 10:
        st.session_state["activities"].pop()

# ----------------- SIDEBAR NAVIGATION -----------------
with st.sidebar:
    st.title("🤖 AgentFlow")
    st.caption(f"Logged in as: **{username.capitalize()}**")
    
    st.markdown("---")
    
    # Navigation menu
    pages = {
        "Dashboard": "🏠 Dashboard",
        "Chat Agent": "💬 Chat Agent",
        "Doc Intelligence": "📄 Document Intelligence",
        "Data Analysis": "📊 Data Analysis",
        "Resume Optimizer": "📄 Resume Optimizer",
        "LinkedIn Generator": "🔗 LinkedIn Generator",
        "Tools Sandbox": "🧰 Tools & Utilities",
        "Memory Bank": "🧠 User Memory Bank",
        "Settings": "⚙️ System Settings"
    }
    
    for page_key, page_label in pages.items():
        if st.sidebar.button(page_label, use_container_width=True, key=f"nav_{page_key}"):
            st.session_state["active_page"] = page_key
            
    st.markdown("---")
    
    # Quick Ollama status indicators
    st.subheader("Ollama Status")
    models = ollama_client.get_installed_models()
    if models:
        st.success("Ollama: Connected")
        selected = st.selectbox("Active Model", models, index=models.index(st.session_state["selected_model"]) if st.session_state["selected_model"] in models else 0)
        if selected != st.session_state["selected_model"]:
            st.session_state["selected_model"] = selected
            log_activity(f"Changed LLM model to {selected}")
            st.rerun()
    else:
        st.error("Ollama: Offline")
        st.info("Start Ollama desktop app locally to enable features.")
        
    st.markdown("---")
    if st.button("Log Out", use_container_width=True, type="secondary"):
        st.session_state["authenticated"] = False
        st.session_state["username"] = None
        st.session_state["chat_history"] = []
        st.rerun()

# ----------------- ROUTING LOGIC -----------------
active_page = st.session_state["active_page"]

# ==================== PAGE: DASHBOARD ====================
if active_page == "Dashboard":
    st.title("🏠 Dashboard")
    st.markdown("Welcome back to your local AI Assistant workstation. Access your tasks and review analytics below.")
    
    # 3-column stats grid
    col1, col2, col3 = st.columns(3)
    
    memories_count = len(memory_db.list_memories(username))
    chat_exchanges = len(st.session_state["chat_history"])
    
    with col1:
        st.markdown(f"""
        <div class="dashboard-card">
            <div class="card-title">Stored Memories</div>
            <div class="card-val">{memories_count} items</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown(f"""
        <div class="dashboard-card">
            <div class="card-title">Chat History</div>
            <div class="card-val">{chat_exchanges} messages</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col3:
        st.markdown(f"""
        <div class="dashboard-card">
            <div class="card-title">Active Model</div>
            <div class="card-val">{st.session_state["selected_model"]}</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Content rows
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.subheader("🚀 Quick Workflows")
        
        # Grid of navigation shortcuts
        sc1, sc2 = st.columns(2)
        with sc1:
            if st.button("💬 Start new Chat Session", use_container_width=True):
                st.session_state["active_page"] = "Chat Agent"
                st.rerun()
            if st.button("📄 Parse PDF Document", use_container_width=True):
                st.session_state["active_page"] = "Doc Intelligence"
                st.rerun()
            if st.button("📄 Optimize ATS Resume", use_container_width=True):
                st.session_state["active_page"] = "Resume Optimizer"
                st.rerun()
        with sc2:
            if st.button("📊 Upload CSV Dataset", use_container_width=True):
                st.session_state["active_page"] = "Data Analysis"
                st.rerun()
            if st.button("🔗 Generate LinkedIn Post", use_container_width=True):
                st.session_state["active_page"] = "LinkedIn Generator"
                st.rerun()
            if st.button("🧠 View Stored Preferences", use_container_width=True):
                st.session_state["active_page"] = "Memory Bank"
                st.rerun()
                
    with col_right:
        st.subheader("🕒 Recent Activity")
        if "activities" in st.session_state and st.session_state["activities"]:
            for act in st.session_state["activities"]:
                st.markdown(f"**{act['time']}** - {act['action']}")
        else:
            st.caption("No operations recorded in this session yet.")

# ==================== PAGE: CHAT AGENT ====================
elif active_page == "Chat Agent":
    st.title("💬 Chat Agent")
    st.markdown("Conversational AI interface with built-in intent-first action execution.")
    
    # Clear conversation button
    if st.button("🧹 Clear Chat History", type="secondary"):
        st.session_state["chat_history"] = []
        log_activity("Cleared chat history")
        st.rerun()
        
    # Render chat messages
    for speaker, text in st.session_state["chat_history"]:
        with st.chat_message("user" if speaker == "user" else "assistant"):
            st.markdown(text)
            
    # Input area
    user_query = st.chat_input("Ask a question, ask to evaluate math, read a file, or save memories...")
    
    if user_query:
        # Display user message instantly
        with st.chat_message("user"):
            st.markdown(user_query)
            
        # Store in history
        st.session_state["chat_history"].append(("user", user_query))
        
        # Execute agent cycle
        with st.spinner("Analyzing intent and formulating response..."):
            agent_result = agent.execute_agent_cycle(
                user_input=user_query,
                username=username,
                model=st.session_state["selected_model"],
                chat_history=st.session_state["chat_history"][:-1]
            )
            
        # Extract results
        intent = agent_result.get("intent", {})
        tool_executed = agent_result.get("tool_executed")
        tool_output = agent_result.get("tool_output")
        response_text = agent_result.get("response", "")
        
        # Show assistant response
        with st.chat_message("assistant"):
            # Inform about tool activations in a clean sub-block
            if tool_executed:
                with st.expander(f"🛠️ Tool Invoked: {intent.get('tool_name')}", expanded=False):
                    st.info(tool_executed)
                    if tool_output:
                        st.text_area("Tool Execution Result", tool_output, height=150)
            
            # Show intent classification reasoning
            with st.expander("👁️ Intent Inspector", expanded=False):
                st.json(intent)
                
            st.markdown(response_text)
            
        # Store response in history
        st.session_state["chat_history"].append(("assistant", response_text))
        log_activity(f"Chat exchange: '{user_query[:30]}...' -> mode: {intent.get('mode')}")

# ==================== PAGE: DOCUMENT INTELLIGENCE ====================
elif active_page == "Doc Intelligence":
    st.title("📄 Document Intelligence")
    st.markdown("Upload documents (PDF or TXT) to get summaries and run Q&A inquiries.")
    
    uploaded_file = st.file_uploader("Upload a document", type=["txt", "pdf"])
    
    if uploaded_file:
        # Save temp file
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scratch")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, uploaded_file.name)
        
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
            
        st.success(f"File uploaded successfully! Loaded to: `{uploaded_file.name}`")
        log_activity(f"Uploaded file '{uploaded_file.name}'")
        
        # Two-column layout
        c_left, c_right = st.columns([1, 1])
        
        # Read text content
        with st.spinner("Extracting content..."):
            extracted_text = tools.read_file(temp_path)
            
        with c_left:
            st.subheader("📝 Automatic Summary")
            with st.spinner("Summarizing..."):
                summary = tools.summarize_text(extracted_text, model=st.session_state["selected_model"])
                st.markdown(summary)
                
        with c_right:
            st.subheader("❓ Ask Questions")
            q_input = st.text_input("Ask a question about this document:")
            if st.button("Query Document"):
                if q_input:
                    with st.spinner("Analyzing document content..."):
                        # Synthesize prompt with context
                        prompt = (
                            f"Use the document text below to answer the question: {q_input}\n\n"
                            f"--- DOCUMENT CONTENT ---\n{extracted_text[:12000]}"
                        )
                        success, answer = ollama_client.query_ollama(
                            prompt=prompt,
                            system_prompt="You are a document analyzer. Help the user answer questions based strictly on the content provided.",
                            model=st.session_state["selected_model"]
                        )
                        if success:
                            st.write(answer)
                        else:
                            st.error(answer)

# ==================== PAGE: DATA ANALYSIS ====================
elif active_page == "Data Analysis":
    st.title("📊 Data Analysis")
    st.markdown("Upload any CSV dataset to compute standard metrics and query statistics.")
    
    uploaded_csv = st.file_uploader("Upload a CSV file", type=["csv"])
    
    if uploaded_csv:
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scratch")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, uploaded_csv.name)
        
        with open(temp_path, "wb") as f:
            f.write(uploaded_csv.getbuffer())
            
        st.success(f"CSV uploaded successfully: `{uploaded_csv.name}`")
        log_activity(f"Uploaded CSV '{uploaded_csv.name}'")
        
        # Load and Preview
        df = pd.read_csv(temp_path)
        
        st.subheader("📋 Dataset Preview")
        st.dataframe(df.head(5))
        
        col_st1, col_st2 = st.columns(2)
        with col_st1:
            st.subheader("ℹ️ Metadata & Shape")
            st.write(f"- Rows: **{df.shape[0]}**")
            st.write(f"- Columns: **{df.shape[1]}**")
            st.write(f"- Columns names: {', '.join(df.columns)}")
            
        with col_st2:
            st.subheader("❓ Direct Statistics Query")
            df_desc = tools.analyze_csv(temp_path)
            with st.expander("View pandas analytical statistics summary"):
                st.text(df_desc)
                
        # LLM CSV QA
        st.subheader("💡 AI Insights Analyst")
        csv_q = st.text_input("Ask a question about trends, summaries, or columns in this CSV:")
        if st.button("Generate Analytical Insights"):
            if csv_q:
                with st.spinner("Processing analytical query..."):
                    prompt = (
                        f"Analyze the dataset overview and answer the user question: {csv_q}\n\n"
                        f"--- DATASET STATISTICAL OVERVIEW ---\n{df_desc}"
                    )
                    success, answer = ollama_client.query_ollama(
                        prompt=prompt,
                        system_prompt="You are a data analyst. Review statistics and make insights.",
                        model=st.session_state["selected_model"]
                    )
                    if success:
                        st.info("Answer:")
                        st.write(answer)
                    else:
                        st.error(answer)

# ==================== PAGE: RESUME OPTIMIZER ====================
elif active_page == "Resume Optimizer":
    st.title("📄 Resume Optimizer")
    st.markdown("Upload/paste your resume and paste the job description to find missing skills and rewrite bullets.")
    
    r_left, r_right = st.columns([1, 1])
    
    with r_left:
        st.subheader("📥 Inputs")
        resume_input = st.text_area("Paste Resume Text here:", height=250)
        job_input = st.text_area("Paste Target Job Description here:", height=150)
        
        run_opt = st.button("Start ATS Optimization Analysis", type="primary")
        
    with r_right:
        st.subheader("📊 Optimization Outcome")
        if run_opt:
            if not resume_input:
                st.error("Please enter your resume content first.")
            else:
                with st.spinner("Analyzing resume matching patterns via local LLM..."):
                    result = resume_optimizer.optimize_resume(
                        resume_text=resume_input,
                        job_description=job_input,
                        model=st.session_state["selected_model"]
                    )
                    
                if result.get("success"):
                    log_activity("Analyzed ATS Resume Optimization")
                    # Score Circle
                    score = result.get("ats_score", 0)
                    st.markdown(f"""
                        <div class="ats-score-container">
                            <div class="ats-val">{score}%</div>
                            <div class="ats-label">ATS MATCH SCORE</div>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    st.markdown("---")
                    
                    # Suggestions and missing skills
                    tab_skills, tab_bullets, tab_improved = st.tabs([
                        "Missing Skills & Keywords", 
                        "Bullet Point Rewrites", 
                        "Full Improved Resume"
                    ])
                    
                    with tab_skills:
                        st.subheader("Missing Skills")
                        skills = result.get("missing_skills", [])
                        if skills:
                            for sk in skills:
                                st.markdown(f"- 🔴 **{sk}**")
                        else:
                            st.write("No major skill gaps identified.")
                            
                        st.subheader("Recommended Keywords")
                        keywords = result.get("keyword_suggestions", [])
                        if keywords:
                            st.write(", ".join([f"`{kw}`" for kw in keywords]))
                        else:
                            st.write("None.")
                            
                    with tab_bullets:
                        st.subheader("Impact-Driven Bullet Rewrites")
                        bullets = result.get("bullet_rewriting", [])
                        if bullets:
                            for bl in bullets:
                                st.markdown("##### Original:")
                                st.warning(bl.get("original", ""))
                                st.markdown("##### Optimized:")
                                st.success(bl.get("improved", ""))
                                st.markdown("---")
                        else:
                            st.write("No specific bullet point revisions suggested.")
                            
                    with tab_improved:
                        st.subheader("Improved Resume Preview (Markdown)")
                        imp_res = result.get("improved_resume", "")
                        st.markdown(imp_res)
                else:
                    st.error(result.get("error", "Error analyzing resume."))
        else:
            st.info("Input your resume and target job details, then click analyze.")

# ==================== PAGE: LINKEDIN GENERATOR ====================
elif active_page == "LinkedIn Generator":
    st.title("🔗 LinkedIn Post Generator")
    st.markdown("Convert achievements, resume pieces, or project descriptions into structured, scroll-stopping posts.")
    
    col_in, col_out = st.columns([1, 1])
    
    with col_in:
        st.subheader("✍️ Inputs")
        proj_input = st.text_area("Describe the project, accomplishment, or milestones achieved:", height=200)
        tone_sel = st.selectbox("Select Target Tone:", [
            "professional + engaging (Recommended)",
            "casual & humorous",
            "highly technical & authoritative",
            "storyteller / build in public",
            "excited & celebratory"
        ])
        
        run_gen = st.button("Generate LinkedIn Post", type="primary")
        
    with col_out:
        st.subheader("📱 Draft Post Preview")
        if run_gen:
            if not proj_input:
                st.error("Please enter project details first.")
            else:
                with st.spinner("Composing LinkedIn copy..."):
                    result = linkedin_generator.generate_linkedin_post(
                        content_prompt=proj_input,
                        tone=tone_sel,
                        model=st.session_state["selected_model"]
                    )
                    
                if result.get("success"):
                    log_activity("Generated LinkedIn Post")
                    # Structure output preview
                    hook = result.get("hook", "")
                    body = result.get("body", "")
                    impact = result.get("impact", "")
                    hashtags = " ".join(result.get("hashtags", []))
                    
                    full_post = f"{hook}\n\n{body}\n\n⚡ Impact:\n{impact}\n\n{hashtags}"
                    
                    st.info("💡 Copy the generated text below:")
                    st.text_area("Compiled Post Content", full_post, height=350)
                    
                    # Individual breakdown
                    with st.expander("Slight Breakdown of Structure", expanded=False):
                        st.markdown(f"**Hook (Scroll Stopper):**\n*{hook}*")
                        st.markdown(f"**Body Story:**\n{body}")
                        st.markdown(f"**Impact Summary:**\n*{impact}*")
                        st.markdown(f"**Hashtags:** {hashtags}")
                else:
                    st.error(result.get("error", "Error creating post."))
        else:
            st.info("Describe your accomplishments on the left to draft a post.")

# ==================== PAGE: TOOLS SANDBOX ====================
elif active_page == "Tools Sandbox":
    st.title("🧰 Tools & Utilities Sandbox")
    st.markdown("Direct sandbox testing for developer-grade agent functions.")
    
    t_tabs = st.tabs(["Calculator", "File Reader", "Text Summarizer", "Memory Viewer"])
    
    with t_tabs[0]:
        st.subheader("Safe AST Calculator")
        expr = st.text_input("Enter mathematical expression (e.g. `2.5 * (40 / 3) + 7^2`):", value="2 * (3 + 4)")
        if st.button("Evaluate"):
            # Replace ^ with ** for python standard
            clean_expr = expr.replace("^", "**")
            ans = tools.calculator(clean_expr)
            st.success(ans)
            log_activity("Evaluated Calculator Expression")
            
    with t_tabs[1]:
        st.subheader("Direct File Reader")
        file_p = st.text_input("Enter absolute file path:")
        if st.button("Read File"):
            if file_p:
                with st.spinner("Reading..."):
                    res = tools.read_file(file_p)
                st.text_area("File Contents", res, height=300)
                log_activity(f"Read file '{os.path.basename(file_p)}'")
                
    with t_tabs[2]:
        st.subheader("Direct Summarizer")
        txt_p = st.text_area("Enter large block of text:", height=200)
        if st.button("Summarize"):
            if txt_p:
                with st.spinner("Summarizing..."):
                    res = tools.summarize_text(txt_p, model=st.session_state["selected_model"])
                st.markdown(res)
                log_activity("Summarized direct text input")
                
    with t_tabs[3]:
        st.subheader("Direct User Memory Viewer")
        user_mems = memory_db.list_memories(username)
        if user_mems:
            st.json(user_mems)
        else:
            st.info("No memories found for current user.")

# ==================== PAGE: MEMORY BANK ====================
elif active_page == "Memory Bank":
    st.title("🧠 User Memory Bank")
    st.markdown("Persistent preference memories which dynamically enrich assistant conversations.")
    
    # 2 Columns - table and edit form
    col_t, col_f = st.columns([2, 1])
    
    with col_f:
        st.subheader("➕ Add/Modify Memory")
        m_key = st.text_input("Memory Key (e.g. `user_name`, `language_preference`):").strip()
        m_val = st.text_area("Memory Value / Details (e.g. `John`, `Python`):").strip()
        
        if st.button("Save Memory"):
            if m_key and m_val:
                success, msg = memory_db.store_memory(username, m_key, m_val)
                if success:
                    st.success(msg)
                    log_activity(f"Saved memory key '{m_key}'")
                    st.rerun()
                else:
                    st.error(msg)
                    
    with col_t:
        st.subheader("📋 Active Memories")
        mems = memory_db.list_memories(username)
        
        if mems:
            # Render as standard table
            mem_df = pd.DataFrame(list(mems.items()), columns=["Memory Key", "Stored Preference"])
            st.dataframe(mem_df, use_container_width=True)
            
            # Delete options
            del_key = st.selectbox("Select key to delete:", list(mems.keys()))
            if st.button("Delete Selected Memory", type="secondary"):
                success, msg = memory_db.delete_memory(username, del_key)
                if success:
                    st.success(msg)
                    log_activity(f"Deleted memory key '{del_key}'")
                    st.rerun()
                else:
                    st.error(msg)
        else:
            st.info("Your memory profile is empty. Add entries on the right or type 'remember my job title is Developer' in Chat!")

# ==================== PAGE: SETTINGS ====================
elif active_page == "Settings":
    st.title("⚙️ System Settings")
    st.markdown("Configure local network credentials and settings for Ollama LLMs.")
    
    st.subheader("Ollama Connection Config")
    
    # Read/Write Ollama host
    if "ollama_host" not in st.session_state:
        st.session_state["ollama_host"] = ollama_client.DEFAULT_OLLAMA_HOST
        
    h_input = st.text_input("Ollama Server Endpoint Host URL:", value=st.session_state["ollama_host"])
    if st.button("Update Connection URL"):
        st.session_state["ollama_host"] = h_input
        log_activity(f"Updated Ollama server host to '{h_input}'")
        st.success("Ollama Endpoint Host Updated.")
        st.rerun()
        
    st.markdown("---")
    
    st.subheader("Troubleshooting Guides")
    st.write("""
    If Ollama shows **Offline** status in the sidebar:
    1. Ensure the Ollama Application is running on your desktop.
    2. Try executing `ollama serve` or opening the desktop app in windows taskbar.
    3. Test if the connection is working by browsing to the endpoint: [Ollama Localhost API](http://localhost:11434)
    4. To download a model, open PowerShell and type:
       ```powershell
       ollama pull llama3
       ```
    """)
