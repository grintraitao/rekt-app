import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  approval as approvalStyles,
} from "../theme";

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type ApprovalDetails = {
  actionTitle: string; // "Swap on Uniswap" | "Claim Airdrop"
  amount: string; // "100 USDC" | "♾️ UNLIMITED"
  contract: string; // "0x7a25...3f8b"
  verified: boolean; // true → ✓, false → ✗
  gas: string; // "$2.40"
};

type Props = {
  visible: boolean;
  type: "safe" | "scam";
  details: ApprovalDetails;
  onApprove: () => void;
  onReject: () => void;
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ApprovalPopup({
  visible,
  type,
  details,
  onApprove,
  onReject,
}: Props) {
  const isScam = type === "scam";
  const accentColor = isScam ? colors.red : colors.green;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={approvalStyles.overlay}>
        <View style={approvalStyles.sheet}>
          {/* Handle */}
          <View style={approvalStyles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.label}>APPROVE TRANSACTION</Text>
            <Text style={styles.title}>{details.actionTitle}</Text>
          </View>

          {/* Detail card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text
                style={[
                  styles.fieldValue,
                  { color: accentColor },
                  isScam && styles.fieldBold,
                ]}
              >
                {details.amount}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Contract</Text>
              <Text style={styles.contract}>
                {details.contract} {details.verified ? "✓" : "✗"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Gas</Text>
              <Text style={styles.fieldValue}>{details.gas}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>

            <Pressable
              style={[
                styles.approveBtn,
                { backgroundColor: accentColor },
              ]}
              onPress={onApprove}
            >
              <Text style={styles.approveText}>Approve ✓</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },

  card: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text,
  },
  fieldBold: {
    fontWeight: "700",
  },
  contract: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.text,
  },

  buttons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  rejectText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  approveBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  approveText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: "600",
    color: colors.bg,
  },
});
