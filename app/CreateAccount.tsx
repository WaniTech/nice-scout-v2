import { colors } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const positions = ['Right winger', 'Striker', 'Central midfielder', 'Fullback'];

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState(positions[0]);
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState('');

  const handleCreateAccount = () => {
    const result = signUp({
      name,
      email,
      password,
      confirmPassword,
      position,
      location,
    });

    if (!result.ok) {
      setError(result.message ?? 'Could not create player profile.');
      return;
    }

    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>Player onboarding</Text>
            <Text style={styles.title}>Create your player profile</Text>
            <Text style={styles.subtitle}>
              Clubs need the basics first. You can refine clips, data, and preferences inside the app.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account details</Text>

          <View style={styles.inputShell}>
            <Ionicons name="person-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#899188"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons name="mail-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#899188"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
            />
          </View>

          <Text style={styles.label}>Primary position</Text>
          <View style={styles.positionGrid}>
            {positions.map((item) => {
              const selected = item === position;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.positionChip, selected && styles.positionChipActive]}
                  onPress={() => setPosition(item)}
                >
                  <Text style={[styles.positionText, selected && styles.positionTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputShell}>
            <Ionicons name="location-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Current city, country"
              placeholderTextColor="#899188"
              value={location}
              onChangeText={(value) => {
                setLocation(value);
                setError('');
              }}
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#899188"
              secureTextEntry={securePassword}
              autoCapitalize="none"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
            />
            <Pressable
              style={styles.iconButton}
              onPress={() => setSecurePassword((currentValue) => !currentValue)}
            >
              <Ionicons
                name={securePassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

          <View style={styles.inputShell}>
            <Ionicons name="checkmark-circle-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#899188"
              secureTextEntry={securePassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError('');
              }}
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAccount}>
            <Text style={styles.primaryButtonText}>Create profile</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already signed up?</Text>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.footerLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 30,
  },
  header: {
    gap: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#0B160F',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 10,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  positionChip: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
  },
  positionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  positionText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 13,
  },
  positionTextActive: {
    color: colors.primary,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBE9E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: colors.red,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
});
