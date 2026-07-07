import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# Setup FastAPI App
app = FastAPI(title="Road Accident Risk Prediction API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and preprocessor
model = None
preprocessor = None
label_encoder = None
feature_columns = None
use_fallback = False

MODEL_PATH = "../../notebooks/artifacts/risk_model.keras"
PREPROCESSOR_PATH = "../../notebooks/artifacts/preprocessors.joblib"

# Try loading the saved Keras model and preprocessor
try:
    import joblib
    from tensorflow.keras.models import load_model

    # Resolve paths relative to this script
    base_dir = os.path.dirname(__file__)
    model_abs_path = os.path.abspath(os.path.join(base_dir, MODEL_PATH))
    prep_abs_path = os.path.abspath(os.path.join(base_dir, PREPROCESSOR_PATH))

    if os.path.exists(model_abs_path) and os.path.exists(prep_abs_path):
        model = load_model(model_abs_path)
        artifacts = joblib.load(prep_abs_path)
        preprocessor = artifacts["preprocessor"]
        label_encoder = artifacts.get("label_encoder")
        feature_columns = artifacts.get("feature_columns")
        print("✅ Success: ML Model & Preprocessor loaded successfully.")
    else:
        print("⚠️ Warning: Model artifacts not found. Using fallback prediction rules.")
        use_fallback = True
except Exception as e:
    print(f"⚠️ Warning: Loading ML Model failed ({str(e)}). Using fallback prediction rules.")
    use_fallback = True


# Input Schema
class PredictionRequest(BaseModel):
    Time: Optional[str] = Field(None, description="Time of journey in HH:MM:SS format")
    Time_Period: Optional[str] = Field(None, description="Morning, Afternoon, Evening, Night")
    Day_of_week: str = Field(..., description="Day of week (Monday-Sunday)")
    Weather_conditions: str = Field(..., description="Normal, Raining, Cloudy, etc.")
    Road_surface_conditions: str = Field(..., description="Dry, Wet or damp, etc.")
    Light_conditions: str = Field(..., description="Daylight, Darkness - lights lit, etc.")
    Area_accident_occured: str = Field(..., description="Residential, Office, Industrial, etc.")
    Types_of_Junction: str = Field(..., description="No junction, Y Shape, crossing, etc.")
    Lanes_or_Medians: str = Field(..., description="Undivided Two way, One way, etc.")
    Road_allignment: str = Field(..., description="Tangent road with flat terrain, Curve, etc.")
    Road_surface_type: str = Field(..., description="Asphalt roads, Earth roads, etc.")
    Casualty_class: str = Field(..., description="Driver or rider, passenger, pedestrian, etc.")


# Helper to convert Time string to Time_Period category
def get_time_period(time_str: str) -> str:
    try:
        hour = int(time_str.split(":")[0])
        if 5 <= hour < 12:
            return "Morning"
        elif 12 <= hour < 17:
            return "Afternoon"
        elif 17 <= hour < 21:
            return "Evening"
        else:
            return "Night"
    except Exception:
        return "Morning"  # Fallback


# Rule-based fallback system representing realistic risk mapping
def run_rule_based_fallback(data: dict):
    # Calculate simple severity score
    score = 0

    # Weather penalties
    weather = data["Weather_conditions"].lower()
    if "rain" in weather:
        score += 2.0
    elif "wind" in weather:
        score += 1.0
    elif "fog" in weather or "mist" in weather:
        score += 2.5

    # Road surface penalties
    surface = data["Road_surface_conditions"].lower()
    if "wet" in surface or "damp" in surface:
        score += 2.0
    elif "flood" in surface:
        score += 3.5
    elif "snow" in surface:
        score += 3.0

    # Road type penalties
    surface_type = data["Road_surface_type"].lower()
    if "earth" in surface_type:
        score += 2.0
    elif "gravel" in surface_type:
        score += 1.0

    # Light penalties
    light = data["Light_conditions"].lower()
    if "no lighting" in light:
        score += 2.5
    elif "lights unlit" in light:
        score += 1.5

    # Alignment penalties
    alignment = data["Road_allignment"].lower()
    if "curve" in alignment or "escarpment" in alignment:
        score += 1.5
    elif "grade" in alignment:
        score += 1.0

    # Junction/Lane configuration complexity
    junction = data["Types_of_Junction"].lower()
    if "crossing" in junction or "x shape" in junction:
        score += 1.5

    # Time of day risk adjustments
    time_p = data["Time_Period"].lower()
    if time_p == "night":
        score += 1.5
    elif time_p == "evening":
        score += 0.5

    # Assign risk and calculate mock confidence
    if score >= 6.5:
        risk = "High"
        confidence = min(80 + (score - 6.5) * 5, 99.5)
    elif score >= 3.0:
        risk = "Medium"
        confidence = min(75 + (score - 3.0) * 4, 95.0)
    else:
        risk = "Low"
        confidence = min(85 + (3.0 - score) * 3, 98.0)

    # Generate custom tips
    tips = []
    if "rain" in weather or "wet" in surface:
        tips.append("🌧️ Wet road surface: Double standard braking distance and avoid sudden turns.")
    if "fog" in weather or "mist" in weather:
        tips.append("🌫️ Limited visibility: Use fog lights and reduce speed to match clear sight line.")
    if "no lighting" in light:
        tips.append("🌙 Unlit road: Switch on high beams when safe, drive cautiously.")
    if "earth" in surface_type or "gravel" in surface_type:
        tips.append("🚧 Loose/unpaved road: Avoid sudden braking to prevent sliding.")
    if "curve" in alignment:
        tips.append("彎 Curved alignment: Slow down before entering the curve, do not accelerate mid-turn.")
    if "crossing" in junction:
        tips.append("🚸 Pedestrian Crossing: Scan sideways and be prepared to yield to pedestrians.")

    if not tips:
        tips.append("🟢 Conditions look safe. Keep standard safe driving rules and enjoy the trip.")

    return risk, round(confidence, 1), tips


@app.post("/api/predict")
def predict(request: PredictionRequest):
    global use_fallback

    # Convert Pydantic request to dictionary
    data = request.dict()

    # Pre-process time string if provided
    if data.get("Time") and not data.get("Time_Period"):
        data["Time_Period"] = get_time_period(data["Time"])
    elif not data.get("Time_Period"):
        data["Time_Period"] = "Morning"

    # Fallback path (Rule-based or file missing)
    if use_fallback or model is None or preprocessor is None:
        risk, confidence, tips = run_rule_based_fallback(data)
        return {
            "prediction": risk,
            "confidence": confidence,
            "tips": tips,
            "engine": "rule_based_simulation"
        }

    # Pipeline Model Path (Optional if trained model exists)
    try:
        # Construct dataframe matching exact column training order
        input_data = {col: [data[col]] for col in feature_columns}
        input_df = pd.DataFrame(input_data)

        # Apply preprocessing
        X_processed = preprocessor.transform(input_df)

        # Predict
        prediction = model.predict(X_processed, verbose=0)
        predicted_idx = np.argmax(prediction[0])
        predicted_label = label_encoder.inverse_transform([predicted_idx])[0]
        confidence = float(np.max(prediction[0])) * 100

        # Generate Tips (Even for ML predictions, keep safety messages active)
        _, _, tips = run_rule_based_fallback(data)

        return {
            "prediction": predicted_label,
            "confidence": round(confidence, 1),
            "tips": tips,
            "engine": "keras_neural_network"
        }
    except Exception as e:
        # Graceful prediction degradation
        print(f"Exception during ML inference: {str(e)}. Falling back to rules.")
        risk, confidence, tips = run_rule_based_fallback(data)
        return {
            "prediction": risk,
            "confidence": confidence,
            "tips": tips,
            "engine": "keras_error_fallback"
        }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None,
        "fallback_active": use_fallback
    }
