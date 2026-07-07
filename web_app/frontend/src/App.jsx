import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Constant Lists for categories
const TIME_PERIODS = ["Morning", "Afternoon", "Evening", "Night"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEATHER_CONDITIONS = ["Normal", "Cloudy", "Raining", "Raining and Windy", "Fog or mist", "Windy", "Snow", "Other", "Unknown"];
const ROAD_SURFACE_CONDITIONS = ["Dry", "Wet or damp", "Snow", "Flood over 3cm. deep"];
const LIGHT_CONDITIONS = ["Daylight", "Darkness - lights lit", "Darkness - lights unlit", "Darkness - no lighting"];
const AREAS_ACCIDENT_OCCURED = [
  "Residential areas", "Office areas", "Industrial areas", "School areas", 
  "Hospital areas", "Church areas", "Market areas", "Recreational areas", 
  "Rural village areas", "Outside rural areas", "Other", "Unknown"
];
const TYPES_OF_JUNCTION = ["No junction", "Crossing", "T Shape", "Y Shape", "X Shape", "O Shape", "Other", "Unknown"];
const LANES_OR_MEDIANS = [
  "Two-way (divided with broken lines road marking)",
  "Two-way (divided with solid lines road marking)",
  "Undivided Two way",
  "Double carriageway (median)",
  "One way",
  "other",
  "Unknown"
];
const ROAD_ALLIGNMENT = [
  "Tangent road with flat terrain",
  "Tangent road with rolling terrain",
  "Tangent road with mild grade and flat terrain",
  "Gentle horizontal curve",
  "Sharp horizontal curve",
  "Steep grade downward with mountainous terrain",
  "Escarpments",
  "Other"
];
const ROAD_SURFACE_TYPES = ["Asphalt roads", "Earth roads", "Asphalt roads with some distress", "Gravel roads", "Other", "Unknown"];
const CASUALTY_CLASSES = ["Driver or rider", "Passenger", "Pedestrian", "na"];

const PRESETS = [
  {
    name: "Safe Day Trip",
    icon: "☀️",
    data: {
      Time_Period: "Morning",
      Day_of_week: "Tuesday",
      Weather_conditions: "Normal",
      Road_surface_conditions: "Dry",
      Light_conditions: "Daylight",
      Area_accident_occured: "Residential areas",
      Types_of_Junction: "No junction",
      Lanes_or_Medians: "Two-way (divided with broken lines road marking)",
      Road_allignment: "Tangent road with flat terrain",
      Road_surface_type: "Asphalt roads",
      Casualty_class: "Driver or rider"
    }
  },
  {
    name: "Rainy Night on Curve",
    icon: "🌧️",
    data: {
      Time_Period: "Night",
      Day_of_week: "Friday",
      Weather_conditions: "Raining",
      Road_surface_conditions: "Wet or damp",
      Light_conditions: "Darkness - no lighting",
      Area_accident_occured: "Outside rural areas",
      Types_of_Junction: "Y Shape",
      Lanes_or_Medians: "Undivided Two way",
      Road_allignment: "Gentle horizontal curve",
      Road_surface_type: "Asphalt roads",
      Casualty_class: "Passenger"
    }
  },
  {
    name: "Rural Dirt Road in Fog",
    icon: "🌫️",
    data: {
      Time_Period: "Night",
      Day_of_week: "Sunday",
      Weather_conditions: "Fog or mist",
      Road_surface_conditions: "Wet or damp",
      Light_conditions: "Darkness - lights unlit",
      Area_accident_occured: "Rural village areas",
      Types_of_Junction: "Crossing",
      Lanes_or_Medians: "Undivided Two way",
      Road_allignment: "Steep grade downward with mountainous terrain",
      Road_surface_type: "Earth roads",
      Casualty_class: "Pedestrian"
    }
  },
  {
    name: "Ekala Local Route",
    icon: "🚗",
    data: {
      Time_Period: "Afternoon",
      Day_of_week: "Wednesday",
      Weather_conditions: "Normal",
      Road_surface_conditions: "Dry",
      Light_conditions: "Daylight",
      Area_accident_occured: "Residential areas",
      Types_of_Junction: "Crossing",
      Lanes_or_Medians: "Two-way (divided with broken lines road marking)",
      Road_allignment: "Tangent road with flat terrain",
      Road_surface_type: "Asphalt roads",
      Casualty_class: "Driver or rider"
    }
  }
];

const getLocalTimePeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

const getLocalDayOfWeek = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
};

