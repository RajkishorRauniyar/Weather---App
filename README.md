# WeatherVision - AI-Powered Weather App

A comprehensive, AI-powered weather application built with HTML, CSS, and JavaScript. Features real-time weather data, forecasts, AI insights, and offline support.

![WeatherVision Screenshot](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **Real-Time Weather**: Temperature, humidity, wind, UV index, pressure, visibility
- **Forecasts**: 24-hour hourly and 7-day daily forecasts
- **Location Services**: GPS location, city search, saved locations
- **Interactive Map**: Weather map with layer controls
- **AI-Powered Insights**: 
  - Natural language weather chat
  - Clothing recommendations
  - Activity suggestions
  - Health advisories
- **Analytics**: Temperature, humidity, and precipitation charts
- **Units & Themes**: Celsius/Fahrenheit/Kelvin, Light/Dark mode
- **Offline Support**: PWA with service worker caching

## 🚀 Getting Started

### Prerequisites
- Any modern web browser
- Internet connection (for weather data)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RajkishorRauniyar/Weather---App.git
```

2. Navigate to the project directory:
```bash
cd Weather---App
```

3. Open `index.html` in your browser, or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if installed)
npx serve
```

4. Visit `http://localhost:8000` in your browser

## 📁 Project Structure

```
Weather---App/
├── index.html          # Main HTML file
├── styles.css         # CSS styling
├── app.js             # JavaScript application
├── manifest.json      # PWA manifest
├── service-worker.js  # Offline support
├── SPEC.md           # Project specification
└── .gitignore        # Git ignore file
```

## 🔧 Usage

### Search Location
- Type city name, ZIP code, or coordinates in search bar
- Click GPS button for current location

### Settings
- Click gear icon to access settings
- Change temperature, wind, precipitation units
- Toggle notifications

### AI Assistant
- Click "Ask AI" button to open chat
- Ask questions about weather
- Use voice input for hands-free queries

### Theme Toggle
- Click moon/sun icon to switch between light and dark modes

## 📝 Credits

**Developed by:** [Rajkishor Rauniyar](https://github.com/RajkishorRauniyar)

**APIs Used:**
- [Open-Meteo](https://open-meteo.com/) - Weather data (free, no API key required)
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles

**Libraries:**
- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Google Fonts](https://fonts.google.com/) - Typography

## 📄 License

This project is licensed under the MIT License.

---

⭐ If you find this project useful, please give it a star!