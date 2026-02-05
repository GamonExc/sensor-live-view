import { BLE_CONNECT_TIMEOUT_MS } from '@/constants/ble'
import type { SensorData } from '@/types/sensor'
import { INITIAL_SENSOR_DATA } from '@/types/sensor'
import { parsePacket } from '@/utils/parsePacket'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { BleManager, type Device } from 'react-native-ble-plx'

/** DeviceListScreen과 호환되도록 { name, address } 형태 */
export interface BluetoothLEDeviceLike {
  name: string
  address: string
}

const NORDIC_UART_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'
const NORDIC_UART_TX_CHAR = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
const BLE_DEVICE_LIST_KEY = 'BLE_DEVICE_LIST'
const BLE_DEVICE_LIST_MAX = 10
const BLE_ERROR_OPERATION_CANCELLED = 2
const BLE_ERROR_SERVICE_NOT_FOUND = 302

function base64ToUtf8(base64: string): string {
  try {
    const binary = atob(base64)
    return Array.from(binary, (c) =>
      String.fromCharCode(c.charCodeAt(0) & 0xff),
    ).join('')
  } catch {
    return ''
  }
}

export function useBluetoothLE() {
  const [deviceList, setDeviceList] = useState<BluetoothLEDeviceLike[]>([])
  const [unpairedDevices, setUnpairedDevices] = useState<
    BluetoothLEDeviceLike[]
  >([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR_DATA)
  const [rawDataLog, setRawDataLog] = useState<string[]>([])
  const [lastParseFail, setLastParseFail] = useState<string | null>(null)
  const bufferRef = useRef('')
  const managerRef = useRef<BleManager | null>(null)
  const connectedDeviceRef = useRef<Device | null>(null)
  const subscriptionRef = useRef<{ remove: () => void } | null>(null)

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new BleManager()
    }
    return managerRef.current
  }, [])

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

  const getBondedDevices = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BLE_DEVICE_LIST_KEY)
      const list: BluetoothLEDeviceLike[] = raw ? JSON.parse(raw) : []
      setDeviceList(Array.isArray(list) ? list : [])
    } catch {
      setDeviceList([])
    }
  }, [])

  const scanDevices = useCallback(async () => {
    const manager = getManager()
    setUnpairedDevices([])
    setIsScanning(true)
    const seen = new Set<string>()
    try {
      await manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error || !device) return
          if (seen.has(device.id)) return
          seen.add(device.id)
          setUnpairedDevices((prev) => {
            if (prev.some((d) => d.address === device.id)) return prev
            return [
              ...prev,
              {
                name: device.name ?? '알 수 없는 기기',
                address: device.id,
              },
            ]
          })
        },
      )
      await new Promise((r) => setTimeout(r, 10000))
    } catch (err) {
      console.error('BLE 검색 실패:', err)
    } finally {
      manager.stopDeviceScan()
      setIsScanning(false)
    }
  }, [getManager])

  const handleDataReceived = useCallback((chunk: string) => {
    setRawDataLog((prev) => {
      const displayChunk = chunk.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      return [
        `[${new Date().toLocaleTimeString()}] ${displayChunk}`,
        ...prev,
      ].slice(0, 10)
    })
    bufferRef.current += chunk
    const lines = bufferRef.current.split(/\r?\n/)
    bufferRef.current = lines.pop() ?? ''
    lines.forEach((line) => {
      const cleanLine = line.trim()
      if (cleanLine.length === 0) return
      const parsed = parsePacket(cleanLine)
      if (parsed) {
        setSensorData((prev) => ({ ...prev, ...parsed }))
        setLastParseFail(null)
      } else if (cleanLine.length > 0) {
        setLastParseFail(cleanLine)
      }
    })
  }, [])

  const connectDevice = useCallback(
    async (device: BluetoothLEDeviceLike): Promise<boolean> => {
      if (!device?.address?.trim()) {
        return false
      }
      const manager = getManager()
      manager.stopDeviceScan()
      setIsConnecting(true)
      try {
        const dev = await Promise.race([
          manager.connectToDevice(device.address.trim(), {
            autoConnect: false,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('CONNECTION_TIMEOUT')),
              BLE_CONNECT_TIMEOUT_MS,
            ),
          ),
        ])
        try {
          await Promise.race([
            dev.discoverAllServicesAndCharacteristics(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error('DISCOVER_TIMEOUT')),
                BLE_CONNECT_TIMEOUT_MS,
              ),
            ),
          ])
        } catch (e) {
          dev.cancelConnection().catch(() => {})
          throw e
        }
        connectedDeviceRef.current = dev
        setRawDataLog([])
        bufferRef.current = ''

        const sub = manager.monitorCharacteristicForDevice(
          dev.id,
          NORDIC_UART_SERVICE,
          NORDIC_UART_TX_CHAR,
          (error, characteristic) => {
            if (error) {
              const isCancelled =
                error.errorCode === BLE_ERROR_OPERATION_CANCELLED ||
                error.message === 'Operation was cancelled'
              const isServiceNotFound =
                error.errorCode === BLE_ERROR_SERVICE_NOT_FOUND ||
                /not found/i.test(error.message ?? '')
              if (!isCancelled && !isServiceNotFound) {
                console.error('BLE TX 구독 실패:', error.message)
              }
              return
            }
            if (!characteristic?.value) return
            const str = base64ToUtf8(characteristic.value)
            if (str) handleDataReceived(str)
          },
        )
        subscriptionRef.current = sub
        try {
          const raw = await AsyncStorage.getItem(BLE_DEVICE_LIST_KEY)
          const list: BluetoothLEDeviceLike[] = raw ? JSON.parse(raw) : []
          const next = Array.isArray(list) ? list : []
          const entry = { name: dev.name ?? '알 수 없는 기기', address: dev.id }
          const filtered = next.filter((d) => d.address !== entry.address)
          const merged = [entry, ...filtered].slice(0, BLE_DEVICE_LIST_MAX)
          await AsyncStorage.setItem(
            BLE_DEVICE_LIST_KEY,
            JSON.stringify(merged),
          )
          setDeviceList(merged)
        } catch {
          /* 저장 실패해도 연결은 유지 */
        }
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        const message =
          msg === 'CONNECTION_TIMEOUT' || msg === 'DISCOVER_TIMEOUT'
            ? '연결 제한 시간이 지났습니다. 기기가 가까이 있는지 확인해 주세요.'
            : 'BLE 기기의 전원이 켜져 있는지, 범위 내에 있는지 확인해 주세요.'
        Alert.alert('연결할 수 없습니다', message)
        return false
      } finally {
        setIsConnecting(false)
      }
    },
    [getManager, handleDataReceived],
  )

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove()
      subscriptionRef.current = null
    }
    if (connectedDeviceRef.current) {
      connectedDeviceRef.current.cancelConnection().catch(() => {})
      connectedDeviceRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
      if (managerRef.current) {
        managerRef.current.destroy()
        managerRef.current = null
      }
    }
  }, [disconnect])

  return {
    deviceList,
    unpairedDevices,
    isScanning,
    isConnecting,
    sensorData,
    rawDataLog,
    lastParseFail,
    requestPermissions,
    getBondedDevices,
    scanDevices,
    connectDevice,
    disconnect,
  }
}
