import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../theme/theme';
import { DashboardScreen } from '../../features/dashboard/presentation/screens/DashboardScreen';
import { InvoiceListScreen } from '../../features/invoice/presentation/screens/InvoiceListScreen';
import { CustomerListScreen } from '../../features/customer/presentation/screens/CustomerListScreen';
import { BusinessScreen } from '../../features/business/presentation/screens/BusinessScreen';

/**
 * Each tab gets its own nested stack navigator so switching tabs preserves
 * that tab's navigation history (Section 15). Feature phases push their real
 * screens onto these stacks without touching this shell file.
 */
const DashboardStack = createNativeStackNavigator();
function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
    </DashboardStack.Navigator>
  );
}

const InvoiceStack = createNativeStackNavigator();
function InvoiceStackScreen() {
  return (
    <InvoiceStack.Navigator screenOptions={{ headerShown: false }}>
      <InvoiceStack.Screen name="InvoiceListHome" component={InvoiceListScreen} />
    </InvoiceStack.Navigator>
  );
}

const CustomerStack = createNativeStackNavigator();
function CustomerStackScreen() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="CustomerListHome" component={CustomerListScreen} />
    </CustomerStack.Navigator>
  );
}

const BusinessStack = createNativeStackNavigator();
function BusinessStackScreen() {
  return (
    <BusinessStack.Navigator screenOptions={{ headerShown: false }}>
      <BusinessStack.Screen name="BusinessHome" component={BusinessScreen} />
    </BusinessStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

/** Persistent bottom-navigation shell wrapping the four top-level tabs (Section 15). */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Invoices" component={InvoiceStackScreen} />
      <Tab.Screen name="Customers" component={CustomerStackScreen} />
      <Tab.Screen name="Business" component={BusinessStackScreen} />
    </Tab.Navigator>
  );
}

const RootStack = createNativeStackNavigator();

/**
 * Root navigator: the tab shell is one screen in a root stack, so full-screen
 * flows that don't belong to a tab (Welcome/Setup, Create Business, invoice
 * creation wizard, Backup & Restore, Settings, QR, Sharing — Section 15) can
 * be registered here as sibling screens pushed above the shell, in later
 * phases, without restructuring navigation.
 */
export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
