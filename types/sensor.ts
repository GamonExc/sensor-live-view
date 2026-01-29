export interface SensorData {
  siteId: string
  devId: string
  msgId: string
  time: string
  sensorCh: string[]
  ntcIn: string
  ntcOut: string
  lte: string
  battery: string
  resetFlag: string
  count: string
}

export const INITIAL_SENSOR_DATA: SensorData = {
  siteId: '-',
  devId: '-',
  msgId: '-',
  time: '-',
  sensorCh: [],
  ntcIn: '-',
  ntcOut: '-',
  lte: '-',
  battery: '-',
  resetFlag: '-',
  count: '-',
}

export type AppStep = 'SPLASH' | 'LIST' | 'OVERVIEW' | 'DETAIL' | 'DASHBOARD'
