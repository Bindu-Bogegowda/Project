import streamlit as st

# --- Page Config ---
st.set_page_config(page_title="AI Crop Assistant 🌾", page_icon="🌾")

# --- Logo (safe load) ---
try:
    st.image("logo.png", width=120)
except:
    st.write("🌾")

# --- Title ---
st.title("🌾 AI Crop Assistant")
st.write("Analyze your crop health and get expert advice instantly.")

st.markdown("---")

# --- Input Section ---
st.header("🧭 Input Section")

uploaded_image = st.file_uploader("📤 Upload Crop Image", type=["jpg", "jpeg", "png"])
crop_problem = st.text_input("✍️ Describe the crop problem (e.g., yellow leaves)")
language = st.selectbox("🌍 Select Language", ["English", "Kannada", "Hindi"])

st.markdown("---")

# --- Analyze Button ---
if st.button("🔍 Analyze Crop"):

    if uploaded_image is None:
        st.warning("⚠️ Please upload a crop image.")
    elif not crop_problem:
        st.warning("⚠️ Please describe the problem with your crop.")
    else:
        with st.spinner("Analyzing crop data... 🌱"):

            # Show uploaded image
            st.image(uploaded_image, caption="Uploaded Crop Image", use_column_width=True)

            problem = crop_problem.lower()

            # --- Smart Logic (AI-like) ---
            if "yellow" in problem:
                disease = "Nitrogen Deficiency"
                cause = "Lack of nitrogen in soil"
                solution = "Apply nitrogen-rich fertilizers like urea"
            elif "brown" in problem:
                disease = "Fungal Infection"
                cause = "Excess moisture and humidity"
                solution = "Use fungicide and improve air circulation"
            elif "wilting" in problem:
                disease = "Water Stress"
                cause = "Insufficient or irregular watering"
                solution = "Maintain proper irrigation schedule"
            else:
                disease = "General Crop Stress"
                cause = "Unknown environmental factors"
                solution = "Consult agricultural expert"

            # --- Results ---
            st.markdown("## 📊 Results")
            st.success("✅ Analysis Complete!")

            st.write(f"🌿 *Disease:* {disease}")
            st.write(f"🧬 *Cause:* {cause}")

            # --- Multilingual Output ---
            if language == "Kannada":
                st.write(f"💡 *ಪರಿಹಾರ:* {solution}")
            elif language == "Hindi":
                st.write(f"💡 *समाधान:* {solution}")
            else:
                st.write(f"💡 *Solution:* {solution}")

# --- Government Schemes ---
st.markdown("---")
st.header("🏛️ Government Schemes for Farmers")

st.markdown("""
*1. Pradhan Mantri Fasal Bima Yojana (PMFBY)*  
Provides crop insurance coverage for farmers.

*2. Kisan Credit Card (KCC)*  
Provides financial support for agricultural needs.

*3. Soil Health Card Scheme*  
Gives soil nutrient analysis and fertilizer advice.

*4. PM Krishi Sinchayee Yojana (PMKSY)*  
Improves irrigation and water usage.
""")

# --- Footer ---
st.markdown("---")
st.caption("Developed with ❤️ using Streamlit | Hackathon Project 🌾")