import { Platform, StyleSheet, ViewStyle } from 'react-native';

// ─── Design Tokens ───────────────────────────────────────────────────────────
// Raw values — use these when constructing dynamic styles or passing to
// StyleSheet.create() in screen-level files.

export const colors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surface2: '#1a1a26',
  border: '#2a2a3a',

  green: '#00ff88',
  greenDim: '#00ff8833',
  red: '#ff3366',
  redDim: '#ff336633',

  purple: '#8b5cf6',
  purpleDim: 'rgba(139, 92, 246, 0.15)',
  yellow: '#ffd700',
  yellowDim: 'rgba(255, 215, 0, 0.15)',
  cyan: '#00d4ff',
  cyanDim: 'rgba(0, 212, 255, 0.15)',
  orange: '#ff8c00',
  orangeDim: 'rgba(255, 140, 0, 0.15)',

  text: '#e8e8f0',
  textDim: '#666680',
  textMid: '#9999aa',
  white: '#ffffff',
  black: '#000000',

  // Backward-compat aliases (old theme.ts names used in existing screens)
  surfaceLight: '#1a1a26',
  textPrimary: '#ffffff',
  textSecondary: '#9999aa',
  textMuted: '#666680',
} as const;

export const fonts = {
  mono: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : 'monospace',
  body: Platform.OS === 'web' ? ('Outfit, sans-serif' as string) : undefined,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  // Backward-compat alias (old theme.ts used xxl: 48 for header paddingTop)
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  full: 50,
} as const;

export const fontSize = {
  xs: 9,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  display: 28,
} as const;

// ─── Backward-compat: `card` object (spread into StyleSheet.create) ─────────

export const card = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,
} as const;

// ─── Shadow presets ──────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

// ─── Dynamic style helpers ───────────────────────────────────────────────────
// For styles that depend on runtime values (color, width, etc.)

export function statBarFillStyle(pct: number, color: string): ViewStyle {
  return { width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color };
}

export function threatBorderStyle(severity: 'critical' | 'warning' | 'info'): ViewStyle {
  const colorMap = { critical: colors.red, warning: colors.orange, info: colors.cyan };
  return { borderLeftWidth: 3, borderLeftColor: colorMap[severity] };
}

export function pillColorStyle(color: string): ViewStyle {
  return { borderColor: color, backgroundColor: color + '14' };
}

// ─── Component StyleSheets ───────────────────────────────────────────────────

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  subtleDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});

export const cards = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  share: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
});

export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: {
    backgroundColor: colors.red,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.bg,
  },
  outlineText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  dangerText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  ghostText: {
    fontSize: fontSize.md,
    color: colors.textMid,
  },
});

export const badges = StyleSheet.create({
  safe: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.greenDim,
    alignSelf: 'flex-start',
  },
  risk: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.orangeDim,
    alignSelf: 'flex-start',
  },
  danger: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.redDim,
    alignSelf: 'flex-start',
  },
  info: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.purpleDim,
    alignSelf: 'flex-start',
  },
  safeText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.green,
  },
  riskText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.orange,
  },
  dangerText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.red,
  },
  infoText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.purple,
  },
});

export const statBar = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
    width: 75,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%' as unknown as number, // RN accepts this at runtime
    borderRadius: 3,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    minWidth: 24,
    textAlign: 'right',
  },
});

export const tokens = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  amount: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  price: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'right',
  },
  pctUp: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.green,
    textAlign: 'right',
  },
  pctDown: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.red,
    textAlign: 'right',
  },
});

export const activity = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  sub: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.text,
  },
});

export const nav = StyleSheet.create({
  bottomBar: {
    height: 54,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  tabLabelActive: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.green,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});

export const chat = StyleSheet.create({
  bubbleNpc: {
    maxWidth: '82%' as unknown as number,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    marginBottom: spacing.sm,
  },
  bubbleSystem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.purpleDim,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: fontSize.md,
    lineHeight: 18,
    color: colors.text,
  },
  systemText: {
    fontSize: fontSize.sm,
    color: colors.purple,
    textAlign: 'center',
  },
  choice: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: 5,
  },
  choiceText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});

export const threats = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  severity: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export const gear = StyleSheet.create({
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  desc: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
});

export const worldMap = StyleSheet.create({
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  chapterCurrent: {
    borderColor: colors.green,
  },
  chapterLocked: {
    opacity: 0.35,
  },
  chapterNum: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 28,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
});

export const leaderboard = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  rank: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
    color: colors.text,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  stat: {
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
  },
});

export const approval = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  handle: {
    width: 30,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
});

export const pills = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.yellow,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  text: {
    fontSize: fontSize.md,
    color: colors.textMid,
  },
  textSelected: {
    fontSize: fontSize.md,
    color: colors.yellow,
  },
});

export const npc = StyleSheet.create({
  portrait: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  nameTag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dialogBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dialogText: {
    fontSize: fontSize.md,
    lineHeight: 19,
    color: colors.text,
  },
});

export const settings = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.textDim,
  },
});

export const input = StyleSheet.create({
  base: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
  },
});

// ─── Text presets ────────────────────────────────────────────────────────────

export const typography = StyleSheet.create({
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.display,
    fontWeight: '700',
    color: colors.text,
  },
  balanceUp: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
  },
  balanceDown: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.red,
  },
  mono: {
    fontFamily: fonts.mono,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  watermark: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 2,
  },
});

export const quickAction = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
