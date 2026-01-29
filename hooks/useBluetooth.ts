import type { SensorData } from '@/types/sensor'
import { INITIAL_SENSOR_DATA } from '@/types/sensor'
import { parsePacket } from '@/utils/parsePacket'
import { useRef, useState } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import RNBluetoothClassic from 'react-native-bluetooth-classic'

export interface BluetoothDeviceLike {
  name: string
  address: string
  connect: (opts?: {
    connectorType?: string
    delimiter?: string
    secureSocket?: boolean
  }) => Promise<boolean>
  disconnect: () => void
  onDataReceived: (cb: (data: { data: string }) => void) => void
}

export function useBluetooth() {
  const [deviceList, setDeviceList] = useState<BluetoothDeviceLike[]>([])
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDeviceLike | null>(null)
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR_DATA)
  const [rawDataLog, setRawDataLog] = useState<string[]>([])
  const [lastParseFail, setLastParseFail] = useState<string | null>(null)
  const bufferRef = useRef('')

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return
    if (Platform.Version >= 31) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])
    } else {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )
    }
  }

  const getBondedDevices = async () => {
    try {
      const bonded = await RNBluetoothClassic.getBondedDevices()
      setDeviceList(bonded)
    } catch (err) {
      console.error('기기 목록 가져오기 실패:', err)
    }
  }

  const handleDataReceived = (chunk: string) => {
    setRawDataLog((prev) => {
      const displayChunk = chunk.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      return [
        `[${new Date().toLocaleTimeString()}] ${displayChunk}`,
        ...prev,
      ].slice(0, 10)
    })

    bufferRef.current += chunk

    const lines = bufferRef.current.split(/\r?\n/)
    bufferRef.current = lines.pop() || ''

    const tryParse = (line: string) => {
      const parsed = parsePacket(line)
      if (parsed) {
        setSensorData((prev) => ({ ...prev, ...parsed }))
        setLastParseFail(null)
      } else if (line.startsWith('#') || line.includes(';')) {
        setLastParseFail(line)
      }
    }

    lines.forEach((line) => {
      const cleanLine = line.trim()
      if (cleanLine.length > 0) tryParse(cleanLine)
    })

    const remainder = bufferRef.current.trim()
    if (remainder.startsWith('#') && remainder.includes(';')) {
      tryParse(remainder)
      bufferRef.current = ''
    }
  }

  const connectDevice = async (
    device: BluetoothDeviceLike,
  ): Promise<boolean> => {
    try {
      const connected = await device.connect({
        connectorType: 'rfcomm',
        delimiter: '',
        secureSocket: false,
      })
      if (connected) {
        setConnectedDevice(device)
        setRawDataLog([])
        device.onDataReceived((data: { data: string }) =>
          handleDataReceived(data.data),
        )
        return true
      }
      return false
    } catch (err) {
      Alert.alert(
        '연결 실패',
        "상대방 앱이 '대기 상태'인지 확인해주세요.\n" + JSON.stringify(err),
      )
      return false
    }
  }

  const disconnect = () => {
    if (connectedDevice) {
      connectedDevice.disconnect()
      setConnectedDevice(null)
    }
  }

  return {
    deviceList,
    connectedDevice,
    sensorData,
    rawDataLog,
    lastParseFail,
    requestPermissions,
    getBondedDevices,
    connectDevice,
    disconnect,
  }
}
