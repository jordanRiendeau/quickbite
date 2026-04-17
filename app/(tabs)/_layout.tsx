import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { palette } from '@/constants/theme';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tomato,
        tabBarInactiveTintColor: palette.cocoa,
        tabBarStyle: {
          backgroundColor: palette.cream,
          borderTopColor: palette.peach,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cook',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'List',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <TabBarIcon name="user-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recipe/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
