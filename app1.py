import streamlit as st
from googletrans import Translator
from gtts import gTTS
import os
import requests
import base64
from PIL import Image
import io

# 1. Page Config
st.set_page_config(page_title="AI Crop Assistant", layout="wide", page_icon="🌾")

# Custom CSS for a clean "Hackathon" look
st.markdown("""
    <style>
    .main { background-color: #f5f7f9; }
    .stButton>button { width: 100%; border-radius: 20px; height: 3em; background-color: #2e7d32; color: white; }
    .stTextInput>div>div>input { border-radius: 10px; }
    .st-emotion-cache-1kyxreq { justify-content: center; }
    </style>
    """, unsafe_allow_html=True)

# Initialize Translator
@st.cache_resource
def get_translator():
    return Translator()

translator = get_translator()

# --- Sidebar ---
st.sidebar.header("⚙️ Configuration")
api_key = st.sidebar.text_input("Enter Google API Key", type="password", help="Get your API key from https://aistudio.google.com/")

language_map = {
    "English": "en",
    "Kannada": "kn",
    "Hindi": "hi",
    "Telugu": "te",
    "Tamil": "ta",
    "Malayalam": "ml",
    "Marathi": "mr",
    "Bengali": "bn"
}
selected_lang = st.sidebar.selectbox("🌐 Select Language", list(language_map.keys()))
lang_code = language_map[selected_lang]

# Title and Logo
col_title, col_logo = st.columns([4, 1])
with col_title:
    st.title("AI Crop Assistant 🌾")
    st.write("Empowering farmers with AI-driven crop diagnosis and solutions.")
with col_logo:
    st.markdown("### 🚜") # Fallback logo

st.markdown("---")

# Function to call Gemini API via requests
def call_gemini(api_key, prompt, image_file=None):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    headers = {'Content-Type': 'application/json'}
    
    if image_file:
        img_data = base64.b64encode(image_file.getvalue()).decode('utf-8')
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": image_file.type,
                            "data": img_data
                        }
                    }
                ]
            }]
        }
    else:
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()['candidates'][0]['content']['parts'][0]['text']
    else:
        raise Exception(f"API Error: {response.status_code} - {response.text}")

# --- Tabs ---
tab1, tab2, tab3, tab4 = st.tabs(["🔍 Crop Diagnosis", "💬 Ask the Expert", "📊 Market Prices", "🌱 Soil Health"])

with tab1:
    # 3. Layout: Two Columns
    col1, col2 = st.columns([1, 1], gap="large")

    with col1:
        st.header("📥 Input Section")
        
        # Image Upload
        uploaded_file = st.file_uploader("Upload Crop Photo", type=["jpg", "png", "jpeg"])
        if uploaded_file:
            st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)
        
        # Text Input
        problem_text = st.text_input("Describe the problem (optional)", placeholder="e.g., yellow spots on leaves")
        
        analyze_btn = st.button("🚀 Analyze Crop")

    with col2:
        st.header("🔍 Diagnosis & Solution")
        
        if analyze_btn:
            if not api_key:
                st.error("⚠️ Please enter your Google API Key in the sidebar.")
            elif not uploaded_file and not problem_text:
                st.error("⚠️ Please provide an image or describe the problem.")
            else:
                with st.spinner("Analyzing with AI... 🌱"):
                    try:
                        prompt = f"""
                        You are an expert agricultural plant pathologist. 
                        Analyze the following crop problem: {problem_text if problem_text else "Analyze the image for any diseases."}
                        Provide the response in the following format:
                        Disease: [Name of the disease or 'Healthy']
                        Cause: [Primary cause of the disease]
                        Organic Treatment: [Clear, actionable organic steps for the farmer]
                        Chemical Treatment: [Clear, actionable chemical steps for the farmer]
                        Confidence: [A percentage between 0-100]
                        """
                        
                        result_text = call_gemini(api_key, prompt, uploaded_file)
                        
                        # Simple parsing
                        disease = "Unknown"
                        cause = "Unknown"
                        organic_treatment = "No organic treatment specified."
                        chemical_treatment = "No chemical treatment specified."
                        confidence = "85%"
                        
                        for line in result_text.split('\n'):
                            if line.lower().startswith("disease:"):
                                disease = line.split(":", 1)[1].strip()
                            elif line.lower().startswith("cause:"):
                                cause = line.split(":", 1)[1].strip()
                            elif line.lower().startswith("organic treatment:"):
                                organic_treatment = line.split(":", 1)[1].strip()
                            elif line.lower().startswith("chemical treatment:"):
                                chemical_treatment = line.split(":", 1)[1].strip()
                            elif line.lower().startswith("confidence:"):
                                confidence = line.split(":", 1)[1].strip()
                        
                        # Translation Logic
                        try:
                            t_disease = translator.translate(disease, dest=lang_code).text
                            t_cause = translator.translate(cause, dest=lang_code).text
                            t_org = translator.translate(organic_treatment, dest=lang_code).text
                            t_chem = translator.translate(chemical_treatment, dest=lang_code).text
                            
                            t_label_d = translator.translate("Disease", dest=lang_code).text
                            t_label_c = translator.translate("Cause", dest=lang_code).text
                            t_label_o = translator.translate("Organic Treatment", dest=lang_code).text
                            t_label_ch = translator.translate("Chemical Treatment", dest=lang_code).text
                        except:
                            t_disease, t_cause, t_org, t_chem = disease, cause, organic_treatment, chemical_treatment
                            t_label_d, t_label_c, t_label_o, t_label_ch = "Disease", "Cause", "Organic Treatment", "Chemical Treatment"

                        # Display Output
                        st.metric(label="AI Confidence", value=confidence)
                        st.success(f"**{t_label_d}:** {t_disease}")
                        st.info(f"**{t_label_c}:** {t_cause}")
                        
                        col_org, col_chem = st.columns(2)
                        with col_org:
                            st.subheader(f"🌱 {t_label_o}")
                            st.write(t_org)
                        with col_chem:
                            st.subheader(f"🧪 {t_label_ch}")
                            st.write(t_chem)

                        # TTS (using organic treatment for audio by default)
                        st.write("---")
                        st.subheader("🔊 Listen to Solution")
                        try:
                            audio_text = f"{t_label_o}: {t_org}. {t_label_ch}: {t_chem}"
                            tts = gTTS(text=audio_text, lang=lang_code)
                            filename = "temp_audio.mp3"
                            tts.save(filename)
                            st.audio(filename)
                            os.remove(filename) 
                        except Exception as e:
                            st.error(f"Audio generation unavailable: {e}")
                            
                    except Exception as e:
                        st.error(f"Error during analysis: {str(e)}")
        else:
            st.info("Waiting for analysis... Provide details on the left.")

