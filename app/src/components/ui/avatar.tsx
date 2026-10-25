import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Pastels } from '@/constants/theme';

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
  /** Background when there's no photo. */
  color?: string;
};

export function Avatar({ name, url, size = 56, color = Pastels.dating[1] }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) {
    return <Image source={url} style={[shape, styles.image]} contentFit="cover" />;
  }
  return (
    <View style={[shape, styles.fallback, { backgroundColor: color }]}>
      <AppText style={{ fontSize: size * 0.42, lineHeight: size * 0.5, fontWeight: 800, color: Colors.ink }}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceRaised,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
