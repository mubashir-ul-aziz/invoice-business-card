import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { RootStackParamList, TabParamList } from './types';

import { DashboardScreen } from '../../features/dashboard/presentation/screens/DashboardScreen';
import { InvoiceListScreen } from '../../features/invoice/presentation/screens/InvoiceListScreen';
import { CustomerListScreen } from '../../features/customer/presentation/screens/CustomerListScreen';
import { BusinessScreen } from '../../features/business/presentation/screens/BusinessScreen';

import { WelcomeScreen } from '../../features/business/presentation/screens/WelcomeScreen';
import { CreateBusinessScreen } from '../../features/business/presentation/screens/CreateBusinessScreen';
import { InvoiceTypeSelectionScreen } from '../../features/invoiceType/presentation/screens/InvoiceTypeSelectionScreen';
import { CustomInvoiceTypeScreen } from '../../features/invoiceType/presentation/screens/CustomInvoiceTypeScreen';
import { ItemListScreen } from '../../features/item/presentation/screens/ItemListScreen';
import { CreateItemScreen } from '../../features/item/presentation/screens/CreateItemScreen';
import { CreateCustomerScreen } from '../../features/customer/presentation/screens/CreateCustomerScreen';
import { CustomerDetailScreen } from '../../features/customer/presentation/screens/CustomerDetailScreen';
import { CustomerHistoryScreen } from '../../features/customer/presentation/screens/CustomerHistoryScreen';
import { CreateInvoiceCustomerScreen } from '../../features/invoice/presentation/screens/CreateInvoiceCustomerScreen';
import { CreateInvoiceItemsScreen } from '../../features/invoice/presentation/screens/CreateInvoiceItemsScreen';
import { InvoiceReviewScreen } from '../../features/invoice/presentation/screens/InvoiceReviewScreen';
import { InvoiceDetailScreen } from '../../features/invoice/presentation/screens/InvoiceDetailScreen';
import { InvoiceSharingScreen } from '../../features/invoice/presentation/screens/InvoiceSharingScreen';
import { RecordPaymentScreen } from '../../features/payment/presentation/screens/RecordPaymentScreen';
import { DigitalBusinessCardScreen } from '../../features/digitalCard/presentation/screens/DigitalBusinessCardScreen';
import { QRCodeScreen } from '../../features/digitalCard/presentation/screens/QRCodeScreen';
import { BackupRestoreScreen } from '../../features/backup/presentation/screens/BackupRestoreScreen';
import { SettingsScreen } from '../../features/settings/presentation/screens/SettingsScreen';
import { InvoiceTemplateSelectionScreen } from '../../features/settings/presentation/screens/InvoiceTemplateSelectionScreen';

/**
 * Each tab gets its own nested stack navigator so switching tabs preserves
 * that tab's navigation history (Section 15). Only the 4 tab-root list
 * screens live here — every drill-down/create/full-screen flow is
 * registered once on the root stack below and reached via `navigate()`
 * bubbling up from any tab (see navigation/hooks.ts).
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

const TAB_ICON: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid',
  Invoices: 'document-text',
  Customers: 'people',
  Business: 'briefcase',
};

const Tab = createBottomTabNavigator<TabParamList>();

/** Persistent bottom-navigation shell wrapping the four top-level tabs (Section 15). */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarLabelStyle: theme.typography.labelSm,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICON[route.name as keyof TabParamList]} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Invoices" component={InvoiceStackScreen} />
      <Tab.Screen name="Customers" component={CustomerStackScreen} />
      <Tab.Screen name="Business" component={BusinessStackScreen} />
    </Tab.Navigator>
  );
}

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator: the tab shell is one screen in a root stack; every
 * full-screen flow that doesn't belong to a tab (Welcome/Setup, Create
 * Business, the invoice creation wizard, Backup & Restore, Settings, QR,
 * Sharing, and every list drill-down — Section 15) is registered here as a
 * sibling screen pushed above the shell.
 */
export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        <RootStack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
        <RootStack.Screen name="InvoiceTypeSelection" component={InvoiceTypeSelectionScreen} />
        <RootStack.Screen name="CustomInvoiceType" component={CustomInvoiceTypeScreen} />
        <RootStack.Screen name="ItemList" component={ItemListScreen} />
        <RootStack.Screen name="CreateItem" component={CreateItemScreen} />
        <RootStack.Screen name="CreateCustomer" component={CreateCustomerScreen} />
        <RootStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
        <RootStack.Screen name="CustomerHistory" component={CustomerHistoryScreen} />
        <RootStack.Screen name="CreateInvoiceCustomer" component={CreateInvoiceCustomerScreen} />
        <RootStack.Screen name="CreateInvoiceItems" component={CreateInvoiceItemsScreen} />
        <RootStack.Screen name="InvoiceReview" component={InvoiceReviewScreen} />
        <RootStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
        <RootStack.Screen name="RecordPayment" component={RecordPaymentScreen} options={{ presentation: 'modal' }} />
        <RootStack.Screen name="InvoiceSharing" component={InvoiceSharingScreen} options={{ presentation: 'modal' }} />
        <RootStack.Screen name="DigitalBusinessCard" component={DigitalBusinessCardScreen} />
        <RootStack.Screen name="QRCode" component={QRCodeScreen} />
        <RootStack.Screen name="BackupRestore" component={BackupRestoreScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen name="InvoiceTemplateSelection" component={InvoiceTemplateSelectionScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
