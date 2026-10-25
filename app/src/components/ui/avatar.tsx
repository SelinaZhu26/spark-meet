import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Gradients } from '@/constants/theme';

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
};

/** A round portrait in a brass ring. */
export function Avatar({ name, url, size = 56 }: AvatarProps) {
  const inner = size - 6;
  const shape = { width: inner, height: inner, borderRadius: inner / 2 };
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      {url ? (
        <Image source={url} style={[shape, styles.image]} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={Gradients.rarity4}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[shape, styles.fallback]}>
          <AppText style={{ fontSize: inner * 0.42, lineHeight: inner * 0.52, fontWeight: 700, color: Colors.parchment }}>
            {name.trim().charAt(0).toUpperCase() || '?'}
          </AppText>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1.5,
    borderColor: Colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: Colors.surfaceRaised,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
