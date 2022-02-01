// Variables to hold html elements
let userSearchForm = document.getElementById("userSearchForm");
let userCityInput = document.getElementById("search-city");
let searchBtn = document.getElementById("searchBtn");
let citiesListContainer = document.getElementById("citiesContainer");
let currentWeatherContainer = document.getElementById("currentWeatherContainer");
let futureWeatherContainer = document.getElementById("futureWeatherContainer");
let forecastHeader = document.getElementById("forecastHeader");

// API key for the OpenWeather One Call API
let APIKey = "b95fc16b0f47f0fa5ddbb3875b0c4181";
// Variable to hold the name of city entered by user
let city;
// Number of days for which weather forcast is displayed
let noOfDays = 5;
// The list containing all the cities searched. 
let citySearchList = JSON.parse(localStorage.getItem("searchHistory")) || [];

// Event handler for search city form submission
userSearchForm.addEventListener("submit", formSubmitHandler);
// Event handler for button click in search history
citiesListContainer.addEventListener("click", cityButtonClickHandler);

// Calls this function when page loads
displaySearchHistory();

// Displays the names of cities in user search history
function displaySearchHistory() {
    for (let i = 0; i < citySearchList.length; i++) {
        let cityButton = document.createElement("button");
        cityButton.textContent = citySearchList[i];

        citiesListContainer.appendChild(cityButton);
    }
}

// Handler for user search form submission
function formSubmitHandler(event) {
    event.preventDefault();

    city = userCityInput.value.trim();

    if (city) {
        getWeatherDetails();
        userCityInput.value = "";
    }
    else {
        alert("Enter a city name");
    }
}

// Handles the button click in search history
function cityButtonClickHandler(event) {
    if (event.target.tagName === "BUTTON") {
        city = event.target.textContent;
        getWeatherDetails();
    }
}

// Gets the weather details for a city
function getWeatherDetails() {
    // Clears the current and forecast weather container
    currentWeatherContainer.innerHTML = "";
    futureWeatherContainer.innerHTML = "";
    // Clears the border
    currentWeatherContainer.style.borderStyle = "none";
    // Hides the 5 day forecast header
    forecastHeader.style.display = "none";

    getCoordinatesOfCity();
}

// Gets the latitude and longitude of a city
function getCoordinatesOfCity() {
    // Open Weather Map's Geocoding API to get the coordinates of a city
    let queryURL = "http://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=1&appid=" + APIKey;
    fetch(queryURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                currentWeatherContainer.textContent = "Error: " + response.statusText;
            }
        })
        .then(function (data) {
            // Gets the latitude and longitude as an array
            let locationArray = [];
            locationArray.push(data[0].lat);
            locationArray.push(data[0].lon);
            getCityWeather(locationArray);
            addCityToSearchHistory();
        })
        .catch(function (error) {
            // Displays error
            currentWeatherContainer.textContent = error;
        })
}

// Gets the present and future weather of a city
function getCityWeather(locationArray) {
    let queryURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + locationArray[0] + "&lon=" + locationArray[1] + "&exclude=minutely,hourly,alerts&appid=" + APIKey + "&units=imperial";
    fetch(queryURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                currentWeatherContainer.textContent = "Error: " + response.statusText;
            }
        })
        .then(function (data) {
            // console.log(data);
            displayCurrentWeatherForCity(data.current, data.timezone_offset);
            displayWeatherForecast(data.daily, data.timezone_offset);
        })
        .catch(function (error) {
            currentWeatherContainer.textContent = "Unable to connect to server: " + error;
        })
}

// Adds the city to search history
function addCityToSearchHistory() {
    // Adds the city only if it is not already there in search history
    if (citySearchList.indexOf(city) === -1) {
        // Adds to local storage
        citySearchList.push(city);
        // Only recently searched 10 cities are stored in local storage
        if (citySearchList.length > 10) {
            citySearchList.shift();
        }
        localStorage.setItem("searchHistory", JSON.stringify(citySearchList));

        // Adds a button to city search list.
        let cityButton = document.createElement("button");
        cityButton.textContent = city;

        citiesListContainer.appendChild(cityButton);
    }
}

