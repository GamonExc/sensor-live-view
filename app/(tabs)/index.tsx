// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import RNBluetoothClassic from 'react-native-bluetooth-classic'

export default function App() {
  const [currentStep, setCurrentStep] = useState('SPLASH') // SPLASH -> LIST -> DASHBOARD
  const [deviceList, setDeviceList] = useState([])
  const [connectedDevice, setConnectedDevice] = useState(null)

  // 파싱된 데이터 저장소 (프로토콜: site_id, dev_id, msg_id / time / 센서8ch / NTC(내기,외기) / LTE / 배터리 / RESETFLAG / COUNT)
  const [sensorData, setSensorData] = useState({
    siteId: '-',
    devId: '-',
    msgId: '-',
    time: '-',
    sensorCh: [], // 8ch
    ntcIn: '-', // NTC 내기
    ntcOut: '-', // NTC 외기
    lte: '-',
    battery: '-',
    resetFlag: '-',
    count: '-',
  })

  // 디버깅용: 수신된 원시 데이터 로그
  const [rawDataLog, setRawDataLog] = useState([])

  const bufferRef = useRef('') // 데이터 조각 모음용

  useEffect(() => {
    // 권한 요청 먼저 실행
    requestPermissions()

    // 2초 뒤 리스트 화면으로 이동 (테스트용)
    const timer = setTimeout(() => {
      // 실제로는 권한이 있어야 목록을 가져올 수 있으므로 여기서 호출
      getBondedDevices()
      setCurrentStep('LIST')
    }, 2000)

    return () => {
      clearTimeout(timer)
      if (connectedDevice) {
        connectedDevice.disconnect()
      }
    }
  }, [])

  // 1. 권한 요청 (안드로이드 필수)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      // 안드로이드 12 (API 31) 이상
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ])
      } else {
        // 안드로이드 11 이하
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        )
      }
    }
  }

  // 2. 페어링된 기기 목록 가져오기
  const getBondedDevices = async () => {
    try {
      const bonded = await RNBluetoothClassic.getBondedDevices()
      setDeviceList(bonded)
    } catch (err) {
      console.error('기기 목록 가져오기 실패:', err)
    }
  }

  // 3. 기기 연결
  const connectDevice = async (device) => {
    try {
      console.log('연결 시도 중...')
      // 옵션 추가: connectorType과 secureSocket 설정이 핵심입니다.
      const connected = await device.connect({
        connectorType: 'rfcomm',
        delimiter: '\n',
        secureSocket: false, // 보내는 쪽과 동일하게 소문자로 통일
      })

      if (connected) {
        console.log('연결 성공!')
        setConnectedDevice(device)
        setCurrentStep('DASHBOARD')
        setRawDataLog([]) // 로그 초기화

        // 데이터 수신 리스너 등록
        device.onDataReceived((data) => {
          console.log('📥 원시 데이터 수신:', data.data)
          handleDataReceived(data.data)
        })

        console.log('데이터 수신 리스너 등록 완료')
      }
    } catch (err) {
      Alert.alert(
        '연결 실패',
        "상대방 앱이 '대기 상태'인지 확인해주세요.\n" + JSON.stringify(err),
      )
      console.log('Connect Error:', err)
    }
  }

  // 4. 데이터 수신 및 처리 (버퍼링 로직)
  const handleDataReceived = (chunk) => {
    // chunk에 \n이 포함되어 있는지 확인 (delimiter 설정으로 인해 제거될 수 있음)
    const hasNewline = chunk.includes('\n')
    console.log(
      '🔵 handleDataReceived 호출됨, chunk:',
      chunk,
      '길이:',
      chunk.length,
      '\\n 포함:',
      hasNewline,
    )

    // 원시 데이터 로그에 추가 (\n이 있으면 표시)
    setRawDataLog((prev) => {
      const displayChunk = chunk.replace(/\n/g, '\\n') // 로그에서 \n을 보이게 표시
      const newLog = [
        `[${new Date().toLocaleTimeString()}] ${displayChunk}`,
        ...prev,
      ]
      return newLog.slice(0, 10) // 최근 10개만 유지
    })

    bufferRef.current += chunk
    console.log(
      '🔵 현재 버퍼:',
      bufferRef.current,
      '\\n 포함:',
      bufferRef.current.includes('\n'),
    )

    // 줄바꿈(\n)이 있으면 문장이 완성된 것으로 간주 (여러 패킷이 한 번에 올 수 있음)
    if (bufferRef.current.includes('\n')) {
      const lines = bufferRef.current.split('\n')
      bufferRef.current = lines.pop() || '' // 마지막 미완성 조각은 남겨둠

      console.log('🔵 완성된 라인들 (\\n 기준):', lines)

      lines.forEach((line) => {
        const cleanLine = line.trim()
        if (cleanLine.length > 0) {
          console.log('🔵 파싱 시도 (\\n 기준):', cleanLine)
          parsePacket(cleanLine)
        }
      })
    }

    // delimiter 설정으로 인해 \n이 제거되어 올 수 있으므로,
    // \n이 없어도 #으로 시작하고 ;가 있으면 완전한 패킷으로 간주
    // (보내는 쪽에서 \n을 추가하지만, delimiter가 자동으로 제거할 수 있음)
    if (!bufferRef.current.includes('\n')) {
      const trimmedBuffer = bufferRef.current.trim()
      if (trimmedBuffer.startsWith('#') && trimmedBuffer.includes(';')) {
        console.log(
          '🔵 delimiter로 \\n 제거됨 또는 \\n 없이 수신, 완전한 패킷으로 파싱:',
          trimmedBuffer,
        )
        parsePacket(trimmedBuffer)
        bufferRef.current = '' // 파싱 후 버퍼 초기화
      }
    }
  }

  // HEX 값을 10진수로 변환 (변환 불가능하면 원본 반환)
  const hexToDecimal = (hexValue) => {
    if (!hexValue || hexValue === '-') return hexValue

    // Z 같은 문자가 포함되어 있으면 HEX가 아닐 수 있음
    const cleanHex = hexValue.trim().toUpperCase()

    // HEX 문자인지 확인 (0-9, A-F만 포함)
    if (!/^[0-9A-F]+$/.test(cleanHex)) {
      return hexValue // HEX가 아니면 원본 반환
    }

    const decimal = parseInt(cleanHex, 16)
    return isNaN(decimal) ? hexValue : decimal.toString()
  }

  // 5. 프로토콜 파싱 (#site_id,dev_id,msg_id;time,센서8ch,NTC내기,NTC외기,LTE,배터리,RESETFLAG,COUNT)
  const parsePacket = (packet) => {
    console.log('🟢 parsePacket 호출, packet:', packet)

    if (!packet.startsWith('#')) {
      console.log("⚠️ '#'로 시작하지 않음, 무시")
      return
    }

    try {
      const content = packet.substring(1)
      const [headerPart, bodyPart] = content.split(';')

      if (!headerPart || !bodyPart) {
        console.log('⚠️ 헤더 또는 바디가 없음')
        return
      }

      const headers = headerPart.split(',') // site_id, dev_id, msg_id
      const bodies = bodyPart.split(',') // time, ch1~8, ntc_in, ntc_out, lte, battery, reset_flag, count

      // HEX 시간 -> 날짜 변환
      const timeHex = (bodies[0] || '').trim()
      const timestamp = parseInt(timeHex, 16)
      const timeStr =
        isNaN(timestamp) || timestamp === 0
          ? timeHex
          : new Date(timestamp * 1000).toLocaleString()

      // bodies[1]~[8]: 센서 8ch, [9]: NTC 내기, [10]: NTC 외기, [11]: LTE, [12]: 배터리, [13]: RESETFLAG, [14]: COUNT
      // HEX 값을 10진수로 변환
      const sensorCh = bodies
        .slice(1, 9)
        .map((v) => hexToDecimal((v || '').trim()))
      const ntcIn = hexToDecimal((bodies[9] ?? '-').trim())
      const ntcOut = hexToDecimal((bodies[10] ?? '-').trim())
      const lte = hexToDecimal((bodies[11] ?? '-').trim())
      const battery = hexToDecimal((bodies[12] ?? '-').trim())
      const resetFlag = hexToDecimal((bodies[13] ?? '-').trim())
      const count = hexToDecimal((bodies[14] ?? '-').trim())

      setSensorData({
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
      })
    } catch (e) {
      console.log('❌ Parsing Error:', e)
    }
  }

  // --- 화면 렌더링 ---
  return (
    <View style={styles.container}>
      {/* 1. 로딩 화면 */}
      {currentStep === 'SPLASH' && (
        <View style={styles.center}>
          <Text style={styles.title}>MY SENSOR APP</Text>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10 }}>블루투스 준비 중...</Text>
        </View>
      )}

      {/* 2. 기기 목록 화면 */}
      {currentStep === 'LIST' && (
        <View style={styles.padding}>
          <Text style={styles.header}>기기 선택</Text>
          <Text style={styles.desc}>
            블루투스 설정에서 먼저 페어링 해주세요.
          </Text>

          <Button title="목록 새로고침" onPress={getBondedDevices} />

          <FlatList
            data={deviceList}
            keyExtractor={(item) => item.address}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => connectDevice(item)}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text>{item.address}</Text>
              </TouchableOpacity>
            )}
            style={{ marginTop: 20 }}
          />
        </View>
      )}

      {/* 3. 대시보드 화면 */}
      {currentStep === 'DASHBOARD' && (
        <View style={styles.padding}>
          <Text style={styles.header}>실시간 데이터</Text>

          <View style={styles.card}>
            <Text>
              Site ID: <Text style={styles.bold}>{sensorData.siteId}</Text>
            </Text>
            <Text>
              Dev ID: <Text style={styles.bold}>{sensorData.devId}</Text>
            </Text>
            <Text>
              Msg ID: <Text style={styles.bold}>{sensorData.msgId}</Text>
            </Text>
            <Text>Time: {sensorData.time}</Text>
          </View>

          <Text style={styles.subHeader}>센서 8ch:</Text>
          <View style={styles.grid}>
            {sensorData.sensorCh.length > 0 ? (
              sensorData.sensorCh.map((val, idx) => (
                <View key={idx} style={styles.box}>
                  <Text style={styles.valText}>{val}</Text>
                  <Text style={styles.idxText}>CH{idx + 1}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.hint}>데이터 수신 대기 중...</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.subHeader}>NTC / LTE / 배터리 / 기타</Text>
            <Text>
              NTC 내기: <Text style={styles.bold}>{sensorData.ntcIn}</Text>
            </Text>
            <Text>
              NTC 외기: <Text style={styles.bold}>{sensorData.ntcOut}</Text>
            </Text>
            <Text>
              LTE: <Text style={styles.bold}>{sensorData.lte}</Text>
            </Text>
            <Text>
              배터리: <Text style={styles.bold}>{sensorData.battery}</Text>
            </Text>
            <Text>
              RESETFLAG: <Text style={styles.bold}>{sensorData.resetFlag}</Text>
            </Text>
            <Text>
              COUNT: <Text style={styles.bold}>{sensorData.count}</Text>
            </Text>
          </View>

          {/* 디버깅: 원시 데이터 로그 */}
          <View style={styles.logSection}>
            <Text style={styles.subHeader}>수신 로그 (최근 10개):</Text>
            <View style={styles.logBox}>
              {rawDataLog.length > 0 ? (
                rawDataLog.map((log, idx) => (
                  <Text key={idx} style={styles.logText}>
                    {log}
                  </Text>
                ))
              ) : (
                <Text style={styles.hint}>아직 수신된 데이터가 없습니다.</Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button
              title="연결 해제"
              color="red"
              onPress={() => {
                if (connectedDevice) connectedDevice.disconnect()
                setConnectedDevice(null)
                setCurrentStep('LIST')
              }}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  padding: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  desc: { fontSize: 14, color: 'gray', marginBottom: 10 },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  item: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  itemName: { fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  bold: { fontWeight: 'bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    width: '30%',
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  valText: { fontSize: 16, fontWeight: 'bold', color: 'blue' },
  idxText: { fontSize: 12, color: '#555' },
  logSection: { marginTop: 20 },
  logBox: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 5,
    maxHeight: 150,
  },
  logText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
  hint: { fontSize: 14, color: '#999', fontStyle: 'italic' },
})
