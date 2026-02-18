// =====================================
// WeatherApp Constructor Function
// =====================================
function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // Store DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    this.init();
}

// =====================================
// Initialize App
// =====================================
WeatherApp.prototype.init = function() {
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));

    this.cityInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    this.loadRecentSearches();
    this.showWelcome();
};

// =====================================
// Welcome Screen
// =====================================
WeatherApp.prototype.showWelcome = function() {
    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h3>🌍 Welcome to SkyFetch</h3>
            <p>Enter a city name to see current weather and 5-day forecast!</p>
        </div>
    `;
};

// =====================================
// Handle Search
// =====================================
WeatherApp.prototype.handleSearch = function() {
    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name.");
        return;
    }

    if (city.length < 2) {
        this.showError("City name must be at least 2 characters.");
        return;
    }

    this.saveToHistory(city);   // ✅ Save search
    this.getWeather(city);
    this.cityInput.value = '';
};

// =====================================
// Save To localStorage
// =====================================
WeatherApp.prototype.saveToHistory = function(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];

    searches = searches.filter(item => item.toLowerCase() !== city.toLowerCase());
    searches.unshift(city);

    if (searches.length > 5) {
        searches.pop();
    }

    localStorage.setItem("recentSearches", JSON.stringify(searches));
};

// =====================================
// Load Recent Searches
// =====================================
WeatherApp.prototype.loadRecentSearches = function() {
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];

    if (searches.length === 0) return;

    this.renderHistory(searches);
};

// =====================================
// Render History
// =====================================
WeatherApp.prototype.renderHistory = function(searches) {
    const historyHTML = `
        <div class="history-section">
            <h4>Recent Searches</h4>
            <ul>
                ${searches.map(city => 
                    `<li class="history-item">${city}</li>`
                ).join('')}
            </ul>
            <button id="clear-history">Clear History</button>
        </div>
    `;

    this.weatherDisplay.innerHTML += historyHTML;

    document.querySelectorAll(".history-item").forEach(item => {
        item.addEventListener("click", () => {
            this.getWeather(item.textContent);
        });
    });

    document.getElementById("clear-history")
        .addEventListener("click", this.clearHistory.bind(this));
};

// =====================================
// Clear History
// =====================================
WeatherApp.prototype.clearHistory = function() {
    localStorage.removeItem("recentSearches");
    this.weatherDisplay.innerHTML = "";
    this.showWelcome();
};

// =====================================
// Get Weather + Forecast
// =====================================
WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = "Searching...";

    const currentWeatherUrl =
        `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentWeather, forecastData] = await Promise.all([
            axios.get(currentWeatherUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);

        this.loadRecentSearches(); // refresh history display

    } catch (error) {
        console.error("Error:", error);

        if (error.response && error.response.status === 404) {
            this.showError("City not found. Please check spelling.");
        } else {
            this.showError("Something went wrong. Please try again.");
        }

    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = "Search";
    }
};

// =====================================
// Get Forecast Data
// =====================================
WeatherApp.prototype.getForecast = async function(city) {
    const url =
        `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    const response = await axios.get(url);
    return response.data;
};

// =====================================
// Display Current Weather
// =====================================
WeatherApp.prototype.displayWeather = function(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img class="weather-icon" src="${iconUrl}" />
            <div class="temperature">${temperature}°C</div>
            <div class="description">${description}</div>
        </div>
    `;

    this.weatherDisplay.innerHTML = weatherHTML;
};

// =====================================
// Process Forecast
// =====================================
WeatherApp.prototype.processForecastData = function(data) {
    const daily = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    );

    return daily.slice(0, 5);
};

// =====================================
// Display Forecast
// =====================================
WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(day => {
        const date = new Date(day.dt * 1000);
        const dayName =
            date.toLocaleDateString('en-US', { weekday: 'short' });

        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" />
                <div class="forecast-temp">${temp}°C</div>
                <div class="forecast-desc">${description}</div>
            </div>
        `;
    }).join('');

    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML += forecastSection;
};

// =====================================
// Loading State
// =====================================
WeatherApp.prototype.showLoading = function() {
    this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    `;
};

// =====================================
// Error Display
// =====================================
WeatherApp.prototype.showError = function(message) {
    this.weatherDisplay.innerHTML = `
        <div class="error-message">
            <h3>❌ Oops!</h3>
            <p>${message}</p>
        </div>
    `;
};

// =====================================
// Create App Instance
// =====================================
const app = new WeatherApp('2d526502b4edcc24cbdee29970299226');

console.log("Version 4 - Full localStorage feature added");