import { SocketStatusBadge } from '@/components/SocketStatusBadge';
import { colors, messages, opportunities } from '@/constants/playerPlatform';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MessagePage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const filteredMessages = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return messages;
    }

    return messages.filter((message) =>
      [message.club, message.sender, message.subject, message.preview]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [searchText]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <Text style={styles.kicker}>Recruitment inbox</Text>
              <SocketStatusBadge compact />
            </View>
            <Text style={styles.title}>Club messages</Text>
            <Text style={styles.subtitle}>
              Follow up quickly when scouts ask for clips, data, or trial dates.
            </Text>
            <View style={styles.searchShell}>
              <Ionicons name="search-outline" size={19} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search inbox..."
                placeholderTextColor="#899188"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={30} color={colors.muted} />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptyText}>Try another club or scout name.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const opportunity = opportunities.find((entry) => entry.id === item.opportunityId);

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({ pathname: '/MessageDetail', params: { id: item.id } })}
            >
              <View style={[styles.avatar, item.unread && styles.avatarUnread]}>
                <Ionicons name={item.icon} size={24} color={item.unread ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.clubName}>{item.club}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.message} numberOfLines={2}>{item.preview}</Text>
                {opportunity ? (
                  <View style={styles.contextRow}>
                    <Ionicons name="football-outline" size={14} color={colors.accent} />
                    <Text style={styles.contextText}>{opportunity.position}</Text>
                  </View>
                ) : null}
              </View>
              {item.unread ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 102,
  },
  header: {
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  searchShell: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 10,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: colors.primary,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  clubName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },
  subject: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 4,
  },
  contextRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7F2E6',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  contextText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  emptyState: {
    marginTop: 16,
    padding: 24,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 17,
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