function App() {
  // Input fields state
  const [formData, setFormData] = useState({
    Time_Period: getLocalTimePeriod(),
    Day_of_week: getLocalDayOfWeek(),
    Weather_conditions: "Normal",
    Road_surface_conditions: "Dry",
    Light_conditions: "Daylight",
    Area_accident_occured: "Residential areas",
    Types_of_Junction: "No junction",
    Lanes_or_Medians: "Two-way (divided with broken lines road marking)",
    Road_allignment: "Tangent road with flat terrain",
    Road_surface_type: "Asphalt roads",
    Casualty_class: "Driver or rider"
  });

  // API Status & Prediction Result State
  const [apiStatus, setApiStatus] = useState({ healthy: false, fallback: true });
  const [predictionResult, setPredictionResult] = useState({
    prediction: "Low",
    confidence: 88.0,
    tips: ["🟢 Conditions look safe. Keep standard safe driving rules and enjoy the trip."],
    engine: "rule_based_simulation"
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simulator state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSeconds, setSimSeconds] = useState(60);
  const [mockCoordinates, setMockCoordinates] = useState({ lat: 7.0988, lng: 79.9141 }); // Centered in Ekala
  const [locationName, setLocationName] = useState("Locating vehicle...");
  
  const timerRef = useRef(null);

  // Synthetic alarm tone using Web Audio API
  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Tone 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.value = 880; // High A5
      gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.15);

      // Tone 2 after a tiny delay
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.value = 1109; // C#6
        gain2.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 150);
    } catch (e) {
      console.log("Audio API failed", e);
    }
  };

  // Fetch prediction from FastAPI backend
  const fetchPrediction = async (currentData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentData),
      });
      if (response.ok) {
        const data = await response.json();
        setPredictionResult(data);
        
        // Play synthetic alarm sound if risk jumps to High
        if (data.prediction === "High") {
          playAlarm();
        }
      }
    } catch (e) {
      console.error("Inference fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Check health of API on load
  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (response.ok) {
        const data = await response.json();
        setApiStatus({
          healthy: data.status === "healthy",
          fallback: data.fallback_active
        });
      } else {
        setApiStatus({ healthy: false, fallback: true });
      }
    } catch (e) {
      setApiStatus({ healthy: false, fallback: true });
    }
  };

  // Helper to fetch details from APIs based on coordinates and update state in parallel
  const fetchLocationDetails = async (latitude, longitude) => {
    setIsLoading(true);
    let weather = "Normal";
    let surface = "Dry";
    let light = "Daylight";
    let roadSurfaceType = "Asphalt roads";
    let lanesOrMedians = "Two-way (divided with broken lines road marking)";
    let typesOfJunction = "No junction";
    let areaAccidentOccured = "Outside rural areas";
    let roadAlignment = "Tangent road with flat terrain";
    let locationNameStr = "Detected Location";

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,precipitation,weather_code`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way(around:100,${latitude},${longitude})[highway];out;`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    try {
      // Fetch all three endpoints concurrently (in parallel) to minimize network latency
      const [weatherResponse, osmResponse, nominatimResponse] = await Promise.all([
        fetch(weatherUrl).catch(err => { console.error("Weather request failed:", err); return null; }),
        fetch(overpassUrl).catch(err => { console.error("OSM Overpass request failed:", err); return null; }),
        fetch(nominatimUrl, { headers: { 'User-Agent': 'RoadAccidentRiskPredictor/1.0' } }).catch(err => { console.error("Nominatim request failed:", err); return null; })
      ]);

      // 1. Process Weather response
      if (weatherResponse && weatherResponse.ok) {
        const data = await weatherResponse.json();
        const current = data.current;
        const wCode = current.weather_code;
        const isDay = current.is_day;
        
        if (wCode === 0) weather = "Normal";
        else if ([1, 2, 3].includes(wCode)) weather = "Cloudy";
        else if ([45, 48].includes(wCode)) weather = "Fog or mist";
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(wCode)) weather = "Raining";
        else if ([95, 96, 99].includes(wCode)) weather = "Raining and Windy";
        else if ([71, 73, 75, 85, 86].includes(wCode)) weather = "Snow";
        
        if ([71, 73, 75, 85, 86].includes(wCode)) {
          surface = "Snow";
        } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(wCode)) {
          const precip = current.precipitation || 0;
          surface = precip > 15 ? "Flood over 3cm. deep" : "Wet or damp";
        }
        
        const isUrban = ["Residential areas", "Office areas", "Industrial areas", "School areas", "Hospital areas", "Market areas", "Recreational areas"].includes(areaAccidentOccured);
        if (isDay === 0) {
          light = isUrban ? "Darkness - lights lit" : "Darkness - no lighting";
        }
      }

      // 2. Process OSM Road features response
      if (osmResponse && osmResponse.ok) {
        const osmData = await osmResponse.json();
        const elements = osmData.elements;
        
        if (elements && elements.length > 0) {
          const way = elements[0];
          const tags = way.tags || {};
          
          const sType = tags.surface || "asphalt";
          if (["dirt", "earth", "ground", "grass", "unpaved"].includes(sType)) {
            roadSurfaceType = "Earth roads";
          } else if (["gravel", "pebbles", "compacted"].includes(sType)) {
            roadSurfaceType = "Gravel roads";
          } else {
            roadSurfaceType = "Asphalt roads";
          }
          
          const lanes = parseInt(tags.lanes) || 2;
          const oneway = tags.oneway === "yes";
          if (oneway) {
            lanesOrMedians = "One way";
          } else if (tags.dual_carriageway === "yes" || tags.barrier === "median") {
            lanesOrMedians = "Double carriageway (median)";
          } else if (lanes >= 4) {
            lanesOrMedians = "Two-way (divided with solid lines road marking)";
          } else {
            lanesOrMedians = "Two-way (divided with broken lines road marking)";
          }
          
          const junction = tags.junction || "";
          if (junction === "roundabout") {
            typesOfJunction = "O Shape";
          } else if (elements.length > 1) {
            typesOfJunction = elements.length === 2 ? "T Shape" : "Crossing";
          } else {
            typesOfJunction = "No junction";
          }
          
          const highway = tags.highway || "";
          const landuse = tags.landuse || "";
          if (["residential", "living_street"].includes(highway) || landuse === "residential") {
            areaAccidentOccured = "Residential areas";
          } else if (["unclassified", "track", "path"].includes(highway)) {
            areaAccidentOccured = "Rural village areas";
          } else if (landuse === "commercial" || landuse === "retail") {
            areaAccidentOccured = "Office areas";
          } else if (landuse === "industrial") {
            areaAccidentOccured = "Industrial areas";
          } else {
            areaAccidentOccured = "Outside rural areas";
          }
          
          const incline = tags.incline || "";
          if (incline) {
            roadAlignment = "Steep grade downward with mountainous terrain";
          } else if (tags.junction === "roundabout" || tags.highway === "junction") {
            roadAlignment = "Gentle horizontal curve";
          }
        }
      }

      // 3. Process Nominatim reverse address response
      if (nominatimResponse && nominatimResponse.ok) {
        const geoData = await nominatimResponse.json();
        const addr = geoData.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || "";
        const town = addr.town || addr.city || addr.village || addr.suburb || "";
        locationNameStr = road && town ? `${road}, ${town}` : geoData.display_name || "Detected Location";
      }
    } catch (err) {
      console.error("Parallel fetch processing failed:", err);
    }

    const updatedData = {
      ...formData,
      Weather_conditions: weather,
      Road_surface_conditions: surface,
      Light_conditions: light,
      Road_surface_type: roadSurfaceType,
      Lanes_or_Medians: lanesOrMedians,
      Types_of_Junction: typesOfJunction,
      Area_accident_occured: areaAccidentOccured,
      Road_allignment: roadAlignment
    };

    setFormData(updatedData);
    setLocationName(locationNameStr);
    fetchPrediction(updatedData);
    setIsLoading(false);
  };

  useEffect(() => {
    checkApiHealth();
    
    // Auto-detect location on load and watch continuously
    let watchId = null;
    if (navigator.geolocation) {
      // 1. Initial immediate location check (increased timeout to 15s)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMockCoordinates({ lat: latitude, lng: longitude });
          fetchLocationDetails(latitude, longitude);
        },
        (err) => {
          console.error("Initial GPS lookup failed, using fallback:", err);
          fetchPrediction(formData);
        },
        { enableHighAccuracy: false, timeout: 15000 }
      );

      // 2. Continuously track coordinate changes (updates dynamically when you move)
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMockCoordinates({ lat: latitude, lng: longitude });
          fetchLocationDetails(latitude, longitude);
        },
        (err) => {
          console.error("GPS live tracking failed:", err);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      fetchPrediction(formData);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Handle Form select changes
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    fetchPrediction(updatedData);
  };

  // Manual Trigger: Auto-detect GPS location and fetch weather + road data
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMockCoordinates({ lat: latitude, lng: longitude });
        fetchLocationDetails(latitude, longitude);
      },
      (error) => {
        console.error("Manual GPS lookup failed:", error);
        setIsLoading(false);
        alert(`Failed to retrieve location: ${error.message}`);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Load preset data
  const applyPreset = (preset) => {
    setFormData(preset.data);
    fetchPrediction(preset.data);
    
    if (preset.name === "Safe Day Trip") {
      setLocationName("Galle Road, Colombo");
      setMockCoordinates({ lat: 6.9271, lng: 79.8612 });
    } else if (preset.name === "Rainy Night on Curve") {
      setLocationName("Ella-Wellawaya Road, Ella");
      setMockCoordinates({ lat: 6.8667, lng: 81.0466 });
    } else if (preset.name === "Rural Dirt Road in Fog") {
      setLocationName("Ohiya Road, Horton Plains");
      setMockCoordinates({ lat: 6.8028, lng: 80.8492 });
    } else if (preset.name === "Ekala Local Route") {
      setLocationName("Ekala - Gampaha Road, Ekala");
      setMockCoordinates({ lat: 7.0988, lng: 79.9141 });
    }
  };

  // Handle Simulator Toggle
  const handleSimulatorToggle = () => {
    setIsSimulating(!isSimulating);
    setSimSeconds(60);
  };

  // Simulator update ticks
  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setInterval(() => {
        setSimSeconds((prev) => {
          if (prev <= 1) {
            // Trigger randomized data updates simulating driving
            triggerRandomJourneyUpdate();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isSimulating]);

  // Randomize features to simulate active driving
  const triggerRandomJourneyUpdate = () => {
    // Modify lat/lng slightly (mocking vehicle movement)
    setMockCoordinates(prev => ({
      lat: prev.lat + (Math.random() - 0.5) * 0.004,
      lng: prev.lng + (Math.random() - 0.5) * 0.004
    }));

    // Pick random values representing a changing road environment
    const randomChoices = {
      Weather_conditions: WEATHER_CONDITIONS[Math.floor(Math.random() * 4)], // Keep it realistic (mostly normal, rain, cloudy)
      Road_surface_conditions: ROAD_SURFACE_CONDITIONS[Math.floor(Math.random() * 2)],
      Types_of_Junction: TYPES_OF_JUNCTION[Math.floor(Math.random() * 4)],
      Lanes_or_Medians: LANES_OR_MEDIANS[Math.floor(Math.random() * 3)],
      Road_allignment: ROAD_ALLIGNMENT[Math.floor(Math.random() * 4)],
      Road_surface_type: ROAD_SURFACE_TYPES[Math.floor(Math.random() * 3)]
    };

    const updatedFormData = {
      ...formData,
      ...randomChoices
    };

    setFormData(updatedFormData);
    fetchPrediction(updatedFormData);
  };

  // SVG Gauge variables
  const getGaugeStrokeColorClass = () => {
    const risk = predictionResult.prediction;
    if (risk === "High") return "high-risk";
    if (risk === "Medium") return "medium-risk";
    return "low-risk";
  };

  // Dash offsets for semi-circle
  const dashArray = 471.2; // Circumference of radius 75 semi circle: 2 * PI * 75 * (300/360) / 2
  const getGaugeDashOffset = () => {
    const conf = predictionResult.confidence;
    const risk = predictionResult.prediction;
    
    // Scale standard confidence to circular indicator
    let factor = 0.2; // Low
    if (risk === "Medium") factor = 0.55;
    if (risk === "High") factor = 0.85;

    // Adjust factor slightly by confidence score
    const adjustedFactor = factor * (conf / 100);
    return dashArray * (1 - adjustedFactor);
  };

  // Needle angle rotation
  const getNeedleRotation = () => {
    const risk = predictionResult.prediction;
    const conf = predictionResult.confidence;
    
    let baseAngle = -90; // Leftmost
    if (risk === "Medium") baseAngle = 0; // Vertical
    if (risk === "High") baseAngle = 90; // Rightmost

    // Add confidence variance
    const angleOffset = (conf - 80) * 1.5;
    return `rotate(${baseAngle + angleOffset} 150 150)`;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <h1>Road Accident Risk Predictor</h1>
          <p>Proactive AI Driver Safety Assistant</p>
        </div>
        
        <div className={`status-badge ${apiStatus.healthy ? (apiStatus.fallback ? 'fallback' : 'healthy') : 'fallback'}`}>
          <span className="status-dot"></span>
          <span>
            {!apiStatus.healthy 
              ? "Local Simulation Mode" 
              : (apiStatus.fallback ? "FastAPI Core (Rule Fallback)" : "FastAPI Neural Net Core")}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Panel: Feature Selector Form */}
        <section className="card glass-panel">
          <h2 className="card-title">🚙 Journey Parameters Configuration</h2>

          {/* User Role Selection Segmented Control */}
          <div className="role-section">
            <h3 className="role-title">👤 Select Your Current Role</h3>
            <div className="role-buttons-grid">
              <button 
                type="button" 
                className={`role-select-btn ${formData.Casualty_class === 'Driver or rider' ? 'active' : ''}`}
                onClick={() => {
                  const updated = { ...formData, Casualty_class: 'Driver or rider' };
                  setFormData(updated);
                  fetchPrediction(updated);
                }}
              >
                <span className="role-btn-icon">🚗</span>
                <span>Driver</span>
              </button>
              <button 
                type="button" 
                className={`role-select-btn ${formData.Casualty_class === 'Passenger' ? 'active' : ''}`}
                onClick={() => {
                  const updated = { ...formData, Casualty_class: 'Passenger' };
                  setFormData(updated);
                  fetchPrediction(updated);
                }}
              >
                <span className="role-btn-icon">👥</span>
                <span>Passenger</span>
              </button>
              <button 
                type="button" 
                className={`role-select-btn ${formData.Casualty_class === 'Pedestrian' ? 'active' : ''}`}
                onClick={() => {
                  const updated = { ...formData, Casualty_class: 'Pedestrian' };
                  setFormData(updated);
                  fetchPrediction(updated);
                }}
              >
                <span className="role-btn-icon">🚶</span>
                <span>Pedestrian</span>
              </button>
            </div>
          </div>
          


          {/* Form */}
          <form className="features-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Time Period</label>
              <div className="select-wrapper">
                <select name="Time_Period" className="custom-select" value={formData.Time_Period} onChange={handleSelectChange}>
                  {TIME_PERIODS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Day of Week</label>
              <div className="select-wrapper">
                <select name="Day_of_week" className="custom-select" value={formData.Day_of_week} onChange={handleSelectChange}>
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Weather Conditions</label>
              <div className="select-wrapper">
                <select name="Weather_conditions" className="custom-select" value={formData.Weather_conditions} onChange={handleSelectChange}>
                  {WEATHER_CONDITIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Road Surface Conditions</label>
              <div className="select-wrapper">
                <select name="Road_surface_conditions" className="custom-select" value={formData.Road_surface_conditions} onChange={handleSelectChange}>
                  {ROAD_SURFACE_CONDITIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Light Conditions</label>
              <div className="select-wrapper">
                <select name="Light_conditions" className="custom-select" value={formData.Light_conditions} onChange={handleSelectChange}>
                  {LIGHT_CONDITIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Area Type</label>
              <div className="select-wrapper">
                <select name="Area_accident_occured" className="custom-select" value={formData.Area_accident_occured} onChange={handleSelectChange}>
                  {AREAS_ACCIDENT_OCCURED.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Junction Type</label>
              <div className="select-wrapper">
                <select name="Types_of_Junction" className="custom-select" value={formData.Types_of_Junction} onChange={handleSelectChange}>
                  {TYPES_OF_JUNCTION.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Lane / Median</label>
              <div className="select-wrapper">
                <select name="Lanes_or_Medians" className="custom-select" value={formData.Lanes_or_Medians} onChange={handleSelectChange}>
                  {LANES_OR_MEDIANS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Road Alignment</label>
              <div className="select-wrapper">
                <select name="Road_allignment" className="custom-select" value={formData.Road_allignment} onChange={handleSelectChange}>
                  {ROAD_ALLIGNMENT.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Road Surface Type</label>
              <div className="select-wrapper">
                <select name="Road_surface_type" className="custom-select" value={formData.Road_surface_type} onChange={handleSelectChange}>
                  {ROAD_SURFACE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </form>
        </section>

        {/* Right Panel: Prediction Result Gauge & Warning tips */}
        <div className="result-panel">
          {/* Main Risk Card */}
          <section className={`card glass-panel ${predictionResult.prediction === "High" ? 'high-risk-alert-bg' : ''}`}>
            <h2 className="card-title">📊 Accident Risk Analysis</h2>

            <div className="gauge-container">
              {/* SVG Speedometer Gauge */}
              <svg viewBox="0 0 300 200" className="gauge-svg">
                {/* Arc tracks */}
                <path 
                  d="M 50 150 A 100 100 0 1 1 250 150" 
                  className="gauge-bg"
                />
                <path 
                  d="M 50 150 A 100 100 0 1 1 250 150" 
                  className={`gauge-fill ${getGaugeStrokeColorClass()}`}
                  strokeDasharray={`${dashArray} ${dashArray}`}
                  strokeDashoffset={getGaugeDashOffset()}
                />
                
                {/* Center needle */}
                <g className="gauge-needle" transform={getNeedleRotation()}>
                  <line x1="150" y1="150" x2="150" y2="70" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="150" cy="150" r="10" fill="#ffffff" />
                  {predictionResult.prediction === "High" && (
                    <circle cx="150" cy="150" r="18" fill="var(--risk-high)" className="gauge-center-pulse" />
                  )}
                </g>
              </svg>

              {/* Text overlays inside gauge container */}
              <div className="gauge-overlay">
                <span className={`risk-label ${getGaugeStrokeColorClass()}`}>
                  {isLoading ? "Analyzing..." : predictionResult.prediction}
                </span>
                <span className="confidence-score">
                  Confidence Score: {predictionResult.confidence}%
                </span>
                <span className="engine-pill">
                  Engine: {predictionResult.engine}
                </span>
              </div>
            </div>
          </section>

          {/* Simulated Auto-Drive Panel */}
          <section className="card glass-panel">
            <div className="simulator-panel">
              <div className="simulator-info">
                <h3>🔄 Active Drive Simulator</h3>
                <p>Simulates continuous coordinate changes & features updates while driving</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={isSimulating} onChange={handleSimulatorToggle} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="map-mock">
              <div className="grid-lines"></div>
              <div className="mock-radar">
                <div className="mock-car-icon"></div>
              </div>
              <div>🛰️ Vehicle Coordinates: <b>{mockCoordinates.lat.toFixed(6)}N, {mockCoordinates.lng.toFixed(6)}E</b></div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>📍 Address: <b>{locationName}</b></div>
              {isSimulating ? (
                <>
                  <div className="sim-progress-bar-container" style={{ marginTop: '0.5rem' }}>
                    <div className="sim-progress-bar" style={{ width: `${(simSeconds / 60) * 100}%` }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>Next environment update in {simSeconds}s</div>
                </>
              ) : (
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>Geolocation snapshot active</div>
              )}
            </div>
          </section>

          {/* Safety Recommendations */}
          <section className="card glass-panel tips-panel">
            <h2 className="card-title">💡 Proactive Safety Recommendations</h2>
            <ul className="tips-list">
              {predictionResult.tips.map((tip, idx) => (
                <li key={idx} className="tip-item">
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
