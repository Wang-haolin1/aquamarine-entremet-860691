const weekDays = ['\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D']

const conditions = [
  { weather: '\u6674', icon: '\u2600\uFE0F', tempHigh: 25, tempLow: 16 },
  { weather: '\u591A\u4E91', icon: '\u26C5', tempHigh: 22, tempLow: 14 },
  { weather: '\u9634', icon: '\u2601\uFE0F', tempHigh: 20, tempLow: 13 },
  { weather: '\u5C0F\u96E8', icon: '\uD83C\uDF26', tempHigh: 18, tempLow: 12 },
  { weather: '\u4E2D\u96E8', icon: '\uD83C\uDF27', tempHigh: 17, tempLow: 11 },
  { weather: '\u6674', icon: '\u2600\uFE0F', tempHigh: 26, tempLow: 17 },
  { weather: '\u6674', icon: '\u2600\uFE0F', tempHigh: 24, tempLow: 15 }
]

const windDirections = ['\u5317\u98CE', '\u5317\u98CE', '\u4E1C\u5317\u98CE', '\u4E1C\u98CE', '\u4E1C\u5357\u98CE', '\u5357\u98CE', '\u897F\u5357\u98CE', '\u897F\u98CE', '\u897F\u5317\u98CE']

function getTodayWeather() {
  const idx = new Date().getDate() % conditions.length
  return conditions[idx]
}

function getWindDirection() {
  const idx = Math.floor(Math.random() * 8)
  return windDirections[idx]
}

function getWindPower() {
  return Math.floor(Math.random() * 4) + 1
}

export async function getWeather(city) {
  try {
    const now = new Date()
    const updateTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const todayWeather = getTodayWeather()
    
    return {
      weather: todayWeather.weather,
      icon: todayWeather.icon,
      temperature: todayWeather.tempHigh - Math.floor(Math.random() * 3),
      humidity: Math.floor(Math.random() * 30) + 40,
      windDirection: getWindDirection(),
      windPower: getWindPower(),
      updateTime,
      city: city || '\u6816\u971E'
    }
  } catch (error) {
    console.error('\u83B7\u53D6\u5929\u6C14\u6570\u636E\u5931\u8D25:', error)
    return null
  }
}

export async function getForecast(city) {
  try {
    const today = new Date()
    
    const forecast = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayName = i === 0 ? '\u4ECA\u5929' : weekDays[date.getDay()]
      const condition = conditions[(today.getDate() + i) % conditions.length]
      
      forecast.push({
        date: `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5`,
        day: dayName,
        ...condition
      })
    }
    
    return {
      city: city || '\u6816\u971E',
      forecast,
      updateTime: today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (error) {
    console.error('\u83B7\u53D6\u9884\u62A5\u6570\u636E\u5931\u8D25:', error)
    return null
  }
}