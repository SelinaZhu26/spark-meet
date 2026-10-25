import { StyleSheet, View } from 'react-native';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Dots } from '@/components/ui/dots';
import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing, Tones } from '@/constants/theme';

export type StatusScreenProps = {
  title?: string;
  message?: string | null;
  actions?: Pick<ButtonProps, 'title' | 'onPress' | 'variant'>[];
};

/** Full-screen loading or error state. Shows the loader when there's no title. */
export function StatusScreen({ title, message, actions = [] }: StatusScreenProps) {
  return (
    <View style={styles.screen}>
      {title ? (
        <>
          <SparkMark
            size={72}
            ink={Colors.textMuted}
            gold={Colors.textMuted}
            ash={Colors.surfaceRaised}
          />
          <AppText variant="title" style={styles.center}>
            {title}
          </AppText>
          {message && (
            <AppText tone="secondary" style={styles.center}>
              {message}
            </AppText>
          )}
          {actions.map((action) => (
            <Button key={action.title} {...action} style={styles.button} />
          ))}
        </>
      ) : (
        <Dots color={Tones.accent} size={10} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
