import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';

interface MockQRCodeProps {
  seed: string;
  size?: number;
}

const GRID = 11;

/**
 * Deterministic checkerboard pattern standing in for a real QR code. Real
 * on-device QR generation (`react-native-qrcode-svg`) is introduced in
 * Phase 21 once there's real business-card data to encode — Stage 1 is
 * UI-only, so this renders a visually convincing static placeholder.
 */
export function MockQRCode({ seed, size = 220 }: MockQRCodeProps) {
  const cells = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    const values: boolean[] = [];
    for (let i = 0; i < GRID * GRID; i++) {
      hash = (hash * 1103515245 + 12345) >>> 0;
      values.push(((hash >> 16) & 1) === 1);
    }
    return values;
  }, [seed]);

  const cellSize = size / GRID;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {cells.map((filled, index) => {
        const row = Math.floor(index / GRID);
        const col = index % GRID;
        const isFinder =
          (row < 3 && col < 3) || (row < 3 && col >= GRID - 3) || (row >= GRID - 3 && col < 3);
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: col * cellSize,
              top: row * cellSize,
              width: cellSize,
              height: cellSize,
              backgroundColor: isFinder || filled ? theme.colors.textPrimary : 'transparent',
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, overflow: 'hidden' },
});
