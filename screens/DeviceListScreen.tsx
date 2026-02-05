import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/constants/theme'
import type { BluetoothDeviceLike } from '@/hooks/useBluetooth'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export interface DeviceListScreenProps {
  deviceList: BluetoothDeviceLike[]
  unpairedDevices: BluetoothDeviceLike[]
  isScanning: boolean
  isConnecting: boolean
  onRefresh: () => void
  onSelectDevice: (device: BluetoothDeviceLike) => void
  onDevBypass?: () => void
}

export function DeviceListScreen({
  deviceList,
  unpairedDevices,
  isScanning,
  isConnecting,
  onRefresh,
  onSelectDevice,
  onDevBypass,
}: DeviceListScreenProps) {
  const [headerClickCount, setHeaderClickCount] = useState(0)

  const handleHeaderPress = () => {
    // onDevBypass가 있을 때만 동작 (배포 버전에서도 7번 터치 시 이동 가능)
    if (onDevBypass) {
      const next = headerClickCount + 1
      setHeaderClickCount(next)
      if (next >= 7) {
        setHeaderClickCount(0)
        onDevBypass()
      }
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handleHeaderPress}>
        <Text style={styles.header}>기기 선택</Text>
      </TouchableOpacity>
      <Text style={styles.desc}>블루투스 기기를 선택하여 연결하세요.</Text>

      <TouchableOpacity
        style={[
          styles.refreshBtn,
          (isScanning || isConnecting) && styles.scanningBtn,
        ]}
        onPress={onRefresh}
        disabled={isScanning || isConnecting}
      >
        <Text style={styles.refreshBtnText}>
          {isScanning ? '검색 중...' : '기기 검색 (새로고침)'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={[]}
        renderItem={null}
        scrollEnabled={!isConnecting}
        ListHeaderComponent={
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>등록된 기기</Text>
            </View>
            {deviceList.length === 0 ? (
              <Text style={styles.emptyHint}>등록된 기기가 없습니다.</Text>
            ) : (
              deviceList.map((item) => (
                <TouchableOpacity
                  key={item.address}
                  style={styles.item}
                  onPress={() => onSelectDevice(item)}
                  activeOpacity={0.8}
                  disabled={isConnecting}
                >
                  <Text style={styles.itemName}>
                    {item.name || '알 수 없는 기기'}
                  </Text>
                  <Text style={styles.itemAddress}>{item.address}</Text>
                </TouchableOpacity>
              ))
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>검색된 기기</Text>
            </View>
            {unpairedDevices.length === 0 ? (
              <Text style={styles.emptyHint}>
                {isScanning ? '검색 중입니다...' : '검색된 기기가 없습니다.'}
              </Text>
            ) : (
              unpairedDevices.map((item) => (
                <TouchableOpacity
                  key={item.address}
                  style={[styles.item, styles.unpairedItem]}
                  onPress={() => onSelectDevice(item)}
                  activeOpacity={0.8}
                  disabled={isConnecting}
                >
                  <Text style={styles.itemName}>
                    {item.name || '알 수 없는 기기'}
                  </Text>
                  <Text style={styles.itemAddress}>{item.address}</Text>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 40 }} />
          </>
        }
      />

      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00A5E5" />
          <Text style={styles.loadingText}>기기에 연결하는 중입니다...</Text>
          <Text style={styles.loadingSubText}>잠시만 기다려 주세요.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#040000',
  },
  header: {
    fontSize: 22,
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 8,
    color: '#ffffff',
  },
  desc: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00A5E5',
  },
  scanningBtn: {
    backgroundColor: '#0D47A1',
    opacity: 0.8,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 16,
  },
  devBypassBtn: {
    backgroundColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  devBypassText: { color: '#fff', fontFamily: FONT_FAMILY_BOLD, fontSize: 14 },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#eee',
  },
  item: {
    backgroundColor: '#0D47A1',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00A5E5',
  },
  unpairedItem: {
    backgroundColor: '#1A237E',
    borderColor: '#304FFE',
  },
  itemName: {
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#ffffff',
    marginBottom: 4,
  },
  itemAddress: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#ffffff',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
  },
})
