import { Colors } from '@/constants/Colors';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const [isDataSharingEnabled, setIsDataSharingEnabled] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(true);

  const toggleDataSharing = () => setIsDataSharingEnabled((prev) => !prev);
  const toggleProfileVisibility = () => setIsProfileVisible((prev) => !prev);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('privacy.title')}</Text>
      <View style={styles.option}>
        <Text style={styles.optionText}>{t('privacy.dataSharing')}</Text>
        <Switch
          trackColor={{ false: Colors.gray, true: Colors.blue }}
          thumbColor={isDataSharingEnabled ? Colors.white : Colors.darkGray}
          onValueChange={toggleDataSharing}
          value={isDataSharingEnabled}
        />
      </View>
      <View style={styles.option}>
        <Text style={styles.optionText}>{t('privacy.profileVisibility')}</Text>
        <Switch
          trackColor={{ false: Colors.gray, true: Colors.blue }}
          thumbColor={isProfileVisible ? Colors.white : Colors.darkGray}
          onValueChange={toggleProfileVisibility}
          value={isProfileVisible}
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