import type { SensorData } from '@/types/sensor'

export function hexToDecimal(hexValue: string): string {
  if (!hexValue || hexValue === '-') return hexValue
  const cleanHex = hexValue.trim().toUpperCase()
  if (!/^[0-9A-F]+$/.test(cleanHex)) return hexValue
  const decimal = parseInt(cleanHex, 16)
  return isNaN(decimal) ? hexValue : decimal.toString()
}

/**
 * 프로토콜 파싱: ADD: 15 TEMP: 19
 * ADD는 무시, TEMP 값을 sensorCh[0]에 할당
 */
export function parsePacket(packet: string): Partial<SensorData> | null {
  const trimmed = packet.trim()

  // 새로운 포맷: ADD: 15 TEMP: 19 (대소문자 무관하게 처리)
  // \s* : 공백 0개 이상 허용
  const regex = /ADD:\s*(\d+)\s+TEMP:\s*(\d+)/i
  const match = trimmed.match(regex)

  if (match) {
    // match[1] -> ADD 값 (사용 안 함)
    // match[2] -> TEMP 값
    const tempValue = match[2]

    // sensorCh 배열 초기화 (8개)
    const sensorCh = Array(8).fill('-')
    // 첫 번째 채널에 TEMP 값 할당
    sensorCh[0] = tempValue

    return {
      siteId: '-',
      devId: '-',
      msgId: '-',
      time: new Date().toLocaleString(), // 시간 정보가 없으므로 현재 시간 사용
      sensorCh,
      ntcIn: '-',
      ntcOut: '-',
      lte: '-',
      battery: '-',
      resetFlag: '-',
      count: '-',
    }
  }

  // 기존 포맷 (#로 시작) 처리 로직은 제거됨 (사용자 요청)

  return null
}
