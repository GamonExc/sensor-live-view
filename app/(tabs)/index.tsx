import { useBluetooth } from '@/hooks/useBluetooth'
import { useBluetoothLE } from '@/hooks/useBluetoothLE'
import { useManagementValue } from '@/hooks/useManagementValue'
import {
  DashboardScreen,
  DetailScreen,
  DeviceListScreen,
  ModeSelectScreen,
  OverviewScreen,
  SplashScreen,
} from '@/screens'
import type { BluetoothDeviceListItem } from '@/screens/DeviceListScreen'
import type { AppStep, BluetoothMode } from '@/types/sensor'
import React, { useEffect, useRef, useState } from 'react'
import { BackHandler, StyleSheet, View } from 'react-native'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'

type BluetoothHook =
  | ReturnType<typeof useBluetooth>
  | ReturnType<typeof useBluetoothLE>

function AppContent() {
  const insets = useSafeAreaInsets()
  const [currentStep, setCurrentStep] = useState<AppStep>('SPLASH')
  const [bluetoothMode, setBluetoothMode] = useState<BluetoothMode | null>(null)
  const [selectedVentNumber, setSelectedVentNumber] = useState<number>(15)
  const [managementValue, setManagementValue] = useManagementValue()

  const classic = useBluetooth()
  const le = useBluetoothLE()

  const isClassic = bluetoothMode === 'classic'
  const bt: BluetoothHook = isClassic ? classic : le
  const listScanDoneRef = useRef<string | null>(null)

  useEffect(() => {
    classic.requestPermissions().catch(() => {})
    le.requestPermissions().catch(() => {})
    const timer = setTimeout(() => {
      setCurrentStep('MODE_SELECT')
    }, 2000)
    return () => {
      clearTimeout(timer)
      classic.disconnect()
      le.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentStep !== 'LIST' || !bluetoothMode) return
    const key = `${currentStep}-${bluetoothMode}`
    if (listScanDoneRef.current === key) return
    listScanDoneRef.current = key
    if (bluetoothMode === 'classic') {
      classic.getBondedDevices().catch(() => {})
      classic.scanDevices().catch(() => {})
    } else {
      le.getBondedDevices().catch(() => {})
      le.scanDevices().catch(() => {})
    }
    return () => {
      listScanDoneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, bluetoothMode])

  useEffect(() => {
    const onBack = () => {
      if (currentStep === 'DETAIL' || currentStep === 'DASHBOARD') {
        setCurrentStep('OVERVIEW')
        return true
      }
      if (currentStep === 'OVERVIEW') {
        bt.disconnect()
        setCurrentStep('LIST')
        return true
      }
      if (currentStep === 'LIST') {
        bt.disconnect()
        setBluetoothMode(null)
        setCurrentStep('MODE_SELECT')
        return true
      }
      if (currentStep === 'MODE_SELECT') {
        return false
      }
      return false
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => sub.remove()
  }, [currentStep, bluetoothMode, bt])

  const handleSelectMode = (mode: BluetoothMode) => {
    setBluetoothMode(mode)
    setCurrentStep('LIST')
  }

  const handleConnectDevice = async (
    device: BluetoothDeviceListItem | null,
  ) => {
    if (!device?.address) return
    const ok = await bt.connectDevice(device)
    if (ok) setCurrentStep('OVERVIEW')
  }

  const handleDisconnect = () => {
    bt.disconnect()
    setCurrentStep('LIST')
  }

  return (
    <View style={styles.safeAreaBg}>
      <View
        style={[
          styles.container,
          {
            marginTop: Math.max(insets.top, 50),
            marginBottom: Math.max(insets.bottom, 32),
            marginLeft: insets.left,
            marginRight: insets.right,
          },
        ]}
      >
        {currentStep === 'SPLASH' && <SplashScreen />}

        {currentStep === 'MODE_SELECT' && (
          <ModeSelectScreen onSelectMode={handleSelectMode} />
        )}

        {currentStep === 'LIST' && bluetoothMode && (
          <DeviceListScreen
            deviceList={bt.deviceList}
            unpairedDevices={bt.unpairedDevices}
            isScanning={bt.isScanning}
            isConnecting={bt.isConnecting}
            onRefresh={() => {
              if (bluetoothMode === 'classic') {
                classic.getBondedDevices()
                classic.scanDevices()
              } else {
                le.getBondedDevices()
                le.scanDevices()
              }
            }}
            onSelectDevice={handleConnectDevice}
            onDevBypass={() => setCurrentStep('OVERVIEW')}
          />
        )}

        {currentStep === 'OVERVIEW' && (
          <OverviewScreen
            onPressNumber={(num) => {
              setSelectedVentNumber(num)
              setCurrentStep('DETAIL')
            }}
            onDisconnect={handleDisconnect}
            onShowFullData={() => setCurrentStep('DASHBOARD')}
          />
        )}

        {currentStep === 'DETAIL' && (
          <DetailScreen
            sensorData={bt.sensorData}
            ventNumber={selectedVentNumber}
            managementValue={managementValue}
            onBack={() => setCurrentStep('OVERVIEW')}
            textColor="#ffffff"
          />
        )}

        {currentStep === 'DASHBOARD' && (
          <DashboardScreen
            sensorData={bt.sensorData}
            rawDataLog={bt.rawDataLog}
            lastParseFail={bt.lastParseFail}
            managementValue={managementValue}
            onSaveManagementValue={setManagementValue}
            onDisconnect={handleDisconnect}
            onBack={() => setCurrentStep('OVERVIEW')}
          />
        )}
      </View>
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeAreaBg: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, backgroundColor: '#040000' },
})
