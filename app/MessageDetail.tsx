import { colors, findMessage, findOpportunity } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { archiveMessage, createMessageReply } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MessageDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const message = findMessage(id);
  const opportunity = findOpportunity(message?.opportunityId);
  const [notice, setNotice] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  if (!message) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="chatbox-ellipses-outline" size={34} color={colors.muted} />
        <Text style={styles.notFoundTitle}>Message not found</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={async () => {
              try {
                await archiveMessage(currentUser?.id ?? 'demo-player', message.id);
                setNotice('Conversation archived through the API.');
              } catch {
                setNotice('Could not archive through the API. Try again when the API is running.');
              }
            }}
          >
            <Ionicons name="archive-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.messageCard}>
          <View style={styles.senderRow}>
            <View style={styles.avatar}>
              <Ionicons name={message.icon} size={25} color="#FFFFFF" />
            </View>
            <View style={styles.senderCopy}>
              <Text style={styles.club}>{message.club}</Text>
              <Text style={styles.sender}>{message.sender}</Text>
            </View>
            <Text style={styles.time}>{message.time}</Text>
          </View>

          <Text style={styles.subject}>{message.subject}</Text>
          <Text style={styles.body}>{message.body}</Text>
        </View>

        {opportunity ? (
          <TouchableOpacity
            style={styles.contextCard}
            onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
          >
            <View style={styles.contextHeader}>
              <Text style={styles.kicker}>Linked opportunity</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <Text style={styles.contextClub}>{opportunity.club}</Text>
            <Text style={styles.contextRole}>{opportunity.position}</Text>
            <View style={styles.contextMetaRow}>
              <View style={styles.contextMeta}>
                <Text style={styles.contextMetaValue}>{opportunity.fit}%</Text>
                <Text style={styles.contextMetaLabel}>Fit</Text>
              </View>
              <View style={styles.contextMeta}>
                <Text style={styles.contextMetaValue}>{opportunity.trialDate}</Text>
                <Text style={styles.contextMetaLabel}>Trial date</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.replyCard}>
          <Text style={styles.replyTitle}>Quick actions</Text>
          {notice ? (
            <View style={styles.notice}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setAttachments((currentAttachments) => [...new Set([...currentAttachments, 'match-clips'])]);
              setNotice('Match clips added to your reply draft.');
            }}
          >
            <Ionicons name="videocam-outline" size={19} color={colors.primary} />
            <Text style={styles.actionText}>Attach match clips</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setAttachments((currentAttachments) => [...new Set([...currentAttachments, 'availability-window'])]);
              setNotice('Availability window added to your reply draft.');
            }}
          >
            <Ionicons name="calendar-outline" size={19} color={colors.primary} />
            <Text style={styles.actionText}>Share availability</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={async () => {
              try {
                await createMessageReply(
                  currentUser?.id ?? 'demo-player',
                  message.id,
                  'Thanks, I will send the requested details.',
                  attachments,
                );
                setNotice('Reply saved through the API.');
              } catch {
                setNotice('Could not save reply through the API. Try again when the API is running.');
              }
            }}
          >
            <Text style={styles.replyButtonText}>Reply to scout</Text>
            <Ionicons name="send-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  messageCard: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderCopy: {
    flex: 1,
  },
  club: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  sender: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  subject: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  contextCard: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: '#E8C77C',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  contextClub: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 14,
  },
  contextRole: {
    color: '#DDE8D8',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  contextMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  contextMeta: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
  },
  contextMetaValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  contextMetaLabel: {
    color: '#DDE8D8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  replyCard: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  replyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  notice: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    marginBottom: 9,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  replyButton: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  notFound: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
});
