import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const togglePushNotifications = () => setIsPushEnabled((prev) => !prev);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('preferences.title')}</Text>
      <View style={styles.option}>
        <Text style={styles.optionText}>{t('preferences.darkMode')}</Text>
        <Switch
          trackColor={{ false: Colors.gray, true: Colors.blue }}
          thumbColor={isDarkMode ? Colors.white : Colors.darkGray}
          onValueChange={toggleDarkMode}
          value={isDarkMode}
        />
      </View>
      <View style={styles.option}>
        <Text style={styles.optionText}>{t('preferences.pushNotifications')}</Text>
        <Switch
          trackColor={{ false: Colors.gray, true: Colors.blue }}
          thumbColor={isPushEnabled ? Colors.white : Colors.darkGray}
          onValueChange={togglePushNotifications}
          value={isPushEnabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  optionText: {
    fontSize: 18,
    color: Colors.darkGray,
  },
});