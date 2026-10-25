import { Shape } from '@/components/ui/shapes';
import { Colors } from '@/constants/theme';

/** The shapes drifting at the top of the light screens. */
export function WelcomeShapes() {
  return (
    <>
      <Shape
        kind="circle"
        size={300}
        color={Colors.lime}
        motion="float"
        style={{ top: -70, right: -90 }}
      />
      <Shape
        kind="bolt"
        size={68}
        color={Colors.ink}
        motion="float"
        rotate={14}
        style={{ top: 40, right: 172 }}
      />
      <Shape
        kind="ring"
        size={110}
        color={Colors.purple}
        motion="float"
        style={{ top: 84, right: 22 }}
      />
    </>
  );
}
