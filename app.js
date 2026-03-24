/**
 * WeatherVision - AI-Powered Weather App
 * Main Application JavaScript
 * Developed by Rajkishor Rauniyar
 */

// ========================================
// Configuration & State
// ========================================
const CONFIG = {
    API_BASE: 'https://api.open-meteo.com/v1',
    GEO_API: 'https://geocoding-api.open-meteo.com/v1',
    DEFAULT_LOCATION: { lat: 27.7172, lon: 85.3240, name: 'Kathmandu', country: 'Nepal' },
    MAX_SAVED_LOCATIONS: 5,
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
};

const state = {
    currentLocation: null,
    savedLocations: [],
    weatherData: null,
    settings: {
        tempUnit: 'celsius',
        windUnit: 'kmh',
        precipUnit: 'mm',
        theme: 'light',
        dailySummary: false,
        alerts: true,
    },
    isOnline: navigator.onLine,
    map: null,
    chart: null,
    currentChartType: 'temp',
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    // Header
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    gpsBtn: document.getElementById('gpsBtn'),
    themeToggle: document.getElementById('themeToggle'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Locations
    savedLocations: document.getElementById('savedLocations'),
    
    // Hero
    heroSection: document.getElementById('heroSection'),
    heroBackground: document.getElementById('heroBackground'),
    currentLocation: document.getElementById('currentLocation'),
    lastUpdated: document.getElementById('lastUpdated'),
    weatherIcon: document.getElementById('weatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    tempUnit: document.getElementById('tempUnit'),
    weatherCondition: document.getElementById('weatherCondition'),
    highLow: document.getElementById('highLow'),
    
    // Quick Stats
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    uvIndex: document.getElementById('uvIndex'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    
    // Forecasts
    hourlyForecast: document.getElementById('hourlyForecast'),
    dailyForecast: document.getElementById('dailyForecast'),
    
    // Astronomy
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    moonPhase: document.getElementById('moonPhase'),
    moonrise: document.getElementById('moonrise'),
    moonset: document.getElementById('moonset'),
    
    // AI Section
    aiChatBtn: document.getElementById('aiChatBtn'),
    clothingRec: document.getElementById('clothingRec'),
    activityRec: document.getElementById('activityRec'),
    weatherInsight: document.getElementById('weatherInsight'),
    healthAdvisory: document.getElementById('healthAdvisory'),
    
    // Map
    weatherMap: document.getElementById('weatherMap'),
    
    // Analytics
    analyticsSection: document.getElementById('analyticsSection'),
    weatherChart: document.getElementById('weatherChart'),
    
    // Alerts
    alertsContainer: document.getElementById('alertsContainer'),
    
    // Modals
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    aiChatModal: document.getElementById('aiChatModal'),
    closeChat: document.getElementById('closeChat'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    chatMessages: document.getElementById('chatMessages'),
    voiceInputBtn: document.getElementById('voiceInputBtn'),
    
    // Loading & Status
    loadingOverlay: document.getElementById('loadingOverlay'),
    offlineIndicator: document.getElementById('offlineIndicator'),
};

// ========================================
// Initialization
// ========================================
async function init() {
    console.log('WeatherVision initializing...');
    
    // Load settings from localStorage
    loadSettings();
    
    // Apply theme
    applyTheme(state.settings.theme);
    
    // Initialize map
    initMap();
    
    // Initialize chart
    initChart();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for saved locations
    loadSavedLocations();
    
    // Try to get current location or load default
    await loadWeatherForLocation();
    
    // Hide loading overlay
    hideLoading();
    
    // Set up online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log('WeatherVision ready!');
}

// ========================================
// Settings Management
// ========================================
function loadSettings() {
    const saved = localStorage.getItem('weatherSettings');
    if (saved) {
        Object.assign(state.settings, JSON.parse(saved));
    }
    
    // Apply settings to UI
    document.querySelectorAll('[data-unit]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === state.settings.tempUnit);
    });
    document.querySelectorAll('[data-wind]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wind === state.settings.windUnit);
    });
    document.querySelectorAll('[data-precip]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.precip === state.settings.precipUnit);
    });
    document.getElementById('dailySummaryToggle').checked = state.settings.dailySummary;
    document.getElementById('alertsToggle').checked = state.settings.alerts;
}

function saveSettings() {
    localStorage.setItem('weatherSettings', JSON.stringify(state.settings));
}

function applyTheme(theme) {
    if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearchSubmit();
    });
    elements.searchBtn.addEventListener('click', handleSearchSubmit);
    
    // GPS
    elements.gpsBtn.addEventListener('click', handleGPSLocation);
    
    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Settings
    elements.settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    elements.closeSettings.addEventListener('click', () => closeModal('settingsModal'));
    
    // Settings buttons
    document.querySelectorAll('[data-unit]').forEach(btn => {
        btn.addEventListener('click', () => setTemperatureUnit(btn.dataset.unit));
    });
    document.querySelectorAll('[data-wind]').forEach(btn => {
        btn.addEventListener('click', () => setWindUnit(btn.dataset.wind));
    });
    document.querySelectorAll('[data-precip]').forEach(btn => {
        btn.addEventListener('click', () => setPrecipUnit(btn.dataset.precip));
    });
    document.getElementById('dailySummaryToggle').addEventListener('change', (e) => {
        state.settings.dailySummary = e.target.checked;
        saveSettings();
    });
    document.getElementById('alertsToggle').addEventListener('change', (e) => {
        state.settings.alerts = e.target.checked;
        saveSettings();
    });
    
    // AI Chat
    elements.aiChatBtn.addEventListener('click', () => openModal('aiChatModal'));
    elements.closeChat.addEventListener('click', () => closeModal('aiChatModal'));
    elements.sendChatBtn.addEventListener('click', handleChatSubmit);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });
    elements.voiceInputBtn.addEventListener('click', handleVoiceInput);
    
    // Map layers
    document.querySelectorAll('.map-layer-btn').forEach(btn => {
        btn.addEventListener('click', () => changeMapLayer(btn.dataset.layer));
    });
    
    // Analytics tabs
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.addEventListener('click', () => changeChart(tab.dataset.chart));
    });
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

