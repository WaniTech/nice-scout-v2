import { SocketConnectionState, useSocket } from '@/contexts/SocketContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  compact?: boolean;
  showReconnectButton?: boolean;
};

export function SocketStatusBadge({ compact = false, showReconnectButton = false }: Props) {
  const { status, isConnected, reconnect } = useSocket();

  const getStatusColor = (state: SocketConnectionState) => {
    switch (state) {
      case 'connected':
        return '#22C55E'; // Emerald Green
      case 'connecting':
      case 'reconnecting':
        return '#F59E0B'; // Amber
      case 'error':
        return '#EF4444'; // Red
      case 'disconnected':
      default:
        return '#9CA3AF'; // Gray
    }
  };

  const getStatusText = (state: SocketConnectionState) => {
    switch (state) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
      default:
        return 'Offline';
    }
  };

  const color = getStatusColor(status);
  const text = getStatusText(status);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.compactText, { color }]}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={styles.text}>{text}</Text>
      {showReconnectButton && !isConnected && (
        <TouchableOpacity style={styles.reconnectButton} onPress={reconnect}>
          <Text style={styles.reconnectText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  reconnectButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  reconnectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
});
