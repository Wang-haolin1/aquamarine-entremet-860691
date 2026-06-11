<template>
  <div class="weather-widget-wrapper">
    <div class="weather-current" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false" @click="showForecastDialog = true">
      <div class="weather-display">
        <span class="weather-icon-text">{{ weatherIcon }}</span>
        <div class="weather-info">
          <span class="weather-text">{{ weather }}</span>
          <span class="weather-temp">{{ temperature }}&#x2103;</span>
        </div>
      </div>
      <div class="weather-arrow">&#x25BC;</div>
    </div>

    <el-tooltip
      v-model:visible="showTooltip"
      placement="bottom"
      :show-after="300"
      :hide-after="100"
    >
      <template #content>
        <div class="weather-tooltip">
          <div class="tooltip-header">
            <span class="tooltip-icon">{{ weatherIcon }}</span>
            <div class="tooltip-header-info">
              <span class="tooltip-city">{{ city }}</span>
              <span class="tooltip-status">{{ weather }}</span>
            </div>
          </div>
          <div class="tooltip-body">
            <div class="weather-item">
              <span class="item-label">&#x6E29;&#x5EA6;</span>
              <span class="item-value">{{ temperature }}&#x2103;</span>
            </div>
            <div class="weather-item">
              <span class="item-label">&#x6E7F;&#x5EA6;</span>
              <span class="item-value">{{ humidity }}%</span>
            </div>
            <div class="weather-item">
              <span class="item-label">&#x98CE;&#x5411;</span>
              <span class="item-value">{{ windDirection }}</span>
            </div>
            <div class="weather-item">
              <span class="item-label">&#x98CE;&#x529B;</span>
              <span class="item-value">{{ windPower }}&#x7EA7;</span>
            </div>
            <div class="weather-item">
              <span class="item-label">&#x66F4;&#x65B0;</span>
              <span class="item-value">{{ updateTime }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-tooltip>

    <el-dialog
      v-model="showForecastDialog"
      :title="city + '7&#x5929;&#x5929;&#x6C14;&#x9884;&#x62A5;'"
      width="580px"
      top="5vh"
      custom-class="forecast-dialog"
      :close-on-click-modal="true"
    >
      <div class="forecast-content" v-if="forecastData.length > 0">
        <div
          v-for="(day, index) in forecastData"
          :key="index"
          :class="['forecast-card', { 'today-card': index === 0 }]"
        >
          <div class="forecast-date">
            <span class="forecast-day">{{ day.day }}</span>
            <span class="forecast-date-num">{{ day.date }}</span>
          </div>
          <div class="forecast-icon-wrap">
            <span class="forecast-icon-text">{{ day.icon }}</span>
          </div>
          <div class="forecast-info">
            <span class="forecast-weather">{{ day.weather }}</span>
          </div>
          <div class="forecast-temp-range">
            <span class="temp-high">{{ day.tempHigh }}&#x2103;</span>
            <span class="temp-separator">/</span>
            <span class="temp-low">{{ day.tempLow }}&#x2103;</span>
          </div>
        </div>
      </div>
      <div class="forecast-footer">
        <span class="update-label">&#x66F4;&#x65B0;&#x4E8E; {{ forecastUpdateTime }}</span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getWeather, getForecast } from '../api/weatherService'

const showTooltip = ref(false)
const showForecastDialog = ref(false)
const weather = ref('\u6674')
const temperature = ref(22)
const humidity = ref(55)
const windDirection = ref('\u4E1C\u98CE')
const windPower = ref(2)
const city = ref('\u6816\u971E')
const updateTime = ref('--:--')

const forecastData = ref([])
const forecastUpdateTime = ref('')

const weatherIcon = computed(() => {
  const map = {
    '\u6674': '\u2600\uFE0F',
    '\u591A\u4E91': '\u26C5',
    '\u9634': '\u2601\uFE0F',
    '\u5C0F\u96E8': '\uD83C\uDF26',
    '\u4E2D\u96E8': '\uD83C\uDF27',
    '\u5927\u96E8': '\uD83C\uDF27',
    '\u96EA': '\u2744\uFE0F',
    '\u96FE': '\uD83C\uDF2B'
  }
  return map[weather.value] || '\u2600\uFE0F'
})

const fetchWeather = async () => {
  try {
    const data = await getWeather(city.value)
    if (data) {
      weather.value = data.weather
      temperature.value = data.temperature
      humidity.value = data.humidity
      windDirection.value = data.windDirection
      windPower.value = data.windPower
      updateTime.value = data.updateTime
    }
  } catch (error) {
    console.error('\u83B7\u53D6\u5929\u6C14\u5931\u8D25:', error)
  }
}

const fetchForecast = async () => {
  try {
    const data = await getForecast(city.value)
    if (data) {
      forecastData.value = data.forecast
      forecastUpdateTime.value = data.updateTime
    }
  } catch (error) {
    console.error('\u83B7\u53D6\u9884\u62A5\u5931\u8D25:', error)
  }
}

onMounted(() => {
  fetchWeather()
  fetchForecast()
  setInterval(fetchWeather, 30 * 60 * 1000)
  setInterval(fetchForecast, 30 * 60 * 1000)
})
</script>

<style scoped>
.weather-widget-wrapper {
  display: flex;
  align-items: center;
}

.weather-current {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.weather-current:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(93, 175, 105, 0.2);
}

.weather-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-icon-text {
  font-size: 22px;
  font-weight: bold;
}

.weather-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.weather-text {
  font-size: 13px;
  font-weight: 600;
  color: #2D5A27;
}

.weather-temp {
  font-size: 14px;
  font-weight: bold;
  color: #2D5A27;
}

.weather-arrow {
  font-size: 8px;
  color: rgba(45, 90, 39, 0.5);
  margin-left: 2px;
}

.weather-tooltip {
  min-width: 210px;
  padding: 8px 6px;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(168, 230, 207, 0.4);
  margin-bottom: 10px;
}

.tooltip-icon {
  font-size: 36px;
  font-weight: bold;
}

.tooltip-header-info {
  display: flex;
  flex-direction: column;
}

.tooltip-city {
  font-size: 16px;
  font-weight: bold;
  color: #2D5A27;
}

.tooltip-status {
  font-size: 13px;
  color: #5DAF69;
  margin-top: 2px;
}

.tooltip-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weather-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
}

