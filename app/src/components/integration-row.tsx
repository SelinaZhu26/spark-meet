import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Fonts, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { themedStyles } from '@/lib/appearance';
import { connectIntegration, providerInfo } from '@/lib/integrations';
import type { Integration, Provider } from '@/lib/types';

export type IntegrationRowProps = {
  provider: Provider;
  integration: Integration | undefined;
  onChanged: () => void;
};

export function IntegrationRow({ provider, integration, onChanged }: IntegrationRowProps) {
  const styles = useStyles();
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
          setNote(`couldn't read your ${info.label} account. try again?`);
        } else if (result === 'denied') {
          setNote('nothing was linked.');
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
      <View style={styles.logo}>
        <AppText style={styles.logoText}>{info.label.charAt(0)}</AppText>
      </View>
      <View style={styles.text}>
        <AppText style={styles.title}>{info.label}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {note ?? integration?.summary ?? info.pitch.toLowerCase()}
        </AppText>
      </View>
      <Button
        title={integration ? 'unlink' : 'link'}
        variant={integration ? 'ghost' : 'primary'}
        size="small"
        loading={busy}
        onPress={toggle}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  logoText: {
    fontFamily: Fonts.regularItalic,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
  },
}));
