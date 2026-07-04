const apiKey = "1c72259571a74b6ab00ead045f3afe32";

let chart = null;
let currentCity = "";

// ================================
// TOAST
// ================================

function showToast(message, color = "#22c55e") {

    const toast = document.getElementById("toast");

    toast.innerHTML = message;
    toast.style.background = color;
    toast.style.display = "block";

    setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}

// ================================
// LOADER
// ================================

function showLoader() {

    document.getElementById("loader").style.display = "block";

}

function hideLoader() {

    document.getElementById("loader").style.display = "none";

}

// ================================
// SEARCH HISTORY
// ================================

let history =
JSON.parse(localStorage.getItem("weatherHistory")) || [];

function saveHistory(city){

    history = history.filter(c => c !== city);

    history.unshift(city);

    if(history.length > 5){

        history.pop();

    }

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(history)
    );

    displayHistory();

}

function displayHistory(){

    const historyDiv =
    document.getElementById("history");

    historyDiv.innerHTML = "";

    history.forEach(city=>{

        historyDiv.innerHTML += `

        <button onclick="getWeather('${city}')">

            ${city}

        </button>

        `;

    });

}

// ================================
// FAVOURITES
// ================================

let favorites =
JSON.parse(localStorage.getItem("favoriteCities")) || [];

function addFavorite(){

    if(currentCity===""){

        return;

    }

    if(!favorites.includes(currentCity)){

        favorites.push(currentCity);

        localStorage.setItem(

            "favoriteCities",

            JSON.stringify(favorites)

        );

        displayFavorites();

        showToast("Added to favourites ⭐");

    }

    else{

        showToast("Already Added","#f59e0b");

    }

}

function displayFavorites(){

    const fav =
    document.getElementById("favorites");

    fav.innerHTML = "";

    favorites.forEach(city=>{

        fav.innerHTML += `

        <button onclick="getWeather('${city}')">

            ⭐ ${city}

        </button>

        `;

    });

}

// ================================
// WEATHER
// ================================

async function getWeather(cityName=null){

    const city =
    cityName ||
    document.getElementById("city").value.trim();

    if(city===""){

        showToast("Please enter city","#ef4444");

        return;

    }

    currentCity = city;

    saveHistory(city);

    showLoader();

    try{

        const response = await fetch(

`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

        );

        const data = await response.json();

        if(data.cod != 200){

            hideLoader();

            showToast(data.message,"#ef4444");

            return;

        }

        localStorage.setItem(
            "lastCity",
            data.name
        );

        document.getElementById("city").value =
        data.name;

        document.getElementById("cityName").innerHTML =
        `${data.name}, ${data.sys.country}`;

        document.getElementById("temp").innerHTML =
        `${Math.round(data.main.temp)}°C`;

        document.getElementById("condition").innerHTML =
        data.weather[0].description;

        document.getElementById("icon").src =
`https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        document.getElementById("feels").innerHTML =
        `${Math.round(data.main.feels_like)}°C`;

        document.getElementById("humidity").innerHTML =
        `${data.main.humidity}%`;

        document.getElementById("wind").innerHTML =
        `${data.wind.speed} m/s`;

        document.getElementById("pressure").innerHTML =
        `${data.main.pressure} hPa`;

        document.getElementById("sunrise").innerHTML =
        new Date(
            data.sys.sunrise*1000
        ).toLocaleTimeString([],{

            hour:"2-digit",

            minute:"2-digit"

        });

        document.getElementById("sunset").innerHTML =
        new Date(
            data.sys.sunset*1000
        ).toLocaleTimeString([],{

            hour:"2-digit",

            minute:"2-digit"

        });

        changeBackground(data.weather[0].main);

        await getAQI(

            data.coord.lat,

            data.coord.lon

        );

        await getForecast(data.name);

        await loadHourlyForecast(data.name);

        await loadChart(data.name);

        updateWeatherAlert(
            data.weather[0].main
        );

        hideLoader();

        showToast("Weather Updated");

    }

    catch(error){

        console.log(error);

        hideLoader();

    }

}

// ================================
// 5 DAY FORECAST
// ================================

async function getForecast(city){

    try{

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
        );

        const data = await response.json();

        if(data.cod!="200") return;

        const forecast=document.getElementById("forecast");

        forecast.innerHTML="";

        const addedDays=[];

        data.list.forEach(item=>{

            const date=new Date(item.dt*1000);

            const day=date.toLocaleDateString("en-US",{weekday:"short"});

            if(item.dt_txt.includes("12:00:00") && !addedDays.includes(day)){

                addedDays.push(day);

                forecast.innerHTML+=`

                <div class="forecast-card">

                    <h4>${day}</h4>

                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">

                    <p>${Math.round(item.main.temp)}°C</p>

                    <p>${item.weather[0].main}</p>

                </div>

                `;

            }

        });

    }

    catch(error){

        console.log(error);

    }

}

// ================================
// HOURLY FORECAST
// ================================

