import { colors } from '@/constants/playerPlatform';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.iconShell}>
          <Ionicons name="football-outline" size={34} color={colors.accent} />
        </View>
        <Text style={styles.title}>Own goal. This screen does not exist.</Text>
        <Text style={styles.subtitle}>Head back to Scout Link Player and keep the move alive.</Text>
        <Link href="/" style={styles.link}>
          Back to login
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  iconShell: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  link: {
    marginTop: 20,
    minHeight: 46,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontWeight: '900',
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
});