// ========================================
// Location Services
// ========================================
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (query.length < 2) {
        elements.searchResults.classList.remove('active');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.GEO_API}/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results);
        } else {
            elements.searchResults.classList.remove('active');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    elements.searchResults.innerHTML = results.map(loc => `
        <div class="search-result-item" data-lat="${loc.latitude}" data-lon="${loc.longitude}" data-name="${loc.name}" data-country="${loc.country || ''}">
            <div class="result-name">${loc.name}</div>
            <div class="result-country">${loc.country || ''} ${loc.admin1 ? ', ' + loc.admin1 : ''}</div>
        </div>
    `).join('');
    
    elements.searchResults.classList.add('active');
    
    // Add click listeners
    elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const location = {
                lat: parseFloat(item.dataset.lat),
                lon: parseFloat(item.dataset.lon),
                name: item.dataset.name,
                country: item.dataset.country,
            };
            selectLocation(location);
        });
    });
}

async function handleSearchSubmit() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`${CONFIG.GEO_API}/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            selectLocation({
                lat: loc.latitude,
                lon: loc.longitude,
                name: loc.name,
                country: loc.country || '',
            });
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function selectLocation(location) {
    state.currentLocation = location;
    elements.searchInput.value = '';
    elements.searchResults.classList.remove('active');
    loadWeatherForLocation();
}

async function handleGPSLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get location name
            try {
                const response = await fetch(`${CONFIG.GEO_API}/search?name=&latitude=${latitude}&longitude=${longitude}&count=1`);
                const data = await response.json();
                
                const location = {
                    lat: latitude,
                    lon: longitude,
                    name: data.results?.[0]?.name || 'Current Location',
                    country: data.results?.[0]?.country || '',
                };
                
                selectLocation(location);
            } catch (error) {
                selectLocation({
                    lat: latitude,
                    lon: longitude,
                    name: 'Current Location',
                    country: '',
                });
            }
        },
        (error) => {
            console.error('GPS error:', error);
            alert('Unable to get your location. Please check your permissions.');
            hideLoading();
        }
    );
}

function loadSavedLocations() {
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
        state.savedLocations = JSON.parse(saved);
        renderSavedLocations();
    }
}

function saveLocation() {
    if (!state.currentLocation) return;
    if (state.savedLocations.find(l => l.lat === state.currentLocation.lat && l.lon === state.currentLocation.lon)) {
        return; // Already saved
    }
    if (state.savedLocations.length >= CONFIG.MAX_SAVED_LOCATIONS) {
        state.savedLocations.pop(); // Remove oldest
    }
    state.savedLocations.unshift(state.currentLocation);
    localStorage.setItem('savedLocations', JSON.stringify(state.savedLocations));
    renderSavedLocations();
}

function renderSavedLocations() {
    const container = elements.savedLocations.querySelector('.locations-scroll');
    container.innerHTML = `
        <button class="location-tab active" data-index="0">
            <span class="location-name">Current</span>
        </button>
        ${state.savedLocations.map((loc, i) => `
            <button class="location-tab" data-index="${i + 1}" data-lat="${loc.lat}" data-lon="${loc.lon}">
                <span class="location-name">${loc.name}</span>
            </button>
        `).join('')}
    `;
    
    // Add click listeners
    container.querySelectorAll('.location-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.location-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.dataset.index === '0') {
                // Current location
                loadWeatherForLocation();
            } else {
                selectLocation({
                    lat: parseFloat(tab.dataset.lat),
                    lon: parseFloat(tab.dataset.lon),
                    name: tab.querySelector('.location-name').textContent,
                    country: '',
                });
            }
        });
    });
}

// ========================================
// Weather Data
// ========================================
async function loadWeatherForLocation() {
    const location = state.currentLocation || CONFIG.DEFAULT_LOCATION;
    showLoading();
    
    try {
        // Check cache first
        const cacheKey = `weather_${location.lat}_${location.lon}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
                state.weatherData = data;
                updateUI();
                hideLoading();
                return;
            }
        }
        
        // Fetch weather data
        const weatherData = await fetchWeatherData(location.lat, location.lon);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
            data: weatherData,
            timestamp: Date.now(),
        }));
        
        state.weatherData = weatherData;
        updateUI();
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        
        // Try to load cached data
        const cacheKey = `weather_${location.lat}_${location.lon}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            state.weatherData = JSON.parse(cached).data;
            updateUI();
            showOfflineIndicator();
        } else {
            alert('Unable to fetch weather data. Please try again.');
        }
    }
    
    hideLoading();
}

async function fetchWeatherData(lat, lon) {
    const currentParams = [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
        'visibility',
    ].join(',');
    
    const hourlyParams = [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'wind_speed_10m',
        'wind_direction_10m',
        'uv_index',
    ].join(',');
    
    const dailyParams = [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'precipitation_sum',
        'precipitation_probability_max',
        'rain_sum',
        'showers_sum',
        'snowfall_sum',
        'precipitation_hours',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'wind_direction_10m_dominant',
        'uv_index_max',
        'sunrise',
        'sunset',
    ].join(',');
    
    const url = `${CONFIG.API_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto&forecast_days=14`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    
    return await response.json();
}

// ========================================
// UI Updates
// ========================================
function updateUI() {
    if (!state.weatherData) return;
    
    const data = state.weatherData;
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    // Update hero section
    updateHeroSection(current, daily);
    
    // Update quick stats
    updateQuickStats(current);
    
    // Update hourly forecast
    updateHourlyForecast(hourly);
    
    // Update daily forecast
    updateDailyForecast(daily);
    
    // Update astronomy
    updateAstronomy(daily);
    
    // Update AI insights
    updateAIInsights(current, daily);
    
    // Update map
    updateMap();
    
    // Update chart
    updateChart(hourly);
    
    // Update alerts
    updateAlerts(current, daily);
    
    // Save location
    saveLocation();
}

function updateHeroSection(current, daily) {
    const location = state.currentLocation || CONFIG.DEFAULT_LOCATION;
    elements.currentLocation.textContent = `${location.name}${location.country ? ', ' + location.country : ''}`;
    elements.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    
    // Temperature
    const temp = convertTemperature(current.temperature_2m);
    elements.currentTemp.textContent = Math.round(temp.value) + '°';
    elements.tempUnit.textContent = temp.unit;
    
    // Weather condition
    const condition = getWeatherCondition(current.weather_code);
    elements.weatherCondition.textContent = condition.text;
    elements.weatherIcon.querySelector('.weather-emoji').textContent = condition.emoji;
    
    // High/Low
    const high = convertTemperature(daily.temperature_2m_max[0]);
    const low = convertTemperature(daily.temperature_2m_min[0]);
    elements.highLow.textContent = `H: ${Math.round(high.value)}° L: ${Math.round(low.value)}°`;
    
    // Background
    elements.heroBackground.className = 'hero-background ' + condition.bgClass;
}

function updateQuickStats(current) {
    const temp = convertTemperature(current.apparent_temperature);
    elements.feelsLike.textContent = Math.round(temp.value) + '°';
    
    elements.humidity.textContent = current.relative_humidity_2m + '%';
    
    const wind = convertWindSpeed(current.wind_speed_10m);
    elements.windSpeed.textContent = Math.round(wind.value) + ' ' + wind.unit;
    
    elements.uvIndex.textContent = current.uv_index || '0';
    
    elements.pressure.textContent = Math.round(current.pressure_msl) + ' hPa';
    
    const vis = current.visibility / 1000;
    elements.visibility.textContent = vis.toFixed(1) + ' km';
}

function updateHourlyForecast(hourly) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get next 24 hours
    const hours = [];
    for (let i = 0; i < 24; i++) {
        const idx = (currentHour + i) % 24;
        hours.push({
            time: hourly.time[idx],
            temp: hourly.temperature_2m[idx],
            code: hourly.weather_code[idx],
            precip: hourly.precipitation_probability[idx] || 0,
        });
    }
    
    const container = elements.hourlyForecast.querySelector('.forecast-scroll');
    container.innerHTML = hours.map((h, i) => {
        const time = new Date(h.time);
        const condition = getWeatherCondition(h.code);
        const temp = convertTemperature(h.temp);
        
        return `
            <div class="hourly-card">
                <div class="hour">${i === 0 ? 'Now' : time.getHours() + ':00'}</div>
                <div class="hour-icon">${condition.emoji}</div>
                <div class="hour-temp">${Math.round(temp.value)}°</div>
            </div>
        `;
    }).join('');
}

function updateDailyForecast(daily) {
    const container = elements.dailyForecast;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    container.innerHTML = daily.time.slice(0, 7).map((date, i) => {
        const d = new Date(date);
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
        const condition = getWeatherCondition(daily.weather_code[i]);
        const high = convertTemperature(daily.temperature_2m_max[i]);
        const low = convertTemperature(daily.temperature_2m_min[i]);
        
        return `
            <div class="daily-card">
                <span class="day-name">${dayName}</span>
                <span class="day-icon">${condition.emoji}</span>
                <span class="day-condition">${condition.text}</span>
                <div class="day-temps">
                    <span class="temp-high">${Math.round(high.value)}°</span>
                    <span class="temp-low">${Math.round(low.value)}°</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateAstronomy(daily) {
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    
    elements.sunrise.textContent = formatTime(sunrise);
    elements.sunset.textContent = formatTime(sunset);
    
    // Calculate moon phase
    const moonPhase = getMoonPhase();
    elements.moonPhase.textContent = moonPhase.name;
    
    // Mock moonrise/moonset
    elements.moonrise.textContent = formatTime(new Date(sunrise.getTime() - 6 * 60 * 60 * 1000));
    elements.moonset.textContent = formatTime(new Date(sunset.getTime() + 6 * 60 * 60 * 1000));
}

function updateAIInsights(current, daily) {
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const wind = current.wind_speed_10m;
    const uv = current.uv_index || 0;
    const code = current.weather_code;
    
    // Clothing recommendation
    elements.clothingRec.textContent = getClothingRecommendation(temp, humidity, wind);
    
    // Activity suggestion
    elements.activityRec.textContent = getActivitySuggestion(temp, code, wind);
    
    // Weather insight
    elements.weatherInsight.textContent = getWeatherInsight(current, daily);
    
    // Health advisory
    elements.healthAdvisory.textContent = getHealthAdvisory(uv, temp, humidity);
}

function updateMap() {
    if (!state.map || !state.currentLocation) return;
    
    state.map.setView([state.currentLocation.lat, state.currentLocation.lon], 10);
}

function updateChart(hourly) {
    if (!state.chart) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get next 24 hours data
    const labels = [];
    const data = [];
    
    for (let i = 0; i < 24; i++) {
        const idx = (currentHour + i) % 24;
        const time = new Date(hourly.time[idx]);
        labels.push(time.getHours() + ':00');
        
        switch (state.currentChartType) {
            case 'temp':
                data.push(convertTemperature(hourly.temperature_2m[idx]).value);
                break;
            case 'humidity':
                data.push(hourly.relative_humidity_2m[idx]);
                break;
            case 'precip':
                data.push(hourly.precipitation[idx] || 0);
                break;
        }
    }
    
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = data;
    state.chart.update();
}

function updateAlerts(current, daily) {
    // Check for severe weather
    const alerts = [];
    
    if (current.uv_index >= 8) {
        alerts.push({
            type: 'warning',
            title: 'High UV Index',
            message: 'UV index is very high. Avoid prolonged sun exposure.',
        });
    }
    
    if (current.temperature_2m > 35) {
        alerts.push({
            type: 'danger',
            title: 'Extreme Heat',
            message: 'Temperature is extremely high. Stay hydrated.',
        });
    }
    
    if (current.temperature_2m < -10) {
        alerts.push({
            type: 'danger',
            title: 'Extreme Cold',
            message: 'Temperature is extremely low. Dress warmly.',
        });
    }
    
    if (current.wind_speed_10m > 50) {
        alerts.push({
            type: 'danger',
            title: 'High Wind Warning',
            message: 'Strong winds expected. Secure loose objects.',
        });
    }
    
    if (daily.precipitation_sum[0] > 20) {
        alerts.push({
            type: 'warning',
            title: 'Heavy Rain Expected',
            message: 'Heavy precipitation expected. Be cautious outdoors.',
        });
    }
    
    if (alerts.length === 0) {
        elements.alertsContainer.innerHTML = '<p class="no-alerts">No active weather alerts</p>';
    } else {
        elements.alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-card">
                <div class="alert-icon">${alert.type === 'danger' ? '⚠️' : '🌧️'}</div>
                <div class="alert-content">
                    <h3>${alert.title}</h3>
                    <p>${alert.message}</p>
                </div>
            </div>
        `).join('');
    }
}

// ========================================
// Unit Conversions
// ========================================
function convertTemperature(celsius) {
    let value, unit;
    
    switch (state.settings.tempUnit) {
        case 'fahrenheit':
            value = (celsius * 9/5) + 32;
            unit = 'F';
            break;
        case 'kelvin':
            value = celsius + 273.15;
            unit = 'K';
            break;
        default:
            value = celsius;
            unit = 'C';
    }
    
    return { value, unit };
}

function convertWindSpeed(kmh) {
    let value, unit;
    
    switch (state.settings.windUnit) {
        case 'ms':
            value = kmh / 3.6;
            unit = 'm/s';
            break;
        case 'mph':
            value = kmh * 0.621371;
            unit = 'mph';
            break;
        default:
            value = kmh;
            unit = 'km/h';
    }
    
    return { value, unit };
}

// ========================================
// Weather Helpers
// ========================================
function getWeatherCondition(code) {
    const conditions = {
        0: { text: 'Clear sky', emoji: '☀️', bgClass: 'sunny' },
        1: { text: 'Mainly clear', emoji: '🌤️', bgClass: 'sunny' },
        2: { text: 'Partly cloudy', emoji: '⛅', bgClass: 'cloudy' },
        3: { text: 'Overcast', emoji: '☁️', bgClass: 'cloudy' },
        45: { text: 'Foggy', emoji: '🌫️', bgClass: 'foggy' },
        48: { text: 'Depositing rime fog', emoji: '🌫️', bgClass: 'foggy' },
        51: { text: 'Light drizzle', emoji: '🌧️', bgClass: 'rainy' },
        53: { text: 'Moderate drizzle', emoji: '🌧️', bgClass: 'rainy' },
        55: { text: 'Dense drizzle', emoji: '🌧️', bgClass: 'rainy' },
        61: { text: 'Slight rain', emoji: '🌧️', bgClass: 'rainy' },
        63: { text: 'Moderate rain', emoji: '🌧️', bgClass: 'rainy' },
        65: { text: 'Heavy rain', emoji: '🌧️', bgClass: 'rainy' },
        71: { text: 'Slight snow', emoji: '🌨️', bgClass: 'snowy' },
        73: { text: 'Moderate snow', emoji: '🌨️', bgClass: 'snowy' },
        75: { text: 'Heavy snow', emoji: '❄️', bgClass: 'snowy' },
        77: { text: 'Snow grains', emoji: '🌨️', bgClass: 'snowy' },
        80: { text: 'Slight rain showers', emoji: '🌦️', bgClass: 'rainy' },
        81: { text: 'Moderate rain showers', emoji: '🌦️', bgClass: 'rainy' },
        82: { text: 'Violent rain showers', emoji: '⛈️', bgClass: 'rainy' },
        85: { text: 'Slight snow showers', emoji: '🌨️', bgClass: 'snowy' },
        86: { text: 'Heavy snow showers', emoji: '❄️', bgClass: 'snowy' },
        95: { text: 'Thunderstorm', emoji: '⛈️', bgClass: 'stormy' },
        96: { text: 'Thunderstorm with hail', emoji: '⛈️', bgClass: 'stormy' },
        99: { text: 'Thunderstorm with heavy hail', emoji: '⛈️', bgClass: 'stormy' },
    };
    
    return conditions[code] || { text: 'Unknown', emoji: '❓', bgClass: 'cloudy' };
}

function getMoonPhase() {
    const phases = [
        { name: 'New Moon', emoji: '🌑' },
        { name: 'Waxing Crescent', emoji: '🌒' },
        { name: 'First Quarter', emoji: '🌓' },
        { name: 'Waxing Gibbous', emoji: '🌔' },
        { name: 'Full Moon', emoji: '🌕' },
        { name: 'Waning Gibbous', emoji: '🌖' },
        { name: 'Last Quarter', emoji: '🌗' },
        { name: 'Waning Crescent', emoji: '🌘' },
    ];
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Calculate moon phase (simplified)
    const jd = Math.floor((1461 * (year + 4800 + (month - 14) / 12)) / 4) +
               Math.floor((367 * (month - 2 - 12 * ((month - 14) / 12))) / 12) -
               Math.floor((3 * Math.floor(((year + 4900 + (month - 14) / 12) / 100))) / 4) + day - 32075;
    const daysSinceNew = (jd - 2451550.1) % 29.53;
    const phaseIndex = Math.floor((daysSinceNew / 29.53) * 8) % 8;
    
    return phases[phaseIndex];
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ========================================
// AI Recommendations
// ========================================
function getClothingRecommendation(temp, humidity, wind) {
    if (temp < 0) return 'Wear heavy winter coat, insulated boots, and warm layers. Don\'t forget gloves and a hat!';
    if (temp < 10) return 'Wear a warm jacket, sweater, and long pants. Consider layers for changing temperatures.';
    if (temp < 20) return 'A light jacket or sweater is ideal. Wear comfortable long pants.';
    if (temp < 25) return 'Wear light, breathable clothing. A t-shirt with light pants or shorts would be comfortable.';
    if (temp < 30) return 'Wear light, loose-fitting clothes. Shorts and t-shirts are perfect. Don\'t forget sunscreen!';
    return 'Wear very light, breathable clothing. Stay hydrated and avoid direct sunlight during peak hours.';
}

function getActivitySuggestion(temp, code, wind) {
    if (code >= 61 && code <= 65) return 'Indoor activities recommended. If going out, bring an umbrella!';
    if (code >= 71 && code <= 77) return 'Great day for indoor activities or enjoying hot beverages by the window.';
    if (code >= 95) return 'Stay indoors! Severe weather conditions. Avoid any outdoor activities.';
    if (wind > 30) return 'Not ideal for outdoor sports. Consider indoor exercises or yoga.';
    if (temp > 30) return 'Early morning or evening exercise recommended. Stay hydrated!';
    if (temp < 5) return 'Good for indoor workouts. If going out, dress warmly and limit exposure.';
    return 'Perfect weather for outdoor activities! Go for a walk, run, or enjoy sports.';
}

function getWeatherInsight(current, daily) {
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const pressure = current.pressure_msl;
    
    let insight = '';
    
    if (pressure < 1000) {
        insight += 'Low pressure system detected. Expect possible precipitation and clouds. ';
    } else if (pressure > 1020) {
        insight += 'High pressure system present. Generally clear and stable weather. ';
    }
    
    if (humidity > 80) {
        insight += 'High humidity may make it feel warmer than actual temperature. ';
    }
    
    if (daily.precipitation_sum[0] > 10) {
        insight += 'Significant precipitation expected today. Plan accordingly!';
    }
    
    return insight || 'Weather conditions are stable and comfortable for outdoor activities.';
}

function getHealthAdvisory(uv, temp, humidity) {
    let advisory = '';
    
    if (uv >= 8) {
        advisory += '⚠️ Very high UV! Use SPF 30+ sunscreen, wear sunglasses and a hat. ';
    } else if (uv >= 5) {
        advisory += 'Moderate UV. Consider sunscreen for extended outdoor activities. ';
    }
    
    if (temp > 35) {
        advisory += '🌡️ Extreme heat! Stay hydrated, avoid strenuous activities, seek shade.';
    } else if (temp > 30) {
        advisory += 'Hot weather. Drink plenty of water and take breaks in shade.';
    }
    
    if (humidity > 85) {
        advisory += '💧 High humidity may cause discomfort. Stay in air-conditioned spaces if possible.';
    }
    
    return advisory || '✅ Conditions are favorable for outdoor activities. Enjoy your day!';
}

// ========================================
// AI Chat
// ========================================
function handleChatSubmit() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    elements.chatInput.value = '';
    
    // Generate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function addChatMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function generateAIResponse(message) {
    const lower = message.toLowerCase();
    const data = state.weatherData?.current;
    
    if (lower.includes('rain') || lower.includes('rainy')) {
        if (data?.precipitation > 0) {
            return `Yes, it's currently raining. Precipitation is ${data.precipitation.toFixed(1)}mm. Don't forget your umbrella! 🌧️`;
        } else {
            return `No rain expected right now, but check the hourly forecast for changes.`;
        }
    }
    
    if (lower.includes('temperature') || lower.includes('temp')) {
        const temp = convertTemperature(data?.temperature_2m || 0);
        return `Current temperature is ${Math.round(temp.value)}°${temp.unit}. It feels like ${Math.round(convertTemperature(data?.apparent_temperature || 0).value)}°${temp.unit}.`;
    }
    
    if (lower.includes('humid') || lower.includes('humidity')) {
        return `Current humidity is ${data?.relative_humidity_2m || '--'}%. ${data?.relative_humidity_2m > 70 ? 'It\'s quite humid today!' : 'Humidity levels are comfortable.'}`;
    }
    
    if (lower.includes('wind')) {
        const wind = convertWindSpeed(data?.wind_speed_10m || 0);
        return `Wind speed is ${Math.round(wind.value)} ${wind.unit}. ${data?.wind_speed_10m > 20 ? 'It\'s quite windy today!' : 'Winds are light.'}`;
    }
    
    if (lower.includes('sun') || lower.includes('sunny')) {
        const condition = getWeatherCondition(data?.weather_code || 0);
        return `Current conditions: ${condition.text}. ${condition.text.includes('Clear') || condition.text.includes('Mainly') ? 'Perfect for outdoor activities!' : 'Maybe check the forecast for better sun opportunities.'}`;
    }
    
    if (lower.includes('cold') || lower.includes('hot') || lower.includes('warm')) {
        const temp = convertTemperature(data?.temperature_2m || 0);
        if (temp.value < 10) return `It\'s cold! Temperature is ${Math.round(temp.value)}°${temp.unit}. Dress warmly!`;
        if (temp.value > 30) return `It\'s hot! Temperature is ${Math.round(temp.value)}°${temp.unit}. Stay cool and hydrated!`;
        return `Temperature is comfortable at ${Math.round(temp.value)}°${temp.unit}.`;
    }
    
    if (lower.includes('best time') || lower.includes('when')) {
        return `The best time for outdoor activities is typically early morning or late afternoon when temperatures are milder. Check the hourly forecast for specific recommendations!`;
    }
    
    if (lower.includes('outfit') || lower.includes('wear') || lower.includes('clothes')) {
        return getClothingRecommendation(data?.temperature_2m || 20, data?.relative_humidity_2m || 50, data?.wind_speed_10m || 0);
    }
    
    if (lower.includes('uv') || lower.includes('sunburn')) {
        return `UV index is ${data?.uv_index || 0}. ${data?.uv_index >= 5 ? 'Protect your skin with sunscreen and clothing!' : 'UV levels are low.'}`;
    }
    
    // Default responses
    const responses = [
        `I can help you with weather information! Try asking about temperature, rain, wind, or what to wear.`,
        `That's an interesting question! I can tell you about current conditions, forecasts, or give you recommendations.`,
        `I'm your weather assistant! Ask me anything about the weather or get suggestions for your day.`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice input is not supported in your browser');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    
    elements.voiceInputBtn.classList.add('listening');
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.chatInput.value = transcript;
        elements.voiceInputBtn.classList.remove('listening');
    };
    
    recognition.onerror = () => {
        elements.voiceInputBtn.classList.remove('listening');
    };
    
    recognition.onend = () => {
        elements.voiceInputBtn.classList.remove('listening');
    };
    
    recognition.start();
}

// ========================================
// Map
// ========================================
function initMap() {
    const location = state.currentLocation || CONFIG.DEFAULT_LOCATION;
    
    state.map = L.map('weatherMap').setView([location.lat, location.lon], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(state.map);
    
    // Add marker
    const marker = L.marker([location.lat, location.lon]).addTo(state.map);
    marker.bindPopup(`<b>${location.name}</b>`).openPopup();
}

function changeMapLayer(layer) {
    // Update active button
    document.querySelectorAll('.map-layer-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layer);
    });
    
    // In a real app, this would load different weather overlay tiles
    // For demo, we'll just show a message
    console.log('Map layer changed to:', layer);
}

// ========================================
// Chart
// ========================================
function initChart() {
    const ctx = elements.weatherChart.getContext('2d');
    
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#0EA5E9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function changeChart(type) {
    state.currentChartType = type;
    
    // Update active tab
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.chart === type);
    });
    
    // Update chart
    if (state.weatherData) {
        updateChart(state.weatherData.hourly);
    }
}

// ========================================
// Settings Functions
// ========================================
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    state.settings.theme = next;
    applyTheme(next);
    saveSettings();
}

function setTemperatureUnit(unit) {
    state.settings.tempUnit = unit;
    document.querySelectorAll('[data-unit]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    saveSettings();
    if (state.weatherData) updateUI();
}

function setWindUnit(unit) {
    state.settings.windUnit = unit;
    document.querySelectorAll('[data-wind]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wind === unit);
    });
    saveSettings();
    if (state.weatherData) updateUI();
}

function setPrecipUnit(unit) {
    state.settings.precipUnit = unit;
    document.querySelectorAll('[data-precip]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.precip === unit);
    });
    saveSettings();
}

// ========================================
// Modal Functions
// ========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// ========================================
// Loading & Status
// ========================================
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showOfflineIndicator() {
    elements.offlineIndicator.classList.add('show');
}

function hideOfflineIndicator() {
    elements.offlineIndicator.classList.remove('show');
}

function handleOnline() {
    state.isOnline = true;
    hideOfflineIndicator();
    loadWeatherForLocation();
}

function handleOffline() {
    state.isOnline = false;
    showOfflineIndicator();
}

// ========================================
// Utility Functions
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', init);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