with tab2:
    st.header("💬 Ask the Expert Chatbot")
    st.write("Ask any agricultural question and get instant advice.")
    
    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if chat_prompt := st.chat_input("How do I improve soil fertility?"):
        st.session_state.messages.append({"role": "user", "content": chat_prompt})
        with st.chat_message("user"):
            st.markdown(chat_prompt)

        if not api_key:
            st.error("⚠️ Please enter your Google API Key in the sidebar.")
        else:
            with st.chat_message("assistant"):
                try:
                    prompt = f"You are an expert agricultural consultant. Answer the following question in {selected_lang}: {chat_prompt}"
                    response_text = call_gemini(api_key, prompt)
                    st.markdown(response_text)
                    st.session_state.messages.append({"role": "assistant", "content": response_text})
                except Exception as e:
                    st.error(f"Error: {e}")

with tab3:
    st.header("📊 Current Market Prices (Live-ish)")
    st.write("Mock data for demonstration purposes.")
    market_cols = st.columns(3)
    with market_cols[0]:
        st.metric("Rice (100kg)", "₹2,500", "+2%")
    with market_cols[1]:
        st.metric("Wheat (100kg)", "₹2,100", "-1%")
    with market_cols[2]:
        st.metric("Tomato (25kg)", "₹800", "+5%")
    
    st.info("Prices are updated based on national agricultural markets (e-NAM).")

with tab4:
    st.header("🌱 Soil Health & Tips")
    st.markdown("""
    ### 5 Tips for Better Soil Health:
    1. **Crop Rotation**: Switch crops every season to prevent nutrient depletion.
    2. **Cover Cropping**: Plant clover or rye in the off-season to protect soil.
    3. **Composting**: Use organic waste to enrich soil nutrients.
    4. **Reduce Tilling**: Minimize soil disturbance to maintain structure.
    5. **Soil Testing**: Get a Soil Health Card every 2 years.
    """)
    if st.button("Get Personalized Soil Tip"):
        tips = [
            "Add organic matter like compost to improve soil structure.",
            "Use mulch to retain moisture and suppress weeds.",
            "Test your soil pH regularly for optimal nutrient uptake.",
            "Avoid over-fertilizing with nitrogen to protect groundwater."
        ]
        import random
        st.success(random.choice(tips))

# 5. Government Schemes Section
st.markdown("---")
st.header("🏛️ Helpful Government Schemes")
schemes = [
    "✅ **PM-Kisan Samman Nidhi**: Financial support of ₹6,000/year.",
    "✅ **Pradhan Mantri Fasal Bima Yojana**: Crop insurance against natural calamities.",
    "✅ **Soil Health Card Scheme**: Get your soil tested for better yields.",
    "✅ **Kisan Credit Card (KCC)**: Low-interest loans for farmers."
]

cols_schemes = st.columns(2)
for i, scheme in enumerate(schemes):
    with cols_schemes[i % 2]:
        try:
            translated_scheme = translator.translate(scheme, dest=lang_code).text
            st.info(translated_scheme)
        except:
            st.info(scheme)

# Footer
st.markdown("---")
st.caption("Developed for AI Hackathon | Powered by Google Gemini & Streamlit 🌾")
