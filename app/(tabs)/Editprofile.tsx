import { colors, defaultPlayerProfile } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { updatePlayerProfile } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, updateUser } = useAuth();
  const [name, setName] = useState(currentUser?.name ?? defaultPlayerProfile.name);
  const [email, setEmail] = useState(currentUser?.email ?? defaultPlayerProfile.email);
  const [position, setPosition] = useState(currentUser?.position ?? defaultPlayerProfile.position);
  const [location, setLocation] = useState(currentUser?.location ?? defaultPlayerProfile.location);
  const [clubStatus, setClubStatus] = useState(currentUser?.clubStatus ?? defaultPlayerProfile.clubStatus);
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const handleSave = async () => {
    const updates = {
      name,
      email,
      position,
      location,
      clubStatus,
    };

    updateUser(updates);

    try {
      await updatePlayerProfile(currentUser?.id ?? 'demo-player', updates);
      setSyncNotice('Profile updated through the API');
    } catch {
      setSyncNotice('Profile saved locally. API sync is unavailable.');
    }

    setSaved(true);
    setTimeout(() => router.replace('/Profile'), 350);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Profile editor</Text>
            <Text style={styles.title}>Update player details</Text>
          </View>
        </View>

        <View style={styles.form}>
          <ProfileInput
            icon="person-outline"
            label="Full name"
            value={name}
            onChangeText={setName}
          />
          <ProfileInput
            icon="mail-outline"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <ProfileInput
            icon="football-outline"
            label="Primary position"
            value={position}
            onChangeText={setPosition}
          />
          <ProfileInput
            icon="location-outline"
            label="Current base"
            value={location}
            onChangeText={setLocation}
          />
          <ProfileInput
            icon="shield-checkmark-outline"
            label="Club status"
            value={clubStatus}
            onChangeText={setClubStatus}
          />

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.savedText}>{syncNotice || 'Profile saved'}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save changes</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileInput({
  icon,
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={19} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  form: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 10,
  },
  savedRow: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedText: {
    color: colors.primary,
    fontWeight: '900',
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
