import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeOut,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { WelcomeShapes } from '@/components/welcome-shapes';
import { Colors, Fonts, Radius, Spacing, Springs, Welcome } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import {
  SUGGESTED_INTERESTS,
  cleanInterest,
  isSuggested,
  sameInterest,
  toggleInterest,
} from '@/lib/interests';
import { useMe, useSession } from '@/lib/session';

const STEPS = 4;
const MIN_INTERESTS = 3;
const PLACEHOLDER = 'rgba(34, 24, 42, 0.45)';

export default function Onboarding() {
  const { setMe } = useSession();
  const { profile } = useMe();
  const [step, setStep] = useState(0);
  const [forward, setForward] = useState(true);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [interests, setInterests] = useState(profile.interests);
  const [friends, setFriends] = useState(profile.friends_enabled);
  const [dating, setDating] = useState(profile.dating_enabled);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = [
    displayName.trim() !== '',
    interests.length >= MIN_INTERESTS,
    friends || dating,
    true,
  ][step];
  const last = step === STEPS - 1;

  const go = (next: number) => {
    setForward(next > step);
    setStep(next);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      setMe(
        await api.updateMe({
          display_name: displayName,
          bio,
          avatar_url: profile.avatar_url,
          interests,
          friends_enabled: friends,
          dating_enabled: dating,
        })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={Welcome.gradient} style={styles.screen}>
      <StatusBar style="dark" />
      <WelcomeShapes />
      <SafeAreaView style={styles.screen}>
        <View style={styles.top}>
          {step > 0 && (
            <IconButton
              icon="back"
              onPress={() => go(step - 1)}
              accessibilityLabel="Back"
              size={38}
              color={Welcome.fill}
              iconColor={Colors.ink}
            />
          )}
          <View style={styles.logo}>
            <Logo dark size={22} />
          </View>
          <Progress step={step} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.screen}>
          <Animated.View
            key={step}
            entering={(forward ? SlideInRight : SlideInLeft)
              .springify(Springs.slide.duration)
              .dampingRatio(Springs.slide.dampingRatio)}
            exiting={FadeOut.duration(120)}
            style={styles.step}>
            {step === 0 && (
              <NameStep
                value={displayName}
                onChange={setDisplayName}
                onSubmit={() => ready && go(1)}
              />
            )}
            {step === 1 && <InterestsStep interests={interests} onChange={setInterests} />}
            {step === 2 && (
              <PoolsStep
                friends={friends}
                dating={dating}
                onFriends={setFriends}
                onDating={setDating}
              />
            )}
            {step === 3 && <BioStep value={bio} onChange={setBio} />}
          </Animated.View>

          <View style={styles.footer}>
            {error && (
              <AppText tone="danger" style={styles.center}>
                {error}
              </AppText>
            )}
            <Button
              title={last ? "let's go" : 'continue'}
              variant="dark"
              onPress={last ? finish : () => go(step + 1)}
              disabled={!ready}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <View accessibilityLabel={`Step ${step + 1} of ${STEPS}`} style={styles.dots}>
      {Array.from({ length: STEPS }, (_, index) => (
        <ProgressDot key={index} on={index <= step} />
      ))}
    </View>
  );
}

function ProgressDot({ on }: { on: boolean }) {
  const width = useSharedValue(on ? 30 : 18);
  useEffect(() => {
    width.set(withSpring(on ? 30 : 18, Springs.slide));
  }, [on, width]);
  const style = useAnimatedStyle(() => ({ width: width.get() }));
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: on ? Colors.ink : Welcome.border }, style]}
    />
  );
}

function NameStep({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.bottomStep}>
      <AppText variant="hero" tone="ink">
        what should we call you?
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="your first name"
        placeholderTextColor={PLACEHOLDER}
        maxLength={40}
        autoFocus
        autoComplete="given-name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={onSubmit}
        style={[styles.input, styles.bigInput]}
      />
    </View>
  );
}

