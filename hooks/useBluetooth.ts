import type { SensorData } from '@/types/sensor'
import { INITIAL_SENSOR_DATA } from '@/types/sensor'
import { parsePacket } from '@/utils/parsePacket'
import { useEffect, useRef, useState } from 'react'
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
  const [unpairedDevices, setUnpairedDevices] = useState<BluetoothDeviceLike[]>([])
  const [isScanning, setIsScanning] = useState(false)
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

  const scanDevices = async () => {
    setUnpairedDevices([])
    setIsScanning(true)
    try {
      await RNBluetoothClassic.startDiscovery()
      // 이벤트 리스너는 useEffect에서 등록하거나 여기서 등록 가능
      // 여기서는 useEffect로 전역 관리하는 것이 안전하지 않으므로, 
      // startDiscovery 호출 시 자동 수집됨 (라이브러리 특성 확인 필요하지만 보통 onDeviceDiscovered 필요)
    } catch (err) {
      console.error('검색 실패:', err)
      setIsScanning(false)
    }
  }

  const cancelScan = async () => {
    try {
      await RNBluetoothClassic.cancelDiscovery()
      setIsScanning(false)
    } catch (err) {
      console.error('검색 중지 실패:', err)
    }
  }

  // 검색된 기기 리스너 설정
  useEffect(() => {
    const discoverySubscription = RNBluetoothClassic.onDeviceDiscovered((event) => {
      setUnpairedDevices((prev) => {
        const exists = prev.find((d) => d.address === event.device.address)
        if (exists) return prev
        // BluetoothNativeDevice가 반환되므로 타입 단언 사용
        return [...prev, event.device as unknown as BluetoothDeviceLike]
      })
    })

    return () => {
      discoverySubscription.remove()
      cancelScan()
    }
  }, [])

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
    // 연결 시도 전 스캔 중지
    if (isScanning) {
      await cancelScan()
    }
    
    try {
      // device 객체에 connect 메서드가 없을 수 있으므로(검색된 기기인 경우)
      // 라이브러리의 connectToDevice를 사용하여 연결하고, 반환된 "완전한" device 객체를 사용함
      const connectedDeviceObj = await RNBluetoothClassic.connectToDevice(device.address, {
        connectorType: 'rfcomm',
        delimiter: '',
        secureSocket: false,
      })

      if (connectedDeviceObj) {
        setConnectedDevice(connectedDeviceObj as unknown as BluetoothDeviceLike)
        setRawDataLog([])
        connectedDeviceObj.onDataReceived((data: { data: string }) =>
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
    unpairedDevices,
    isScanning,
    connectedDevice,
    sensorData,
    rawDataLog,
    lastParseFail,
    requestPermissions,
    getBondedDevices,
    scanDevices,
    cancelScan,
    connectDevice,
    disconnect,
  }
}
