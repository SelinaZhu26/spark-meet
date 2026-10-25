import { Image } from 'expo-image';
import { View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Fonts } from '@/constants/theme';
import { themedStyles, useColors } from '@/lib/appearance';

export type AvatarProps = {
  name: string;
  url: string | null;
  size?: number;
};

/** A photo, or an italic initial on charcoal with a graphite hairline. */
export function Avatar({ name, url, size = 42 }: AvatarProps) {
  const colors = useColors();
  const styles = useStyles();
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
          color: colors.text,
        }}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </AppText>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  image: {
    backgroundColor: colors.surfaceRaised,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
}));
