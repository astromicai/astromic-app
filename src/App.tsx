import { useState } from 'react';
import './App.css';
import { GoogleGenerativeAI } from "@google/genai";

// Initialize Gemini with your API key
// Make sure you added VITE_GEMINI_API_KEY in your Vercel Environment Variables!
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function App() {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    location: ''
  });
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPrediction = async () => {
    if (!formData.name || !formData.birthDate || !formData.location) {
      alert("Please fill in all fields!");
      return;
    }

    setLoading(true);
    setPrediction('');

    try {
      // 1. Create the prompt for Gemini
      const prompt = `Act as a mystical and insightful astrologer. 
      Generate a short, personalized reading for:
      Name: ${formData.name}
      Date of Birth: ${formData.birthDate}
      Time: ${formData.birthTime}
      Location: ${formData.location}
      
      Focus on their "Big Three" (Sun, Moon, Rising) if possible based on the data, 
      and give one specific piece of advice for this week. Keep it inspiring.`;

      // 2. Call the API (using the Gemini 1.5 Flash model for speed)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setPrediction(text);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setPrediction("The stars are cloudy right now. Please check your API Key and try again.");
    } 
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <h1>Astromic AI</h1>
        <p>Your Fate, Decoded.</p>
      </header>

      <div className="card">
        <div className="input-group">
          <input 
            type="text" 
            name="name" 
            placeholder="Your Name" 
            onChange={handleChange} 
          />
          <input 
            type="date" 
            name="birthDate" 
            onChange={handleChange} 
          />
          <input 
            type="time" 
            name="birthTime" 
            onChange={handleChange} 
          />
          <input 
            type="text" 
            name="location" 
            placeholder="Birth City & Country" 
            onChange={handleChange} 
          />
        </div>

        <button onClick={getPrediction} disabled={loading}>
          {loading ? "Consulting the Stars..." : "Reveal My Destiny"}
        </button>
      </div>

      {prediction && (
        <div className="result-card">
          <h2>Your Reading</h2>
          <div className="prediction-text">
            {prediction.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
      
      <footer className="footer-link">
        <p>Powered by <a href="https://aiworkx.com" target="_blank">AIWorkx</a></p>
      </footer>
    </div>
  );
}

export default App;