async function loadHourlyForecast(city){

    try{

        const response=await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
        );

        const data=await response.json();

        const hourly=document.getElementById("hourlyForecast");

        hourly.innerHTML="";

        data.list.slice(0,8).forEach(item=>{

            hourly.innerHTML+=`

            <div class="forecast-card">

                <h4>${new Date(item.dt*1000).toLocaleTimeString([],{
                    hour:"2-digit",
                    minute:"2-digit"
                })}</h4>

                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">

                <p>${Math.round(item.main.temp)}°C</p>

            </div>

            `;

        });

    }

    catch(error){

        console.log(error);

    }

}

// ================================
// AIR QUALITY
// ================================

async function getAQI(lat,lon){

    try{

        const response=await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );

        const data=await response.json();

        if(!data.list) return;

        const aqi=data.list[0].main.aqi;

        document.getElementById("aqi").innerHTML=aqi;

        const text=[
            "",
            "Good 😊",
            "Fair 🙂",
            "Moderate 😐",
            "Poor 😷",
            "Very Poor ☠"
        ];

        document.getElementById("aqiText").innerHTML=text[aqi];

    }

    catch(error){

        console.log(error);

    }

}

// ================================
// TEMPERATURE CHART
// ================================

async function loadChart(city){

    try{

        const response=await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
        );

        const data=await response.json();

        if(data.cod!="200") return;

        const labels=[];
        const temps=[];

        data.list.slice(0,8).forEach(item=>{

            labels.push(
                new Date(item.dt*1000).toLocaleTimeString([],{
                    hour:"2-digit"
                })
            );

            temps.push(item.main.temp);

        });

        if(chart){

            chart.destroy();

        }

        chart=new Chart(document.getElementById("tempChart"),{

            type:"line",

            data:{

                labels:labels,

                datasets:[{

                    label:"Temperature",

                    data:temps,

                    borderWidth:3,

                    tension:.4,

                    fill:false

                }]

            },

            options:{

                responsive:true

            }

        });

    }

    catch(error){

        console.log(error);

    }

}

// ================================
// WEATHER ALERT
// ================================

function updateWeatherAlert(weather){

    weather=weather.toLowerCase();

    let msg="Weather is normal.";

    if(weather.includes("rain"))
        msg="🌧 Carry an umbrella.";

    else if(weather.includes("thunder"))
        msg="⛈ Thunderstorm Alert.";

    else if(weather.includes("snow"))
        msg="❄ Drive Carefully.";

    else if(weather.includes("clear"))
        msg="☀ Perfect weather.";

    else if(weather.includes("cloud"))
        msg="☁ Cloudy weather.";

    document.getElementById("weatherAlert").innerHTML=msg;

}

// ================================
// BACKGROUND
// ================================

function changeBackground(weather){

    weather=weather.toLowerCase();

    if(weather.includes("clear")){

        document.body.style.background=
        "linear-gradient(135deg,#f59e0b,#f97316)";

    }

    else if(weather.includes("cloud")){

        document.body.style.background=
        "linear-gradient(135deg,#6d83f2,#6c63ff)";

    }

    else if(weather.includes("rain")){

        document.body.style.background=
        "linear-gradient(135deg,#2563eb,#1e3a8a)";

    }

    else if(weather.includes("snow")){

        document.body.style.background=
        "linear-gradient(135deg,#dbeafe,#93c5fd)";

    }

}

// ================================
// LOCATION
// ================================

function getLocationWeather(){

    navigator.geolocation.getCurrentPosition(async(position)=>{

        const lat=position.coords.latitude;

        const lon=position.coords.longitude;

        const response=await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        const data=await response.json();

        getWeather(data.name);

    });

}

// ================================
// DARK MODE
// ================================

function toggleTheme(){

    document.body.classList.toggle("dark");

}

// ================================
// PDF
// ================================

function downloadReport(){

    if(currentCity==="") return;

    const {jsPDF}=window.jspdf;

    const doc=new jsPDF();

    doc.text("Weather Report",20,20);

    doc.text(document.getElementById("cityName").innerText,20,40);

    doc.text(document.getElementById("temp").innerText,20,55);

    doc.text(document.getElementById("condition").innerText,20,70);

    doc.save(currentCity+".pdf");

}

// ================================
// CLOCK
// ================================

function updateClock(){

    const now=new Date();

    document.getElementById("date").innerHTML=now.toDateString();

    document.getElementById("time").innerHTML=now.toLocaleTimeString();

}

setInterval(updateClock,1000);

// ================================
// ENTER KEY
// ================================

document.getElementById("city").addEventListener("keypress",e=>{

    if(e.key==="Enter"){

        getWeather();

    }

});

// ================================
// AUTO REFRESH
// ================================

setInterval(()=>{

    if(currentCity){

        getWeather(currentCity);

    }

},300000);

// ================================
// LOAD
// ================================

window.onload=()=>{

    displayHistory();

    displayFavorites();

    updateClock();

    const lastCity=localStorage.getItem("lastCity");

    if(lastCity){

        document.getElementById("city").value=lastCity;

        getWeather(lastCity);

    }

};