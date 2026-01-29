import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const DEFAULT_CIRCLE_BG = '#00A5E5'

export interface VentNumberRingProps {
  boxSize: number
  orbitRadius: number
  smallR: number
  circleCount?: number
  clickableNumbers?: number[]
  onPressNumber?: (num: number) => void
  fontSize?: number
  /** 번호별 배경색. 없으면 DEFAULT_CIRCLE_BG */
  getCircleColor?: (num: number) => string
}

export function VentNumberRing({
  boxSize,
  orbitRadius,
  smallR,
  circleCount = 42,
  clickableNumbers = [15],
  onPressNumber,
  fontSize = 12,
  getCircleColor,
}: VentNumberRingProps) {
  const CX = boxSize / 2
  const CY = boxSize / 2
  const circles = Array.from({ length: circleCount }, (_, i) => {
    const num = i + 1
    const angleDeg = -90 + (i * 360) / circleCount
    const angleRad = (angleDeg * Math.PI) / 180
    const x = CX + orbitRadius * Math.cos(angleRad) - smallR
    const y = CY + orbitRadius * Math.sin(angleRad) - smallR
    return { num, x, y, clickable: clickableNumbers.includes(num) }
  })

  const getBg = (num: number) => getCircleColor?.(num) ?? DEFAULT_CIRCLE_BG

  return (
    <View style={[styles.box, { width: boxSize, height: boxSize }]}>
      {circles.map(({ num, x, y, clickable }) => {
        const bg = getBg(num)
        const circleStyle = [
          styles.circle,
          {
            left: x,
            top: y,
            width: smallR * 2,
            height: smallR * 2,
            borderRadius: smallR,
            backgroundColor: bg,
            borderColor: bg,
          },
        ]
        return clickable ? (
          <TouchableOpacity
            key={num}
            style={[
              styles.touch,
              { left: x, top: y, width: smallR * 2, height: smallR * 2 },
            ]}
            onPress={() => onPressNumber?.(num)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.circleInner,
                { borderRadius: smallR, backgroundColor: bg, borderColor: bg },
              ]}
            >
              <Text style={[styles.circleText, { fontSize }]}>{num}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View key={num} style={circleStyle}>
            <Text style={[styles.circleText, { fontSize }]}>{num}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    backgroundColor: DEFAULT_CIRCLE_BG,
    borderWidth: 1,
    borderColor: DEFAULT_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: DEFAULT_CIRCLE_BG,
    borderWidth: 1,
    borderColor: DEFAULT_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 12, fontWeight: 'bold', color: '#000000' },
})
