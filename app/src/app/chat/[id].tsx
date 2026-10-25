import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { themedStyles, useColors } from '@/lib/appearance';
import type { Message, Spark } from '@/lib/types';

const POLL_MS = 3_000;

export default function Chat() {
  const colors = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [spark, setSpark] = useState<Spark | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Messages up to this id were already here when the chat opened; only newer ones animate in.
  const [historyEnd, setHistoryEnd] = useState<number | null>(null);
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
    poll().then(() => setHistoryEnd(lastId.current));
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
      <Stack.Screen options={{ title: spark?.other?.display_name ?? '' }} />
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(message) => String(message.id)}
        extraData={historyEnd}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Animated.View
            // The list is inverted, so "up" here rises from the bottom on screen.
            entering={
              historyEnd !== null && item.id > historyEnd
                ? FadeInUp.springify().damping(18)
                : undefined
            }
            style={[styles.bubble, item.from_me ? styles.mine : styles.theirs]}>
            <AppText style={item.from_me && styles.mineText}>{item.body}</AppText>
          </Animated.View>
        )}
        ListFooterComponent={
          messages.length === 0 && spark ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityHint="Sends the icebreaker"
              onPress={() => send(spark.icebreaker)}
              disabled={sending}
              style={styles.starter}>
              <AppText variant="label" tone="accent">
                tap to send
              </AppText>
              <AppText style={styles.starterText}>{spark.icebreaker}</AppText>
            </PressableScale>
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
          placeholder="say something..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          style={styles.input}
        />
        <Button
          title="send"
          loading={sending}
          disabled={!draft.trim()}
          onPress={() => send()}
          style={styles.send}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.medium,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.text,
    borderBottomRightRadius: 6,
  },
  // Your bubbles are the text color, so their words take the page color.
  mineText: {
    color: colors.background,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderBottomLeftRadius: 6,
  },
  starter: {
    gap: Spacing.two,
    padding: Spacing.three + 4,
    marginVertical: Spacing.four,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  starterText: {
    fontFamily: Fonts.italic,
    fontSize: 25,
    lineHeight: 31,
    color: colors.text,
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
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    color: colors.text,
    fontFamily: Fonts.medium,
    fontSize: 18,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two + 4,
    paddingBottom: Spacing.two + 4,
  },
  send: {
    height: 46,
    paddingHorizontal: Spacing.three + 4,
  },
}));
