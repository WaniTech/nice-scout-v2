import { colors } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
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

const heroImage = require('../assets/images/player-hero.png');

export default function LoginScreen() {
  const router = useRouter();
  const { demoEmail, demoPassword, signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState('');

  const handleLogin = () => {
    const result = signIn(email, password);

    if (!result.ok) {
      setError(result.message ?? 'Could not sign in.');
      return;
    }

    setError('');
  };

  const handleDemo = () => {
    signInDemo();
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
        <ImageBackground source={heroImage} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroShade} />
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="football" size={19} color={colors.accent} />
            </View>
            <Text style={styles.brandText}>Scout Link Player</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Verified player pathway</Text>
            <Text style={styles.title}>Turn your profile into real club conversations.</Text>
            <Text style={styles.subtitle}>
              Build a player CV, match with trials, and keep scout messages in one place.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sign in</Text>
          <Text style={styles.panelSubtitle}>Use the demo player or your saved account.</Text>

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

          <View style={styles.inputShell}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#899188"
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry={securePassword}
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

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Log in</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleDemo}>
            <Ionicons name="flash-outline" size={19} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Use demo player</Text>
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoLabel}>Demo login</Text>
            <Text style={styles.demoValue}>{demoEmail}</Text>
            <Text style={styles.demoValue}>{demoPassword}</Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>No player profile yet?</Text>
            <TouchableOpacity onPress={() => router.push('/CreateAccount')}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 28,
  },
  hero: {
    minHeight: 360,
    paddingHorizontal: 22,
    paddingTop: 62,
    paddingBottom: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 9, 0.48)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroCopy: {
    maxWidth: 440,
  },
  eyebrow: {
    color: '#E8C77C',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
  subtitle: {
    color: '#E2E8DD',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 360,
  },
  panel: {
    marginHorizontal: 16,
    marginTop: -42,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#0B160F',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  panelTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
  },
  panelSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 5,
    marginBottom: 18,
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
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  demoBox: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#F7F2E6',
    borderWidth: 1,
    borderColor: '#E4D4AD',
    padding: 12,
  },
  demoLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  demoValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
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
