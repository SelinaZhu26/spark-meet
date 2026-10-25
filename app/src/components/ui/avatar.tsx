import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
};

/** A photo, or an italic initial on charcoal with a graphite hairline. */
export function Avatar({ name, url, size = 42 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) {
    return <Image source={url} style={[shape, styles.image]} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[shape, styles.fallback]}>
      <AppText
        style={{
          fontFamily: Fonts.regularItalic,
          fontSize: size * 0.54,
          lineHeight: size * 0.64,
          color: Colors.text,
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
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.lineStrong,
  },
});
