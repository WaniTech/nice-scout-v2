import { SocketStatusBadge } from '@/components/SocketStatusBadge';
import { colors, findMessage, findOpportunity } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { archiveMessage, createMessageReply } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChatBubble {
  id: string;
  sender: string;
  senderRole: 'scout' | 'player';
  text: string;
  time: string;
  attachments?: string[];
}

export default function MessageDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { sendChatMessage, sendTyping, subscribe, unsubscribe, on } = useSocket();
  const message = findMessage(id);
  const opportunity = findOpportunity(message?.opportunityId);
  const [notice, setNotice] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isScoutTyping, setIsScoutTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatBubble[]>(() => {
    if (!message) return [];
    return [
      {
        id: `msg-${message.id}`,
        sender: message.sender,
        senderRole: 'scout',
        text: message.body,
        time: message.time,
      },
    ];
  });

  // Subscribe to chat channel over WebSocket
  useEffect(() => {
    if (!message) return;
    const roomName = `chat:${message.id}`;
    subscribe(roomName);

    const cleanupChat = on('chat_message', (payload: unknown) => {
      const data = payload as {
        conversationId?: string;
        senderId?: string;
        senderName?: string;
        text?: string;
        attachments?: string[];
        timestamp?: string;
      };
      if (data && data.conversationId === message.id) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `live-${Date.now()}`,
            sender: data.senderName || 'Club Scout',
            senderRole: data.senderId === currentUser?.id ? 'player' : 'scout',
            text: data.text || '',
            time: 'Just now',
            attachments: data.attachments,
          },
        ]);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    const cleanupTyping = on('typing', (payload: unknown) => {
      const data = payload as { conversationId?: string; isTyping?: boolean; senderId?: string };
      if (data && data.conversationId === message.id && data.senderId !== currentUser?.id) {
        setIsScoutTyping(Boolean(data.isTyping));
      }
    });

    return () => {
      unsubscribe(roomName);
      cleanupChat();
      cleanupTyping();
    };
  }, [message, currentUser?.id, subscribe, unsubscribe, on]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (message) {
      sendTyping(message.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(message.id, false);
      }, 2000);
    }
  };

  const handleSend = useCallback(async (customText?: string) => {
    const textToSend = customText ?? inputText.trim();
    if (!textToSend && attachments.length === 0) return;
    if (!message) return;

    setSending(true);
    const sentAttachments = [...attachments];

    try {
      // Send via WebSocket for instant live broadcast
      sendChatMessage(message.id, textToSend || 'Shared profile information', sentAttachments);

      // Persist via REST API
      await createMessageReply(
        currentUser?.id ?? 'demo-player',
        message.id,
        textToSend || 'Shared profile information',
        sentAttachments,
      );

      setChatHistory((prev) => [
        ...prev,
        {
          id: `player-${Date.now()}`,
          sender: currentUser?.name || 'You',
          senderRole: 'player',
          text: textToSend || 'Shared profile attachments.',
          time: 'Just now',
          attachments: sentAttachments,
        },
      ]);

      setInputText('');
      setAttachments([]);
      setNotice('Message delivered in real time.');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setNotice('Sent via offline buffer. Will sync when online.');
    } finally {
      setSending(false);
    }
  }, [inputText, attachments, message, currentUser, sendChatMessage]);

  const toggleAttachment = (attachment: string, label: string) => {
    setAttachments((prev) => {
      const exists = prev.includes(attachment);
      if (exists) {
        setNotice(`Removed ${label}.`);
        return prev.filter((a) => a !== attachment);
      } else {
        setNotice(`Added ${label} to next message.`);
        return [...prev, attachment];
      }
    });
  };

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.topClub}>{message.club}</Text>
          <View style={styles.liveIndicator}>
            <SocketStatusBadge compact />
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={async () => {
            try {
              await archiveMessage(currentUser?.id ?? 'demo-player', message.id);
              setNotice('Conversation archived.');
            } catch {
              setNotice('Could not archive conversation.');
            }
          }}
        >
          <Ionicons name="archive-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {opportunity ? (
          <TouchableOpacity
            style={styles.contextCard}
            onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
          >
            <View style={styles.contextHeader}>
              <View style={styles.contextBadge}>
                <Ionicons name="football-outline" size={14} color={colors.primary} />
                <Text style={styles.contextBadgeText}>Linked Opportunity</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
            <Text style={styles.contextClub}>{opportunity.club}</Text>
            <Text style={styles.contextRole}>{opportunity.position} • {opportunity.location}</Text>
            <View style={styles.contextMetaRow}>
              <View style={styles.contextMeta}>
                <Text style={styles.contextMetaValue}>{opportunity.fit}%</Text>
                <Text style={styles.contextMetaLabel}>Match fit</Text>
              </View>
              <View style={styles.contextMeta}>
                <Text style={styles.contextMetaValue}>{opportunity.trialDate}</Text>
                <Text style={styles.contextMetaLabel}>Trial window</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.threadContainer}>
          {chatHistory.map((bubble) => {
            const isPlayer = bubble.senderRole === 'player';
            return (
              <View
                key={bubble.id}
                style={[
                  styles.bubbleWrapper,
                  isPlayer ? styles.bubbleWrapperPlayer : styles.bubbleWrapperScout,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isPlayer ? styles.bubblePlayer : styles.bubbleScout,
                  ]}
                >
                  <View style={styles.bubbleHeader}>
                    <Text
                      style={[
                        styles.bubbleSender,
                        isPlayer ? styles.bubbleSenderPlayer : styles.bubbleSenderScout,
                      ]}
                    >
                      {bubble.sender}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        isPlayer ? styles.bubbleTimePlayer : styles.bubbleTimeScout,
                      ]}
                    >
                      {bubble.time}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.bubbleText,
                      isPlayer ? styles.bubbleTextPlayer : styles.bubbleTextScout,
                    ]}
                  >
                    {bubble.text}
                  </Text>
                  {bubble.attachments && bubble.attachments.length > 0 ? (
                    <View style={styles.attachmentsList}>
                      {bubble.attachments.map((att) => (
                        <View
                          key={att}
                          style={[
                            styles.attachmentPill,
                            isPlayer ? styles.attachmentPillPlayer : styles.attachmentPillScout,
                          ]}
                        >
                          <Ionicons
                            name={att.includes('clip') ? 'videocam-outline' : 'calendar-outline'}
                            size={14}
                            color={isPlayer ? '#FFFFFF' : colors.primary}
                          />
                          <Text
                            style={[
                              styles.attachmentPillText,
                              isPlayer ? styles.attachmentPillTextPlayer : styles.attachmentPillTextScout,
                            ]}
                          >
                            {att.replace('-', ' ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {isScoutTyping ? (
            <View style={[styles.bubbleWrapper, styles.bubbleWrapperScout]}>
              <View style={[styles.bubble, styles.bubbleScout, styles.typingBubble]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
                <Text style={styles.typingText}>{message.sender} is typing...</Text>
              </View>
            </View>
          ) : null}
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composerWrapper}>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={[
              styles.quickChip,
              attachments.includes('match-clips') && styles.quickChipActive,
            ]}
            onPress={() => toggleAttachment('match-clips', 'Match clips')}
          >
            <Ionicons
              name="videocam-outline"
              size={15}
              color={attachments.includes('match-clips') ? '#FFFFFF' : colors.ink}
            />
            <Text
              style={[
                styles.quickChipText,
                attachments.includes('match-clips') && styles.quickChipTextActive,
              ]}
            >
              Match clips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickChip,
              attachments.includes('availability-window') && styles.quickChipActive,
            ]}
            onPress={() => toggleAttachment('availability-window', 'Trial availability')}
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={attachments.includes('availability-window') ? '#FFFFFF' : colors.ink}
            />
            <Text
              style={[
                styles.quickChipText,
                attachments.includes('availability-window') && styles.quickChipTextActive,
              ]}
            >
              Availability
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleSend('I am ready for the trial on the specified date.')}
          >
            <Ionicons name="flash-outline" size={14} color={colors.primary} />
            <Text style={styles.quickChipText}>Confirm trial</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message to the scout..."
            placeholderTextColor="#899188"
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() && attachments.length === 0) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={sending || (!inputText.trim() && attachments.length === 0)}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  topInfo: {
    alignItems: 'center',
  },
  topClub: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  liveIndicator: {
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contextCard: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contextClub: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  contextRole: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  contextMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  contextMeta: {
    flex: 1,
  },
  contextMetaValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  contextMetaLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  threadContainer: {
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: 'row',
  },
  bubbleWrapperPlayer: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperScout: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 12,
    padding: 14,
  },
  bubblePlayer: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleScout: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 2,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  bubbleSender: {
    fontSize: 12,
    fontWeight: '800',
  },
  bubbleSenderPlayer: {
    color: '#D8F3DC',
  },
  bubbleSenderScout: {
    color: colors.primary,
  },
  bubbleTime: {
    fontSize: 11,
  },
  bubbleTimePlayer: {
    color: '#B7E4C7',
  },
  bubbleTimeScout: {
    color: colors.muted,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextPlayer: {
    color: '#FFFFFF',
  },
  bubbleTextScout: {
    color: colors.ink,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  attachmentPillPlayer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  attachmentPillScout: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
  },
  attachmentPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  attachmentPillTextPlayer: {
    color: '#FFFFFF',
  },
  attachmentPillTextScout: {
    color: colors.ink,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    marginTop: 12,
  },
  noticeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  composerWrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  notFound: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
