import { defaultPlayerProfile, demoCredentials } from '@/constants/playerPlatform';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  position: string;
  location: string;
  clubStatus: string;
  role: 'player';
};

type StoredUser = AuthUser & {
  password: string;
};

type AuthResult = {
  ok: boolean;
  message?: string;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  position: string;
  location: string;
};

type AuthContextValue = {
  currentUser: AuthUser | null;
  demoEmail: string;
  demoPassword: string;
  signIn: (email: string, password: string) => AuthResult;
  signUp: (input: SignUpInput) => AuthResult;
  signOut: () => void;
  signInDemo: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
};

const USERS_KEY = 'nice-scout-player-users';
const SESSION_KEY = 'nice-scout-player-session';

const demoUser: StoredUser = {
  id: 'demo-player',
  name: defaultPlayerProfile.name,
  email: demoCredentials.email,
  password: demoCredentials.password,
  position: defaultPlayerProfile.position,
  location: defaultPlayerProfile.location,
  clubStatus: defaultPlayerProfile.clubStatus,
  role: 'player',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function storageAvailable() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: user.position,
    location: user.location,
    clubStatus: user.clubStatus,
    role: user.role,
  };
}

function readUsers(): StoredUser[] {
  if (!storageAvailable()) {
    return [demoUser];
  }

  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
      return [demoUser];
    }

    const parsed = JSON.parse(stored) as StoredUser[];
    const hasDemo = parsed.some((user) => user.email.toLowerCase() === demoUser.email);
    return hasDemo ? parsed : [demoUser, ...parsed];
  } catch {
    return [demoUser];
  }
}

function readSession(users: StoredUser[]): AuthUser | null {
  if (!storageAvailable()) {
    return null;
  }

  try {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const sessionUser = users.find((user) => user.id === sessionId);
    return sessionUser ? toAuthUser(sessionUser) : null;
  } catch {
    return null;
  }
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>(() => readUsers());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readSession(readUsers()));

  useEffect(() => {
    if (!storageAvailable()) {
      return;
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (!storageAvailable()) {
      return;
    }

    if (currentUser) {
      localStorage.setItem(SESSION_KEY, currentUser.id);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      demoEmail: demoCredentials.email,
      demoPassword: demoCredentials.password,
      signIn: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!validateEmail(normalizedEmail)) {
          return { ok: false, message: 'Enter a valid email address.' };
        }

        if (password.trim().length < 6) {
          return { ok: false, message: 'Password must be at least 6 characters.' };
        }

        const foundUser = users.find(
          (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
        );

        if (!foundUser) {
          return { ok: false, message: 'No player account matches those details.' };
        }

        setCurrentUser(toAuthUser(foundUser));
        return { ok: true };
      },
      signUp: ({ name, email, password, confirmPassword, position, location }) => {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
          return { ok: false, message: 'Enter your full name.' };
        }

        if (!validateEmail(normalizedEmail)) {
          return { ok: false, message: 'Enter a valid email address.' };
        }

        if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
          return { ok: false, message: 'That email already has a player account.' };
        }

        if (password.length < 6) {
          return { ok: false, message: 'Password must be at least 6 characters.' };
        }

        if (password !== confirmPassword) {
          return { ok: false, message: 'Passwords do not match.' };
        }

        const newUser: StoredUser = {
          id: `player-${Date.now()}`,
          name: trimmedName,
          email: normalizedEmail,
          password,
          position: position.trim() || defaultPlayerProfile.position,
          location: location.trim() || defaultPlayerProfile.location,
          clubStatus: 'Building profile',
          role: 'player',
        };

        setUsers((previousUsers) => [newUser, ...previousUsers]);
        setCurrentUser(toAuthUser(newUser));
        return { ok: true };
      },
      signOut: () => {
        setCurrentUser(null);
      },
      signInDemo: () => {
        setCurrentUser(toAuthUser(demoUser));
      },
      updateUser: (updates) => {
        setCurrentUser((previousUser) => {
          if (!previousUser) {
            return previousUser;
          }

          const updatedUser = { ...previousUser, ...updates };
          setUsers((previousUsers) =>
            previousUsers.map((user) =>
              user.id === previousUser.id ? { ...user, ...updates } : user,
            ),
          );
          return updatedUser;
        });
      },
    }),
    [currentUser, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
