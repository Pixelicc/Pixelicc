import Handlebars from "handlebars";
import axios from "axios";

try {
  const template = Handlebars.compile(await Bun.file("README.template").text());

  const [{ location }, { statistics: codingStatistics }, { skills: codingSkills }, { specs: setupSpecs }, { specs: homelabSpecs }, { metrics: homelabMetrics }, { socials }] = (
    await Promise.all([
      axios.get("https://api.pixelic.dev/v2/location", {
        headers: {
          Authorization: process.env.PERSONAL_API_TOKEN,
        },
      }),
      axios.get("https://api.pixelic.dev/v2/coding/statistics"),
      axios.get("https://api.pixelic.dev/v2/coding/skills"),
      axios.get("https://api.pixelic.dev/v2/setup/specs"),
      axios.get("https://api.pixelic.dev/v2/homelab/specs"),
      axios.get("https://api.pixelic.dev/v2/homelab/metrics"),
      axios.get("https://api.pixelic.dev/v2/socials"),
    ])
  ).map((res) => res.data);

  const emojis: string[] = ["😊", "😄", "😇", "👀"];
  const time: string[] = location.time.time.split(":");

  const weatherHuman = `${location.weather.isRaining ? "rainy 🌧️" : location.weather.isSnowing ? "snowy 🌨️" : location.weather.cloudCover > 95 ? "cloudy ☁️" : location.weather.cloudCover > 85 ? "partially cloudy 🌥️" : location.weather.cloudCover > 75 ? "partially cloudy ⛅" : "clear"} with temperatures of ${location.weather.temperature.current.toFixed(1)} °C`;
  const timeHuman = Number(time[0]) < 23 && Number(time[0]) > Number(new Date(location.weather.sunset).toLocaleTimeString().split(":")[0]) - 1 ? `${time[0]}:${time[1]} in the evening` : Number(time[0]) > 12 ? `${time[0]}:${time[1]} in the afternoon` : Number(time[0]) > Number(new Date(location.weather.sunrise).toLocaleTimeString().split(":")[0]) ? `${time[0]}:${time[1]} in the morning` : `${time[0]}:${time[1]} during the night`;

  let setupDisks = "";
  for (const i in setupSpecs.disks) {
    setupDisks += setupSpecs.disks[i].name;
    if (Number(i) + 1 !== setupSpecs.disks.length) setupDisks += " + ";
  }
  let homelabDisks = "";
  for (const i in homelabSpecs.disks) {
    homelabDisks += homelabSpecs.disks[i].name;
    if (Number(i) + 1 !== homelabSpecs?.disks?.length) homelabDisks += " + ";
  }

  const data = {
    emoji: Number(time[0]) >= 21 || Number(time[0]) < 5 ? "😴" : emojis[Math.floor(Math.random() * emojis.length)],

    country: location.country.name,
    time: timeHuman,
    weather: weatherHuman,

    totalTimeSpentCoding: codingStatistics.total.timeHuman,
    averageTimeSpentCoding: codingStatistics.average.timeHuman,
    bestDayCodingDate: new Date(codingStatistics.bestDay.date).toLocaleDateString("en-GB"),
    bestDayCodingTime: codingStatistics.bestDay.timeHuman,

    // @ts-ignore
    codingSkillLanguages: codingSkills.languages.map((lang) => `<img alt="${lang.name}" src="${lang.badge}">`).join("\n"),
    // @ts-ignore
    codingSkillFrameworks: codingSkills.frameworks.map((framework) => `<img alt="${framework.name}" src="${framework.badge}">`).join("\n"),
    // @ts-ignore
    codingSkillDatabases: codingSkills.databases.map((database) => `<img alt="${database.name}" src="${database.badge}">`).join("\n"),
    // @ts-ignore
    codingSkillTools: codingSkills.tools.map((tool) => `<img alt="${tool.name}" src="${tool.badge}">`).join("\n"),

    setupCPU: setupSpecs.cpu.name,
    setupGPU: setupSpecs.gpu.name,
    setupRAM: setupSpecs.ram.name,
    setupStorage: setupDisks,

    homelabCPU: homelabSpecs.cpu.name,
    homelabGPU: homelabSpecs.cpu.specs.gpu,
    homelabRAM: homelabSpecs.ram.name,
    homelabStorage: homelabDisks,

    homelabPower: homelabMetrics.power.currentUsage,
    homelabCpuUsed: homelabMetrics.cpu.usedPercentage.toFixed(2),
    homelabRamTotal: homelabMetrics.ram.capacity,
    homelabRamUsed: homelabMetrics.ram.usedCapacity.toFixed(2),
    // @ts-ignore
    homelabDiskTotal: homelabMetrics.disks.reduce((acc, disk) => disk.capacity, 0),
    // @ts-ignore
    homelabDiskUsed: homelabMetrics.disks.reduce((acc, disk) => disk.usedCapacity, 0).toFixed(2),

    // @ts-ignore
    socials: socials.map((social) => (social.name !== "GitHub" ? `${social.name}: <a href="${social.url}">${social.text}</a><br/>` : "")).join("\n"),

    yHypeTracker: process.env.YHYPE_TRACKER_URL,
    lastRefresh: new Date().toLocaleString("en-GB") + " (GMT/UTC)",
  };

  const output = template(data);

  Bun.write("README.md", output);
} catch {}
