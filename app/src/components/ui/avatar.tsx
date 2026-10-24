import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Gradients } from '@/constants/theme';

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
};

export function Avatar({ name, url, size = 56 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) {
    return <Image source={url} style={[shape, styles.image]} contentFit="cover" />;
  }
  return (
    <LinearGradient colors={Gradients.ember} style={[shape, styles.fallback]}>
      <AppText style={{ fontSize: size * 0.42, lineHeight: size * 0.5, fontWeight: 800, color: Colors.background }}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </AppText>
    </LinearGradient>
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
