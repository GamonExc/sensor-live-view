import { VentNumberRing } from '@/components/vent-number-ring'
import { FONT_FAMILY_BOLD } from '@/constants/theme'
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions'
import React, { useState } from 'react'
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/** 타이틀·로고·버튼 등 원 외부에 쓰는 세로 공간 (대략) */
const RESERVED_HEIGHT_OUTSIDE_CIRCLE = 240
/** 원 좌우 여백 (패딩 등) */
const HORIZONTAL_PADDING = 40

/**
 * 일반 디바이스 / 폴드 펼침 / 폴드 접힘(outer) 모두 대응.
 * - 세로: 사용 가능 높이 안에 원이 들어가도록 상한
 * - 가로: 사용 가능 너비 안에 원이 들어가도록 상한 (접었을 때 잘림 방지)
 */
function useOverviewSizes() {
  const { width, height, minSide } = useResponsiveDimensions()
  const insets = useSafeAreaInsets()
  const topInset = Math.max(insets.top, 50)
  const bottomInset = Math.max(insets.bottom, 32)
  const leftInset = insets.left
  const rightInset = insets.right
  const contentHeight = height - topInset - bottomInset
  const contentWidth = width - leftInset - rightInset - HORIZONTAL_PADDING
  const availableHeightForCircle = Math.max(
    120,
    contentHeight - RESERVED_HEIGHT_OUTSIDE_CIRCLE,
  )
  const availableWidthForCircle = Math.max(120, contentWidth)
  const boxSizeByMinSide = minSide * 1.2
  const boxSizeByHeight = availableHeightForCircle
  const boxSizeByWidth = availableWidthForCircle
  const boxSize = Math.min(boxSizeByMinSide, boxSizeByHeight, boxSizeByWidth)
  const orbitRadius = boxSize * 0.36
  const smallR = Math.max(10, boxSize * 0.025)
  const centerSize = boxSize * 0.6
  const cx = boxSize / 2
  const cy = boxSize / 2
  const centerLeft = cx - centerSize / 2
  const centerTop = cy - centerSize / 2
  return { boxSize, orbitRadius, smallR, centerSize, centerLeft, centerTop }
}

const LOGO_CLICKS_TO_SHOW_FULL_DATA = 7

export interface OverviewScreenProps {
  onPressNumber: (num: number) => void
  onDisconnect: () => void
  onShowFullData?: () => void
  centerImageSource?: number
  logoImageSource?: number
}

export function OverviewScreen({
  onPressNumber,
  onDisconnect,
  onShowFullData,
  centerImageSource = require('../assets/images/mobile_ts_img.png'),
  logoImageSource = require('../assets/images/excello-logo.png'),
}: OverviewScreenProps) {
  const [logoClickCount, setLogoClickCount] = useState(0)
  const sizes = useOverviewSizes()
  const { boxSize, orbitRadius, smallR, centerSize, centerLeft, centerTop } =
    sizes
  const { rem } = useResponsiveDimensions()

  const handleLogoPress = () => {
    const next = logoClickCount + 1
    setLogoClickCount(next)
    if (next >= LOGO_CLICKS_TO_SHOW_FULL_DATA && onShowFullData) {
      setLogoClickCount(0)
      onShowFullData()
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { fontSize: Math.max(20, rem(8)) }]}>
        POSCO 광양{'\n'}2고로 송풍지관
      </Text>

      <View style={[styles.circleBox, { width: boxSize, height: boxSize }]}>
        <View
          style={[
            styles.centerCircle,
            {
              left: centerLeft,
              top: centerTop,
              width: centerSize,
              height: centerSize,
              borderRadius: centerSize / 2,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#00A5E5',
            },
          ]}
        >
          <Image
            source={centerImageSource}
            style={styles.centerImage}
            resizeMode="contain"
          />
        </View>
        <VentNumberRing
          boxSize={boxSize}
          orbitRadius={orbitRadius}
          smallR={smallR}
          circleCount={42}
          clickableNumbers={[15]}
          onPressNumber={onPressNumber}
          fontSize={Math.max(10, Math.round(smallR * 0.65))}
          getCircleColor={(num) => {
            if (num === 15) return '#FF0000'
            if ([3, 5, 14, 22, 31, 33, 36, 40, 41, 42].includes(num))
              return '#FFFF00'
            return '#00A5E5'
          }}
        />
      </View>
      <TouchableOpacity
        style={styles.logoWrap}
        onPress={handleLogoPress}
        activeOpacity={1}
      >
        <Image
          source={logoImageSource}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.actions}>
        <Button title="연결 해제" color="red" onPress={onDisconnect} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#040000' },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 10,
    textAlign: 'center',
    color: '#00A5E5',
  },
  circleBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: { position: 'absolute' },
  centerImage: { width: '100%', height: '100%' },
  logoWrap: {
    width: '100%',
    maxWidth: 140,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: '100%', height: '100%' },
  actions: { marginTop: 10 },
})
