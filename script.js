// add your OpenWeather API key here
const apiKey = "72a714b940e449f915cd44f74930945a";

const weatherUrl =
    "https://api.openweathermap.org/data/2.5/weather";

const forecastUrl =
    "https://api.openweathermap.org/data/2.5/forecast";


// html elements used in the app
const cityInput =
    document.getElementById("cityInput");

const searchBtn =
    document.getElementById("searchBtn");

const message =
    document.getElementById("message");

const welcomeBox =
    document.getElementById("welcomeBox");

const weatherContent =
    document.getElementById("weatherContent");

const cityName =
    document.getElementById("cityName");

const currentDate =
    document.getElementById("currentDate");

const currentTime =
    document.getElementById("currentTime");

const weatherIcon =
    document.getElementById("weatherIcon");

const temperature =
    document.getElementById("temperature");

const description =
    document.getElementById("description");

const feelsLike =
    document.getElementById("feelsLike");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const forecastContainer =
    document.getElementById("forecastContainer");


// stores the searched city's timezone
let activeTimezone = 0;


// search button click
searchBtn.addEventListener("click", function () {

    searchCity();

});


// pressing enter also starts search
cityInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        searchCity();
    }

});


// reads the city from input
function searchCity() {

    const city = cityInput.value.trim();

    if (city === "") {

        showMessage("Please enter a city name.");

        return;
    }

    getWeatherByCity(city);
}


