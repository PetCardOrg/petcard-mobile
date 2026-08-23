import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, radii, spacing, typography } from '../../utils/theme';

type DurationSliderProps = {
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Rótulo lido por leitor de tela; o valor é anunciado junto. */
  accessibilityLabel?: string;
};

export const DEFAULT_MIN_MINUTES = 15;
export const DEFAULT_MAX_MINUTES = 180;
export const DEFAULT_STEP_MINUTES = 15;

/**
 * Converte a posição horizontal do dedo no valor em minutos.
 *
 * Exportada porque é toda a regra do controle: o resto é desenho. Fica fora do
 * componente para poder ser exercitada sem simular gesto.
 */
export function minutesFromPosition(
  x: number,
  trackWidth: number,
  min: number,
  max: number,
  step: number,
): number {
  if (trackWidth <= 0) return min;
  const razao = Math.min(Math.max(x / trackWidth, 0), 1);
  const bruto = min + razao * (max - min);
  const emPassos = Math.round((bruto - min) / step) * step + min;
  return Math.min(Math.max(emPassos, min), max);
}

/** Fração preenchida da trilha, de 0 a 1. */
export function fillRatio(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

/**
 * Duração por arrasto horizontal.
 *
 * Substitui a fileira de chips fixos (30/45/60/90/120): eram cinco valores e
 * nada entre eles. O passo de 15 minutos cobre os mesmos presets e o que
 * faltava, sem ocupar mais espaço na tela conforme a faixa cresce.
 *
 * Usa `PanResponder` do próprio React Native — um slider nativo exigiria
 * módulo novo e rebuild do dev client.
 */
export function DurationSlider({
  value,
  onChange,
  min = DEFAULT_MIN_MINUTES,
  max = DEFAULT_MAX_MINUTES,
  step = DEFAULT_STEP_MINUTES,
  accessibilityLabel = 'Duração',
}: DurationSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  // Ref espelha o estado: o PanResponder é criado uma vez e não enxergaria
  // atualizações do closure.
  const larguraRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    larguraRef.current = w;
    setTrackWidth(w);
  }, []);

  const aplicar = useCallback(
    (x: number) => {
      const minutos = minutesFromPosition(x, larguraRef.current, min, max, step);
      onChangeRef.current(minutos);
    },
    [min, max, step],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // locationX é relativo à trilha, que é o próprio elemento do gesto.
        onPanResponderGrant: (e) => aplicar(e.nativeEvent.locationX),
        onPanResponderMove: (e) => aplicar(e.nativeEvent.locationX),
      }),
    [aplicar],
  );

  const ajustar = useCallback(
    (delta: number) => {
      const alvo = Math.min(Math.max(value + delta, min), max);
      onChangeRef.current(alvo);
    },
    [value, min, max],
  );

  const preenchido = fillRatio(value, min, max);

  return (
    <View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}min</Text>
        <Text style={styles.hint}>
          {min}–{max}min
        </Text>
      </View>

      <View
        accessibilityActions={[
          { name: 'increment', label: 'Aumentar' },
          { name: 'decrement', label: 'Diminuir' },
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        accessibilityValue={{ max, min, now: value, text: `${value} minutos` }}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') ajustar(step);
          if (event.nativeEvent.actionName === 'decrement') ajustar(-step);
        }}
        onLayout={handleLayout}
        style={styles.track}
        testID="duration-slider"
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: `${preenchido * 100}%` }]} />
        <View
          style={[styles.thumb, { left: Math.max(trackWidth * preenchido - THUMB_SIZE / 2, 0) }]}
        />
      </View>
    </View>
  );
}

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;

const styles = StyleSheet.create({
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    // Área de toque maior que a trilha: 6px de altura é fino demais para o dedo.
    marginVertical: spacing.md,
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    height: TRACK_HEIGHT,
  },
  thumb: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    height: THUMB_SIZE,
    position: 'absolute',
    width: THUMB_SIZE,
  },
});
