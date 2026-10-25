import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { connectIntegration, providerInfo } from '@/lib/integrations';
import type { Integration, Provider } from '@/lib/types';

export type IntegrationRowProps = {
  provider: Provider;
  integration: Integration | undefined;
  onChanged: () => void;
};

export function IntegrationRow({ provider, integration, onChanged }: IntegrationRowProps) {
  const info = providerInfo[provider];
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const toggle = async () => {
    setBusy(true);
    setNote(null);
    try {
      if (integration) {
        await api.disconnectIntegration(provider);
      } else {
        const result = await connectIntegration(provider);
        if (result === 'error') {
          setNote(`Couldn't read your ${info.label} account. Try again?`);
        } else if (result === 'denied') {
          setNote('No worries, nothing was linked.');
        }
      }
      onChanged();
    } catch (err) {
      setNote(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <View style={styles.text}>
        <AppText variant="heading">{info.label}</AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={3}>
          {note ?? integration?.summary ?? info.pitch}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        disabled={busy}
        style={({ pressed }) => [
          styles.action,
          integration && styles.actionConnected,
          (pressed || busy) && styles.pressed,
        ]}>
        <AppText variant="caption" style={[styles.actionText, !!integration && styles.actionTextConnected]}>
          {busy ? '…' : integration ? 'Unlink' : 'Link'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  action: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.text,
  },
  actionConnected: {
    backgroundColor: Colors.surfaceRaised,
  },
  actionText: {
    fontWeight: 800,
    color: Colors.ink,
  },
  actionTextConnected: {
    color: Colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
});