.item-label {
  color: #7A9A7A;
  font-size: 13px;
}

.item-value {
  color: #2D5A27;
  font-size: 13px;
  font-weight: 600;
}

.forecast-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0;
}

.forecast-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #F5F9E9 0%, #F0F7E6 100%);
  border-radius: 14px;
  border: 1px solid rgba(168, 230, 207, 0.4);
  transition: all 0.3s;
  cursor: default;
}

.forecast-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 14px rgba(93, 175, 105, 0.15);
  border-color: rgba(123, 200, 140, 0.6);
}

.today-card {
  background: linear-gradient(135deg, #A8E6CF 0%, #7BC88C 100%);
  border-color: rgba(93, 175, 105, 0.3);
}

.today-card .forecast-day,
.today-card .forecast-date-num,
.today-card .forecast-weather,
.today-card .temp-high,
.today-card .temp-low {
  color: #fff !important;
}

.today-card .temp-separator {
  color: rgba(255, 255, 255, 0.5) !important;
}

.forecast-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
}

.forecast-day {
  font-size: 15px;
  font-weight: bold;
  color: #2D5A27;
}

.forecast-date-num {
  font-size: 11px;
  color: #7A9A7A;
  margin-top: 2px;
}

.forecast-icon-wrap {
  width: 44px;
  display: flex;
  justify-content: center;
  margin: 0 12px;
}

.forecast-icon-text {
  font-size: 26px;
  font-weight: bold;
}

.forecast-info {
  flex: 1;
}

.forecast-weather {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.forecast-temp-range {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: flex-end;
}

.temp-high {
  font-size: 16px;
  font-weight: bold;
  color: #E6A23C;
}

.temp-separator {
  color: #DCDFE6;
  font-size: 12px;
}

.temp-low {
  font-size: 14px;
  color: #7A9A7A;
  font-weight: 500;
}

.forecast-footer {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid rgba(168, 230, 207, 0.3);
  margin-top: 2px;
}

.update-label {
  font-size: 12px;
  color: #7A9A7A;
}
</style>

<style>
.el-popper.is-light {
  border: none !important;
  background: linear-gradient(135deg, #F0F9EE 0%, #E8F5E5 100%) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(93, 175, 105, 0.15), 0 0 0 1px rgba(168, 230, 207, 0.5) !important;
  padding: 10px 14px !important;
}

.el-popper.is-light .el-popper__arrow::before {
  background: linear-gradient(135deg, #F0F9EE 0%, #E8F5E5 100%) !important;
  border: 1px solid rgba(168, 230, 207, 0.5) !important;
  box-shadow: 0 2px 8px rgba(93, 175, 105, 0.1) !important;
}

.forecast-dialog {
  border-radius: 20px !important;
  overflow: hidden;
  background: linear-gradient(135deg, #F5F9E9 0%, #F0F7E6 100%) !important;
  box-shadow: 0 12px 40px rgba(93, 175, 105, 0.2) !important;
}

.forecast-dialog .el-dialog__header {
  background: linear-gradient(90deg, #A8E6CF 0%, #7BC88C 100%);
  padding: 18px 24px;
  margin: 0;
  border-bottom: 2px solid rgba(93, 175, 105, 0.2);
}

.forecast-dialog .el-dialog__title {
  color: #2D5A27;
  font-size: 18px;
  font-weight: bold;
}

.forecast-dialog .el-dialog__headerbtn {
  top: 18px;
}

.forecast-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #2D5A27;
  font-size: 18px;
}

.forecast-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #fff;
}

.forecast-dialog .el-dialog__body {
  padding: 20px 24px;
  background: transparent;
}

.forecast-dialog .el-dialog__footer {
  display: none;
}
</style>