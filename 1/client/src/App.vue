<template>
  <div id="app">
    <span>Give me the weather for: {{ city }}</span>
    <br />
    <br />
    <textarea v-model="city" placeholder="input a city"></textarea>
    <button v-on:click="handleClick">Submit</button>
    <p v-if="bringUmbrella === true">There will be rain... Bring an umbrella!</p>
    <p v-if="bringUmbrella === false">No rain expected!</p>
    <p v-if="minTemp && minTemp < 10">It will be cold, you should pack warm clothes!</p>
    <p v-else-if="minTemp && minTemp > 20">It will be hot! you should pack light clothes!</p>
    <p v-else-if="minTemp && maxTemp">It will be warm, pack typical clothes</p>
    <br />
    <br />
    <div v-for="day of days" :key="day">
      <b>Prediction for {{day}} at {{dataByDay[day][0].time.getHours()}}h</b>
      <p>Average temperature: {{(dataByDay[day][0].avgTemp.toFixed(1))}}°C</p>
      <p>Wind speed: {{dataByDay[day][0].windSpeed}} meters per second</p>
      <p>Volume of rain: {{dataByDay[day][0].rainVol}} mm for the last 3h</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data: function() {
    return {
      city: "",
      bringUmbrella: null,
      minTemp: null,
      maxTemp: null,
      days: [],
      dataByDay: []
    };
  },
  methods: {
    handleClick: async function() {
      if (!this.city) {
        return;
      }
      let data;
      try {
        data = await fetch(
          `http://localhost:3000/api/${this.city}`
        ).then(response => response.json());
      } catch (e) {
        return;
      }
      const predictions = [];
      for (const item of data.list) {
        predictions.push({
          time: new Date(parseInt(item.dt) * 1000), // todo fix
          minTemp: item.main.temp_min - 273.15,
          maxTemp: item.main.temp_max - 273.15,
          avgTemp: item.main.temp - 273.15,
          weather: [...new Set(item.weather.map(item => item.main))],
          windSpeed: item.wind.speed,
          rainVol: (item.rain && item.rain["3h"]) | 0
        });
      }
      console.log(predictions);
      // Keep 1D list of all weather predictions
      let allWeather = [].concat.apply(
        [],
        predictions.map(item => item.weather)
      );
      // remove duplicates
      allWeather = [...new Set(allWeather)];

      const allTemperatures = predictions
        .map(item => item.minTemp)
        .concat.apply(
          [],
          predictions.map(item => item.maxTemp)
        );
      console.log(predictions);
      this.minTemp = Math.min.apply(null, allTemperatures);
      this.maxTemp = Math.max.apply(null, allTemperatures);
      this.bringUmbrella = allWeather.includes("Rain");

      const days = new Set();
      const dataByDay = {};
      const weekDaysMap = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      for (const item of predictions) {
        const day = weekDaysMap[item.time.getDay()];
        days.add(day);
        if (!dataByDay[day]) {
          dataByDay[day] = [];
        }
        dataByDay[day].push(item);
      }
      this.days = [...days];
      this.dataByDay = dataByDay;
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
