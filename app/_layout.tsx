import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <AuthProvider>
      <RootNavigator colorScheme={colorScheme} />
    </AuthProvider>
  );
}

function RootNavigator({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
  const { currentUser } = useAuth();
  const isSignedIn = Boolean(currentUser);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#F5F7F0',
          },
        }}
      >
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="CreateAccount" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="JobDetail" />
          <Stack.Screen name="MessageDetail" />
          <Stack.Screen name="PlayerMatch" />
          <Stack.Screen name="Profile/HiddenCriteria" />
          <Stack.Screen name="Profile/JobPreferences" />
          <Stack.Screen name="Profile/Qualifications" />
          <Stack.Screen name="Profile/ReadyToWork" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
