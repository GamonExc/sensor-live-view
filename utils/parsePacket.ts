import type { SensorData } from '@/types/sensor'

export function hexToDecimal(hexValue: string): string {
  if (!hexValue || hexValue === '-') return hexValue
  const cleanHex = hexValue.trim().toUpperCase()
  if (!/^[0-9A-F]+$/.test(cleanHex)) return hexValue
  const decimal = parseInt(cleanHex, 16)
  return isNaN(decimal) ? hexValue : decimal.toString()
}

/**
 * 프로토콜 파싱: #site_id,dev_id,msg_id;time,센서8ch,NTC내기,NTC외기,LTE,배터리,RESETFLAG,COUNT
 * #로 시작하고 ;가 있으면 파싱 시도 (앞뒤 잡음 무시)
 */
export function parsePacket(packet: string): Partial<SensorData> | null {
  const trimmed = packet.trim()
  const hashIdx = trimmed.indexOf('#')
  if (hashIdx < 0 || !trimmed.includes(';')) return null
  const content = trimmed.substring(hashIdx + 1)
  const [headerPart, bodyPart] = content.split(';')
  if (!headerPart || !bodyPart) return null

  try {
    const headers = headerPart.split(',')
    const bodies = bodyPart.split(',')

    const timeHex = (bodies[0] || '').trim()
    const timestamp = parseInt(timeHex, 16)
    const timeStr =
      isNaN(timestamp) || timestamp === 0
        ? timeHex
        : new Date(timestamp * 1000).toLocaleString()

    const sensorCh = bodies
      .slice(1, 9)
      .map((v) => hexToDecimal((v || '').trim()))
    while (sensorCh.length < 8) sensorCh.push('-')
    const ntcIn = hexToDecimal((bodies[9] ?? '-').trim())
    const ntcOut = hexToDecimal((bodies[10] ?? '-').trim())
    const lte = hexToDecimal((bodies[11] ?? '-').trim())
    const battery = hexToDecimal((bodies[12] ?? '-').trim())
    const resetFlag = hexToDecimal((bodies[13] ?? '-').trim())
    const count = hexToDecimal((bodies[14] ?? '-').trim())

    return {
      siteId: (headers[0] ?? '-').trim(),
      devId: (headers[1] ?? '-').trim(),
      msgId: (headers[2] ?? '-').trim(),
      time: timeStr,
      sensorCh,
      ntcIn,
      ntcOut,
      lte,
      battery,
      resetFlag,
      count,
    }
  } catch {
    return null
  }
}
