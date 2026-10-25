import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';
import { pick, seedOf } from '@/lib/seed';

const FILLS = [Colors.lime, Colors.pink, Colors.purple, Colors.teal, Colors.yellow, Colors.orange];

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
};

export function Avatar({ name, url, size = 42 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) {
    return <Image source={url} style={[shape, styles.image]} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[shape, styles.fallback, { backgroundColor: pick(seedOf(name), FILLS) }]}>
      <AppText
        style={{
          fontFamily: Fonts.semiBold,
          fontSize: size * 0.5,
          lineHeight: size * 0.6,
          color: Colors.ink,
        }}>
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
