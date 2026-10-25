import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { Message, Spark } from '@/lib/types';

const POLL_MS = 3_000;

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [spark, setSpark] = useState<Spark | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);

  const poll = useCallback(async () => {
    try {
      const fresh = await api.messages(id, lastId.current);
      // Polls can overlap (timer + after sending); keep only unseen messages.
      const unseen = fresh.filter((message) => message.id > lastId.current);
      if (unseen.length > 0) {
        lastId.current = unseen[unseen.length - 1].id;
        setMessages((current) => [...current, ...unseen]);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    api.spark(id).then(setSpark, (err) => setError(errorMessage(err)));
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [id, poll]);

  const send = async (body = draft) => {
    const text = body.trim();
    if (!text) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.sendMessage(id, text);
      setDraft('');
      await poll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Stack.Screen options={{ title: spark?.other?.display_name ?? 'Chat' }} />
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(message) => String(message.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from_me ? styles.mine : styles.theirs]}>
            <AppText style={item.from_me ? styles.mineText : undefined}>{item.body}</AppText>
          </View>
        )}
        ListFooterComponent={
          messages.length === 0 && spark ? (
            <View style={styles.starter}>
              <AppText variant="caption" tone="muted">
                You matched on {spark.shared_interests.join(', ').toLowerCase()}. Break the ice:
              </AppText>
              <Pressable onPress={() => send(spark.icebreaker)} style={styles.suggestion}>
                <AppText>“{spark.icebreaker}”</AppText>
              </Pressable>
            </View>
          ) : undefined
        }
      />
      {error && (
        <AppText tone="danger" variant="caption" style={styles.error}>
          {error}
        </AppText>
      )}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={() => send()}
          disabled={sending || !draft.trim()}
          style={({ pressed }) => [
            styles.send,
            (pressed || sending || !draft.trim()) && styles.sendDisabled,
          ]}>
          <AppText style={styles.sendText}>↑</AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.large,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.parchment,
    borderBottomRightRadius: 4,
  },
  mineText: {
    color: Colors.ink,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  starter: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  suggestion: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderStyle: 'dashed',
  },
  error: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${Colors.brass}4D`,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.parchment,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: 800,
    color: Colors.ink,
  },
});
