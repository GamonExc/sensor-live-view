// @ts-nocheck
import { useBluetooth } from '@/hooks/useBluetooth'
import { useManagementValue } from '@/hooks/useManagementValue'
import {
  DashboardScreen,
  DetailScreen,
  DeviceListScreen,
  OverviewScreen,
  SplashScreen,
} from '@/screens'
import type { AppStep } from '@/types/sensor'
import React, { useEffect, useState } from 'react'
import { BackHandler, StyleSheet, View } from 'react-native'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'

function AppContent() {
  const insets = useSafeAreaInsets()
  const [currentStep, setCurrentStep] = useState<AppStep>('SPLASH')
  const [selectedVentNumber, setSelectedVentNumber] = useState<number>(15)
  const [managementValue, setManagementValue] = useManagementValue()
  const {
    deviceList,
    sensorData,
    rawDataLog,
    lastParseFail,
    requestPermissions,
    getBondedDevices,
    connectDevice,
    disconnect,
  } = useBluetooth()

  useEffect(() => {
    requestPermissions().catch(() => {})
    const timer = setTimeout(() => {
      setCurrentStep('LIST')
      getBondedDevices().catch(() => {})
    }, 2000)
    return () => {
      clearTimeout(timer)
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onBack = () => {
      if (currentStep === 'DETAIL' || currentStep === 'DASHBOARD') {
        setCurrentStep('OVERVIEW')
        return true
      }
      if (currentStep === 'OVERVIEW') {
        disconnect()
        setCurrentStep('LIST')
        return true
      }
      if (currentStep === 'LIST') {
        return false
      }
      return false
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => sub.remove()
  }, [currentStep, disconnect])

  const handleConnectDevice = async (device) => {
    const ok = await connectDevice(device)
    if (ok) setCurrentStep('OVERVIEW')
  }

  const handleDisconnect = () => {
    disconnect()
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

        {currentStep === 'LIST' && (
          <DeviceListScreen
            deviceList={deviceList}
            onRefresh={getBondedDevices}
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
            sensorData={sensorData}
            ventNumber={selectedVentNumber}
            managementValue={managementValue}
            onBack={() => setCurrentStep('OVERVIEW')}
            textColor="#ffffff"
          />
        )}

        {currentStep === 'DASHBOARD' && (
          <DashboardScreen
            sensorData={sensorData}
            rawDataLog={rawDataLog}
            lastParseFail={lastParseFail}
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
