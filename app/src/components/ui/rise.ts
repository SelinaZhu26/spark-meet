import { Easing, FadeInDown } from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Entering animation for a screen's sections: each rises in a beat after the one before. */
export function rise(order = 0) {
  return FadeInDown.delay(order * 50)
    .duration(500)
    .easing(EASE_OUT);
}

/** Slower, story-style reveal for big moments. */
export function reveal(order = 0) {
  return FadeInDown.delay(250 + order * 300)
    .duration(700)
    .easing(EASE_OUT);
}
