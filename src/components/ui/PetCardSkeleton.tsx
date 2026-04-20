import { type DimensionValue, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../../utils/theme';

function Bone({ width, height }: { width: DimensionValue; height: number }) {
  return <View style={[styles.bone, { width, height }]} />;
}

export function PetCardSkeleton() {
  return (
    <View style={styles.card}>
      <Bone height={58} width={58} />
      <View style={styles.info}>
        <Bone height={14} width="60%" />
        <Bone height={10} width="40%" />
        <View style={styles.meta}>
          <Bone height={22} width={80} />
          <Bone height={12} width={50} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  bone: {
    backgroundColor: colors.border,
    borderRadius: radii.sm,
  },
  info: {
    flex: 1,
    gap: spacing.sm,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
