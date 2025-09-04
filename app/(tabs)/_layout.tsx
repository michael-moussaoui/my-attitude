import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

// Importations des icônes Lucide directementcommand:gitlens.showRemotesView
import {
  BarChart3, // Pour Admin
  CalendarDays, // Pour Book
  Home, QrCode, // Pour Home
  Search, // Pour Search
  User
} from 'lucide-react-native';

// Importez vos composants personnalisés de la barre d'onglets
import GlobalHeader from '@/components/GlobalHeader'; // Assurez-vous que GlobalHeader est importé
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const colorScheme = useColorScheme();
 
  // const { t } = useTranslation();

  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true, // Affiche l'en-tête pour les onglets
        header: () => <GlobalHeader />, // Utilise votre GlobalHeader pour tous les écrans d'onglets
        
        tabBarButton: HapticTab, // Réactive HapticTab
        tabBarBackground: TabBarBackground, // Réactive TabBarBackground pour le dégradé

        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 10,
            backgroundColor: Colors.white,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 80,
            paddingBottom: 10,
            paddingTop: 10,
          },
          default: {
            backgroundColor: Colors.white,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 80,
            paddingBottom: 10,
            paddingTop: 10,
          },
        }),
        tabBarLabelStyle: {
          fontFamily: 'Inter-Regular',
          fontSize: 12,
        },
        tabBarIconStyle: {
          marginBottom: -3,
        },
        // Les styles d'en-tête globaux seront gérés par GlobalHeader ou les _layout.tsx imbriqués
      }}>
      <Tabs.Screen
        name="index" // Home
        options={{
          title: '',
          tabBarIcon: ({ color }) => <Home color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="book" 
        options={{
          // title: t('home.bookSession'),
          title: '',
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={28} />, 
          headerShown: false, 
        }}
      />
      <Tabs.Screen
        name="search" 
        options={{
          // title: t('common.search'),
          title: '',
          tabBarIcon: ({ color }) => <Search color={color} size={28} />,
          headerShown: false, 
        }}
      />
      <Tabs.Screen
        name="qr_scan" 
        options={{
          // title: t('qr.scanQR'),
          title: '',
          tabBarIcon: ({ color }) => <QrCode color={color} size={28} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile" 
        options={{
          // title: t('profile.title'),
          title: '',
          tabBarIcon: ({ color }) => <User color={color} size={28} />,
          headerShown: false,
        }}
      />
      {/* {user?.role === 'admin' && ( */}
        <Tabs.Screen
          name="admin" 
          options={{
            title: '',
            tabBarIcon: ({ color }) => <BarChart3 color={color} size={28} />,
            tabBarLabel: () => null,
            headerShown: false,
          }}
        />
      {/* )} */}
     
    </Tabs>
  );
}
