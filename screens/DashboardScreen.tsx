import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/constants/theme'
import type { SensorData } from '@/types/sensor'
import React, { useEffect, useState } from 'react'
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export interface DashboardScreenProps {
  sensorData: SensorData
  rawDataLog: string[]
  lastParseFail?: string | null
  managementValue: number
  onSaveManagementValue: (value: number) => Promise<void>
  onDisconnect: () => void
  onBack?: () => void
}

export function DashboardScreen({
  sensorData,
  rawDataLog,
  lastParseFail,
  managementValue,
  onSaveManagementValue,
  onDisconnect,
  onBack,
}: DashboardScreenProps) {
  const [editValue, setEditValue] = useState<string>(String(managementValue))
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    setEditValue(String(managementValue))
  }, [managementValue])

  const handleSaveManagement = async () => {
    const num = parseInt(editValue, 10)
    if (!Number.isNaN(num) && num >= 0) {
      await onSaveManagementValue(num)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 1000)
    }
  }

  return (
    <View style={styles.container}>
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>저장되었습니다</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.managementCard}>
          <Text style={styles.subHeader}>관리값 (°C)</Text>
          <View style={styles.managementRow}>
            <TextInput
              style={styles.managementInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="number-pad"
              placeholder="70"
            />
            <Button title="저장" onPress={handleSaveManagement} />
          </View>
          <Text style={styles.managementCurrent}>
            현재 저장된 값: {managementValue} °C
          </Text>
        </View>
      {lastParseFail && (
        <View style={styles.parseFailCard}>
          <Text style={styles.parseFailTitle}>⚠ 파싱 실패 (마지막 패킷)</Text>
          <Text style={styles.parseFailText} selectable>
            {lastParseFail}
          </Text>
          <Text style={styles.parseFailHint}>
            기대 형식:
            #site_id,dev_id,msg_id;time,ch1~ch8,NTC내,NTC외,LTE,배터리,RESET,COUNT
          </Text>
        </View>
      )}
      <View style={[styles.logSection, { flex: 1 }]}>
        <Text style={styles.subHeader}>수신 로그 (최근 10개):</Text>
        <ScrollView style={styles.logBox} nestedScrollEnabled={true}>
          {rawDataLog.length > 0 ? (
            rawDataLog.map((log, idx) => (
              <Text key={idx} style={styles.logText}>
                {log}
              </Text>
            ))
          ) : (
            <Text style={styles.hint}>아직 수신된 데이터가 없습니다.</Text>
          )}
        </ScrollView>
      </View>
      <View style={styles.actions}>
        {onBack && <Button title="뒤로" onPress={onBack} />}
        <View style={styles.actionSpacer} />
        <Button title="연결 해제" color="red" onPress={onDisconnect} />
      </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 40 },
  header: {
    fontSize: 22,
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 10,
    color: '#ffffff',
  },
  subHeader: {
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 10,
    color: '#ffffff',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  bold: { fontFamily: FONT_FAMILY_BOLD },
  parseFailCard: {
    backgroundColor: '#4a1515',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  parseFailTitle: {
    fontFamily: FONT_FAMILY_BOLD,
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 6,
  },
  parseFailText: {
    fontFamily: FONT_FAMILY,
    color: '#ffcccc',
    fontSize: 11,
    marginBottom: 6,
  },
  parseFailHint: {
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
    fontSize: 10,
  },
  logSection: { marginTop: 20, minHeight: 200 },
  logBox: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 5,
    maxHeight: 300,
  },
  logText: {
    color: '#0f0',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#999',
    fontStyle: 'italic',
  },
  actions: { marginTop: 20, marginBottom: 40 },
  actionSpacer: { marginTop: 8 },
  managementCard: {
    backgroundColor: '#1a237e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00A5E5',
  },
  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  managementInput: {
    flex: 1,
    backgroundColor: '#0d47a1',
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    minWidth: 80,
  },
  managementCurrent: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
  },
  toast: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
  },
  toastText: {
    color: 'white',
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 16,
  },
})
