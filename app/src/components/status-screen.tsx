import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, type ButtonProps } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

export type StatusScreenProps = {
  title?: string;
  message?: string | null;
  actions?: Pick<ButtonProps, 'title' | 'onPress' | 'variant'>[];
};

/** Full-screen loading or error state. Shows a spinner when there's no title. */
export function StatusScreen({ title, message, actions = [] }: StatusScreenProps) {
  return (
    <View style={styles.screen}>
      {title ? (
        <>
          <AppText style={styles.bolt}>⚡</AppText>
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
        <ActivityIndicator size="large" color={Colors.flame} />
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
  bolt: {
    fontSize: 56,
    lineHeight: 68,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