// gets current weather by city name
async function getWeatherByCity(city) {

    showMessage("Loading weather...");

    try {

        const api =
            `${weatherUrl}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(api);


        if (!response.ok) {

            if (response.status === 404) {
                throw new Error("City not found. Try another city.");
            }

            if (response.status === 401) {
                throw new Error("API key is invalid.");
            }

            throw new Error("Unable to load weather.");
        }


        const data = await response.json();


        // update current weather
        updateCurrentWeather(data);


        // forecast uses the exact coordinates
        await getForecast(
            data.coord.lat,
            data.coord.lon,
            data.timezone
        );


        cityInput.value = data.name;

        showMessage("");

    } catch (error) {

        showMessage(error.message);

        console.error("Weather error:", error);
    }

}


// gets weather from GPS coordinates
async function getWeatherByCoordinates(
    latitude,
    longitude
) {

    showMessage("Loading weather for your location...");

    try {

        const api =
            `${weatherUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

        const response = await fetch(api);


        if (!response.ok) {

            if (response.status === 401) {
                throw new Error("API key is invalid.");
            }

            throw new Error(
                "Unable to load your local weather."
            );
        }


        const data = await response.json();


        updateCurrentWeather(data);


        await getForecast(
            data.coord.lat,
            data.coord.lon,
            data.timezone
        );


        cityInput.value = data.name;

        showMessage("");

    } catch (error) {

        showMessage(error.message);

        console.error("GPS weather error:", error);
    }

}


// puts current weather into the page
function updateCurrentWeather(data) {

    activeTimezone = data.timezone;


    cityName.textContent =
        `${data.name}, ${data.sys.country}`;


    temperature.textContent =
        `${Math.round(data.main.temp)}°C`;


    description.textContent =
        makeTitle(data.weather[0].description);


    feelsLike.textContent =
        `Feels like ${Math.round(data.main.feels_like)}°C`;


    humidity.textContent =
        `${data.main.humidity}%`;


    // API wind value is m/s, so convert to km/h
    const windKm =
        Math.round(data.wind.speed * 3.6);


    windSpeed.textContent =
        `${windKm} km/h`;


    const iconCode =
        data.weather[0].icon;


    weatherIcon.src =
        `https://openweathermap.org/img/wn/${iconCode}@4x.png`;


    weatherIcon.alt =
        data.weather[0].description;


    // show weather and remove welcome screen
    welcomeBox.classList.add("hidden");

    weatherContent.classList.remove("hidden");


    updateDateAndTime();
}


// gets five day forecast data
async function getForecast(
    latitude,
    longitude,
    timezone
) {

    const api =
        `${forecastUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    const response = await fetch(api);


    if (!response.ok) {
        throw new Error("Unable to load forecast.");
    }


    const data = await response.json();


    updateForecast(
        data.list,
        timezone
    );
}


// builds three forecast cards
function updateForecast(list, timezone) {

    forecastContainer.innerHTML = "";


    const nextDays =
        pickNextThreeDays(list, timezone);


    nextDays.forEach(function (item) {

        const card =
            document.createElement("div");


        card.className = "forecast-card";


        // convert forecast time to searched city time
        const cityDate =
            getCityDate(item.dt, timezone);


        const dayName =
            cityDate.toLocaleDateString(
                "en-US",
                {
                    weekday: "short",
                    timeZone: "UTC"
                }
            );


        const shortDate =
            cityDate.toLocaleDateString(
                "en-US",
                {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC"
                }
            );


        const iconCode =
            item.weather[0].icon;


        const temp =
            Math.round(item.main.temp);


        const weatherText =
            makeTitle(
                item.weather[0].description
            );


        card.innerHTML = `
            <p class="forecast-day">
                ${dayName}
            </p>

            <p class="forecast-date">
                ${shortDate}
            </p>

            <img
                src="https://openweathermap.org/img/wn/${iconCode}@2x.png"
                alt="${item.weather[0].description}"
            >

            <p class="forecast-temp">
                ${temp}°C
            </p>

            <p class="forecast-description">
                ${weatherText}
            </p>
        `;


        forecastContainer.appendChild(card);
    });

}


// selects one forecast for each next day
function pickNextThreeDays(list, timezone) {

    const selectedDays = {};


    // current date in searched city's timezone
    const nowUnix =
        Math.floor(Date.now() / 1000);


    const today =
        getDateKey(nowUnix, timezone);


    list.forEach(function (item) {

        const dateKey =
            getDateKey(item.dt, timezone);


        // current day is not included
        if (dateKey === today) {
            return;
        }


        const cityDate =
            getCityDate(item.dt, timezone);


        const hour =
            cityDate.getUTCHours();


        // first entry is temporary choice
        if (!selectedDays[dateKey]) {

            selectedDays[dateKey] = {
                item: item,
                difference: Math.abs(hour - 12)
            };

            return;
        }


        // choose entry closest to 12 PM
        const difference =
            Math.abs(hour - 12);


        if (
            difference <
            selectedDays[dateKey].difference
        ) {

            selectedDays[dateKey] = {
                item: item,
                difference: difference
            };
        }

    });


    return Object.values(selectedDays)
        .slice(0, 3)
        .map(function (day) {
            return day.item;
        });
}


// creates a date using the searched city's timezone
function getCityDate(unixTime, timezone) {

    return new Date(
        (unixTime + timezone) * 1000
    );
}


// makes a YYYY-MM-DD key for each city day
function getDateKey(unixTime, timezone) {

    const date =
        getCityDate(unixTime, timezone);


    const year =
        date.getUTCFullYear();


    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getUTCDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


// updates date and time automatically
function updateDateAndTime() {

    function refreshClock() {

        const nowUnix =
            Math.floor(Date.now() / 1000);


        const cityDate =
            getCityDate(
                nowUnix,
                activeTimezone
            );


        currentDate.textContent =
            cityDate.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC"
                }
            );


        currentTime.textContent =
            cityDate.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC"
                }
            );
    }


    refreshClock();


    // stop old timer before starting a new one
    clearInterval(window.weatherClock);


    window.weatherClock =
        setInterval(
            refreshClock,
            60000
        );
}


// changes "overcast clouds" to "Overcast Clouds"
function makeTitle(text) {

    return text
        .split(" ")
        .map(function (word) {

            return (
                word.charAt(0).toUpperCase()
                + word.slice(1)
            );

        })
        .join(" ");
}


// shows small status messages
function showMessage(text) {

    message.textContent = text;
}


// asks browser for current GPS location
function loadCurrentLocation() {

    // no Bengaluru fallback here
    if (!navigator.geolocation) {

        showMessage(
            "Location is not supported. Search for a city."
        );

        return;
    }


    showMessage(
        "Getting your current location..."
    );


    navigator.geolocation.getCurrentPosition(

        // location permission allowed
        function (position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            getWeatherByCoordinates(
                latitude,
                longitude
            );
        },


        // location permission denied or GPS failed
        function (error) {

            console.log(
                "Location error:",
                error.message
            );


            if (error.code === 1) {

                showMessage(
                    "Location access denied. Search for a city."
                );

            } else if (error.code === 2) {

                showMessage(
                    "Your location is unavailable. Search for a city."
                );

            } else if (error.code === 3) {

                showMessage(
                    "Location request timed out. Search for a city."
                );

            } else {

                showMessage(
                    "Could not get your location. Search for a city."
                );
            }

        },


        // GPS settings
        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0
        }

    );
}


// start GPS when page opens
window.addEventListener(
    "load",
    function () {

        loadCurrentLocation();

    }
);