import { Tabs } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { colors, fonts } from "../../src/theme";

type TabIconProps = {
  icon: string;
  label: string;
  focused: boolean;
};

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Wallet" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🗺️" label="Map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" label="Scanner" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label="Stats" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" label="More" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 54,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabIcon: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textMuted,
  },
  iconActive: {},
  labelActive: {
    color: colors.green,
  },
});