// Displays the current weather for city
function displayCurrentWeatherForCity(data, timezoneOffset) {
    // console.log(timezoneOffset);
    // Gets the date
    let unixTime = data.dt + timezoneOffset;
    let time = new Date(unixTime * 1000);
    let date = (time.getUTCMonth() + 1) + "/" + time.getUTCDate() + "/" + time.getUTCFullYear();

    // Gets the required data
    let temperature = data.temp + " °F";
    let humidity = data.humidity + " %";
    let windSpeed = data.wind_speed + " MPH";
    let weatherIcon = data.weather[0].icon;
    let uvIndex = data.uvi;

    // Creates DOM elements to dispay the data
    let title = document.createElement("h2");
    title.textContent = city + " (" + date + ")";

    let iconElement = document.createElement("span");
    iconElement.innerHTML = `<img src="http://openweathermap.org/img/wn/${weatherIcon}@2x.png">`;
    title.appendChild(iconElement);

    let tempP = document.createElement("p");
    tempP.textContent = "Temp: " + temperature;

    let humidityP = document.createElement("p");
    humidityP.textContent = "Humidity: " + humidity;

    let windP = document.createElement("p");
    windP.textContent = "Wind speed: " + windSpeed;

    let uvP = document.createElement("p");
    uvP.textContent = "UV Index: ";
    let uvValueElement = document.createElement("span");
    uvValueElement.textContent = uvIndex;
    uvValueElement.style.backgroundColor = getUVIndexColor(uvIndex);
    uvP.appendChild(uvValueElement);

    // Adds the new elements to the current weather container
    currentWeatherContainer.appendChild(title);
    currentWeatherContainer.appendChild(tempP);
    currentWeatherContainer.appendChild(humidityP);
    currentWeatherContainer.appendChild(windP);
    currentWeatherContainer.appendChild(uvP);

    currentWeatherContainer.style.borderStyle = "solid";
}

// Gets a color based on UV index indicating whether the conditions are favorable, moderate or severe
function getUVIndexColor(value) {
    let color;
    switch (true) {
        case value < 2:
            color = getComputedStyle(document.body).getPropertyValue("--green");
            break;

        case value >= 3 && value < 6:
            color = getComputedStyle(document.body).getPropertyValue("--yellow");
            break;

        case value >= 6 && value < 8:
            color = getComputedStyle(document.body).getPropertyValue("--orange");
            break;

        case value >= 8 && value < 11:
            color = getComputedStyle(document.body).getPropertyValue("--red");
            break;

        case value >= 11:
            color = getComputedStyle(document.body).getPropertyValue("--purple");
            break;
    }

    return color;
}

// Displays 5 day weather forecast for the city
function displayWeatherForecast(data, timezoneOffset) {
    // console.log(data);
    // Displays the header of 5 day forecast
    forecastHeader.style.display = "block";

    // Iterates through the first 5 days of data and displays the data
    for (let i = 1; i <= noOfDays; i++) {
        let divElement = document.createElement("div");

        divElement.style.backgroundColor = getComputedStyle(document.body).getPropertyValue("--purple");
        divElement.style.padding = "0 1%";

        // Gets the dates
        let unixTime = data[i].dt + timezoneOffset;
        let time = new Date(unixTime * 1000);
        let date = (time.getUTCMonth() + 1) + "/" + time.getUTCDate() + "/" + time.getUTCFullYear();

        let title = document.createElement("h3");
        title.textContent = date;

        let iconElement = document.createElement("div");
        iconElement.innerHTML = `<img src="http://openweathermap.org/img/wn/${data[i].weather[0].icon}@2x.png">`

        let tempP = document.createElement("p");
        tempP.textContent = "Temp: " + data[i].temp.day + " °F";

        let humidityP = document.createElement("p");
        humidityP.textContent = "Humidity: " + data[i].humidity + " %";

        let windP = document.createElement("p");
        windP.textContent = "Wind speed: " + data[i].wind_speed + " MPH";

        divElement.appendChild(title);
        divElement.appendChild(iconElement);
        divElement.appendChild(tempP);
        divElement.appendChild(humidityP);
        divElement.appendChild(windP);
        divElement.style.marginBottom = "1%";

        futureWeatherContainer.appendChild(divElement);
    }
}




