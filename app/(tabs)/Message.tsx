import { SocketStatusBadge } from '@/components/SocketStatusBadge';
import { colors, messages, opportunities } from '@/constants/playerPlatform';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '500',
  },
  searchShell: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 10,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 10,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    fontWeight: '800',
    color: colors.ink,
  },
  time: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  subject: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 3,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  contextRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  contextText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  emptyState: {
    marginTop: 16,
    padding: 28,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
});
