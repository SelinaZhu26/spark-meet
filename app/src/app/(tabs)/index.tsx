import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { SparkBlock, type Palette } from '@/components/spark-block';
import { useTabBarSpace } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { useMe } from '@/lib/session';
import { useSparkSwitch } from '@/lib/spark-switch';

const OFF: Palette = [Colors.purple, Colors.teal, Colors.yellow];
const ON: Palette = [Colors.yellow, Colors.pink, Colors.ink];

export default function Home() {
  const { profile } = useMe();
  const { active, busy, mode, error, toggle } = useSparkSwitch();
  const { width } = useWindowDimensions();
  const tabBarSpace = useTabBarSpace();
  const blockWidth = Math.min(width - Spacing.three * 2, 480);
  // The block fills whatever height is left, like a story card.
  const [blockHeight, setBlockHeight] = useState(0);
  const pools = [profile.friends_enabled && 'friends', profile.dating_enabled && 'dating']
    .filter(Boolean)
    .join(' & ');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}>
        <Animated.View entering={rise(0)} style={styles.topbar}>
          <Logo />
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.heading}>
          <AppText variant="title" numberOfLines={1}>
            hey {profile.display_name}
          </AppText>
          <AppText variant="title" tone="muted" numberOfLines={1}>
            {pools}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={rise(2)}
          style={[styles.blockSlot, { minHeight: blockWidth }]}
          onLayout={(event) => setBlockHeight(event.nativeEvent.layout.height)}>
          <SparkBlock
            palette={active ? ON : OFF}
            seed={profile.id}
            width={blockWidth}
            height={blockHeight || blockWidth}
            live={active}
            pulse={active}>
            <AppText variant="hero" tone="ink">
              {active ? 'looking for your people' : 'spark is off'}
            </AppText>
            <Button
              title={active ? 'turn off' : 'turn on'}
              icon={active ? 'pause' : 'play'}
              variant="dark"
              loading={busy}
              onPress={toggle}
              style={styles.toggle}
            />
          </SparkBlock>
        </Animated.View>

        {(error || (active && mode === 'foreground')) && (
          <View style={styles.notes}>
            {active && mode === 'foreground' && (
              <AppText variant="caption" tone="muted">
                keep spark open. background mode needs a dev build.
              </AppText>
            )}
            {error && <AppText tone="danger">{error}</AppText>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
    alignItems: 'center',
  },
  blockSlot: {
    flexGrow: 1,
  },
  topbar: {
    alignSelf: 'stretch',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  heading: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.one,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: Spacing.four,
  },
  notes: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
});