function InterestsStep({
  interests,
  onChange,
}: {
  interests: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
}) {
  const [custom, setCustom] = useState('');
  const has = (interest: string) => interests.some((existing) => sameInterest(existing, interest));
  const options = [
    ...SUGGESTED_INTERESTS.map(({ name, emoji }) => ({ name, label: `${emoji} ${name}` })),
    ...interests
      .filter((interest) => !isSuggested(interest))
      .map((name) => ({ name, label: `✨ ${name}` })),
  ];

  const add = () => {
    const interest = cleanInterest(custom);
    if (interest && !has(interest)) {
      onChange((current) => toggleInterest(current, interest));
    }
    setCustom('');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollStep}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <AppText variant="title" tone="ink">
        what are you into?
      </AppText>
      <AppText tone="ink" style={styles.lead}>
        pick {MIN_INTERESTS} or more
      </AppText>
      <View style={styles.chips}>
        {options.map(({ name, label }) => (
          <Chip
            key={name}
            label={label}
            light
            selected={has(name)}
            onPress={() => onChange((current) => toggleInterest(current, name))}
          />
        ))}
      </View>
      <TextInput
        value={custom}
        onChangeText={setCustom}
        onSubmitEditing={add}
        placeholder="add your own"
        placeholderTextColor={PLACEHOLDER}
        maxLength={40}
        returnKeyType="done"
        submitBehavior="submit"
        style={styles.input}
      />
    </ScrollView>
  );
}

type PoolsStepProps = {
  friends: boolean;
  dating: boolean;
  onFriends: (value: boolean) => void;
  onDating: (value: boolean) => void;
};

function PoolsStep({ friends, dating, onFriends, onDating }: PoolsStepProps) {
  return (
    <View style={styles.bottomStep}>
      <AppText variant="hero" tone="ink">
        who are you looking for?
      </AppText>
      <View style={styles.options}>
        <Option emoji="🤝" label="friends" selected={friends} onPress={() => onFriends(!friends)} />
        <Option emoji="💗" label="dating" selected={dating} onPress={() => onDating(!dating)} />
      </View>
    </View>
  );
}

function Option({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      pressedScale={0.98}
      style={[styles.option, selected ? styles.optionOn : styles.optionOff]}>
      <View
        style={[
          styles.optionEmoji,
          { backgroundColor: selected ? Colors.surfaceRaised : Welcome.fill },
        ]}>
        <AppText style={styles.emoji}>{emoji}</AppText>
      </View>
      <AppText style={[styles.optionLabel, { color: selected ? Colors.text : Colors.ink }]}>
        {label}
      </AppText>
      <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
        {selected && <Icon name="check" size={16} color={Colors.ink} />}
      </View>
    </PressableScale>
  );
}

function BioStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.bottomStep}>
      <AppText variant="hero" tone="ink">
        anything else?
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="learning to climb, obsessed with film photography, always down for ramen"
        placeholderTextColor={PLACEHOLDER}
        maxLength={300}
        multiline
        style={[styles.input, styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four - 2,
    paddingTop: Spacing.three,
    minHeight: 54,
  },
  logo: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one + 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  step: {
    flex: 1,
    paddingHorizontal: Spacing.four - 2,
  },
  bottomStep: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.four,
    paddingBottom: Spacing.three,
  },
  scrollStep: {
    gap: Spacing.three - 4,
    paddingTop: 150,
    paddingBottom: Spacing.three,
  },
  lead: {
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  input: {
    height: 52,
    backgroundColor: Welcome.fill,
    borderRadius: Radius.medium - 2,
    borderWidth: 1,
    borderColor: Welcome.border,
    color: Colors.ink,
    fontFamily: Fonts.medium,
    fontSize: 18,
    paddingHorizontal: Spacing.three + 2,
  },
  bigInput: {
    height: 58,
    fontFamily: Fonts.semiBold,
    fontSize: 22,
  },
  multiline: {
    height: 128,
    paddingTop: Spacing.three - 2,
    textAlignVertical: 'top',
  },
  options: {
    gap: Spacing.three - 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  optionOn: {
    backgroundColor: Colors.ink,
  },
  optionOff: {
    backgroundColor: Welcome.fill,
  },
  optionEmoji: {
    width: 44,
    height: 44,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  optionLabel: {
    flex: 1,
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 22,
    lineHeight: 26,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: Colors.lime,
  },
  checkOff: {
    borderWidth: 2,
    borderColor: Welcome.border,
  },
  footer: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four - 2,
    paddingBottom: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
});
