import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sparkler } from '@/components/sparkler';
import { useTabBarSpace } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { rise } from '@/components/ui/rise';
import { VIEW } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Fonts, Spacing } from '@/constants/theme';
import { themedStyles } from '@/lib/appearance';
import { useMe } from '@/lib/session';
import { useSparkSwitch } from '@/lib/spark-switch';

export default function Home() {
  const styles = useStyles();
  const { profile } = useMe();
  const { active, busy, mode, error, toggle } = useSparkSwitch();
  const tabBarSpace = useTabBarSpace();
  // The sparkler fills whatever room is left between the top bar and the switch.
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const size = Math.min(scene.height, (scene.width * VIEW.height) / VIEW.width);
  const pools = [profile.friends_enabled && 'friends', profile.dating_enabled && 'dating']
    .filter(Boolean)
    .join(' & ');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}>
        <Animated.View entering={rise(0)} style={styles.topbar}>
          <AppText style={styles.wordmark}>spark</AppText>
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {pools}
          </AppText>
        </Animated.View>

        <View
          style={styles.scene}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setScene({ width, height });
          }}>
          {size > 0 && (
            <Animated.View entering={FadeIn.duration(900)}>
              <Sparkler size={size} lit={active ? 1 : 0} />
            </Animated.View>
          )}
        </View>

        <Animated.View key={active ? 'on' : 'off'} entering={rise(1)} style={styles.status}>
          <AppText variant="hero" style={active ? undefined : styles.dim}>
            {active ? 'spark is lit' : 'spark is off'}
          </AppText>
          <AppText tone="secondary" style={styles.center}>
            {active
              ? "we'll buzz you both when someone's close"
              : 'light it, then put your phone away'}
          </AppText>
        </Animated.View>

        <Animated.View entering={rise(2)}>
          <Button
            title={active ? 'turn off' : 'turn on'}
            variant={active ? 'ghost' : 'primary'}
            loading={busy}
            onPress={toggle}
            style={styles.toggle}
          />
        </Animated.View>

        {(error || (active && mode === 'foreground')) && (
          <View style={styles.notes}>
            {active && mode === 'foreground' && (
              <AppText variant="caption" tone="muted" style={styles.center}>
                keep spark open. background mode needs a dev build.
              </AppText>
            )}
            {error && (
              <AppText tone="danger" style={styles.center}>
                {error}
              </AppText>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four - 4,
    gap: Spacing.three,
    alignItems: 'center',
  },
  topbar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
  },
  wordmark: {
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  scene: {
    flexGrow: 1,
    alignSelf: 'stretch',
    // Full-bleed: the sparkler's rays may reach the screen's edges.
    marginHorizontal: -(Spacing.four - 4),
    minHeight: 320,
    alignItems: 'center',
    // Held from below, with the night sky above for the specks.
    justifyContent: 'flex-end',
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  dim: {
    color: colors.textSecondary,
  },
  center: {
    textAlign: 'center',
  },
  toggle: {
    minWidth: 200,
    marginTop: Spacing.two,
  },
  notes: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
}));
