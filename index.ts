import Handlebars from "handlebars";
import axios from "axios";
import moment from "moment-timezone";

const template = Handlebars.compile(await Bun.file("README.template").text());

const weather = (await axios.get(`https://api.open-meteo.com/v1/dwd-icon?latitude=${process.env.WEATHER_LATITUDE}&longitude=${process.env.WEATHER_LONGITUDE}&current=temperature,rain,snowfall,cloud_cover&hourly=temperature,rain,snowfall&daily=sunrise,sunset&timezone=GMT&forecast_days=1`)).data;
const weatherHuman = `${weather.current.temperature} °C and ${weather.current.rain ? "rainy 🌧️" : weather.current.snowfall ? "snowy 🌨️" : weather.current.cloud_cover > 95 ? "cloudy ☁️" : weather.current.cloud_cover > 85 ? "partially cloudy 🌥️" : weather.current.cloud_cover > 75 ? "partially cloudy ⛅" : "sunny ☀️"}`;

const localTime = moment().tz(process.env.TIMEZONE as string);
const localClock = localTime.format("HH:mm");
const localTimeHuman = localTime.hour() < 23 && localTime.hour() > moment(weather.daily.sunset[0]).hour() - 1 ? `${localClock} in the evening` : localTime.hour() > 12 ? `${localClock} in the afternoon` : localTime.hour() > moment(weather.daily.sunrise[0]).hour() ? `${localClock} in the morning` : `${localClock} during the night`;

const codeStats = (await axios.get(process.env.WAKATIME_JSON_EMBED_URL as string)).data;

const data = {
  time: localTimeHuman,
  weather: weatherHuman,

  totalTimeSpentCoding: codeStats.data.grand_total.human_readable_total,
  averageTimeSpentCoding: codeStats.data.grand_total.human_readable_daily_average,
  bestDayCodingDate: new Date(codeStats.data.best_day.date).toLocaleDateString("en-GB"),
  bestDayCodingTime: codeStats.data.best_day?.text,

  lastRefresh: new Date().toLocaleString("en-GB") + " (GMT/UTC)",
};

const output = template(data);

Bun.write("README.md", output);
