import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
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
import { Sparkler } from '@/components/sparkler';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing, Springs } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { themedStyles, useColors } from '@/lib/appearance';
import {
  SUGGESTED_INTERESTS,
  cleanInterest,
  isSuggested,
  sameInterest,
  toggleInterest,
} from '@/lib/interests';
import { useMe, useSession } from '@/lib/session';

const STEPS = 3;
const MIN_INTERESTS = 3;

export default function Onboarding() {
  const styles = useStyles();
  const { setMe } = useSession();
  const { profile } = useMe();
  const [step, setStep] = useState(0);
  const [forward, setForward] = useState(true);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [interests, setInterests] = useState(profile.interests);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = [displayName.trim() !== '', interests.length >= MIN_INTERESTS, true][step];
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
          // One pool: everyone is matched as friends.
          friends_enabled: true,
          dating_enabled: false,
        })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* The sparkler lights a little more with every step. */}
      <Sparkler size={200} lit={(step + 1) / STEPS} style={styles.sparkler} />
      <View style={styles.top}>
        {step > 0 && (
          <IconButton
            icon="back"
            onPress={() => go(step - 1)}
            accessibilityLabel="Back"
            size={38}
          />
        )}
        <View style={styles.logo}>
          <Logo size={22} />
        </View>
        <Progress step={step} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
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
          {step === 2 && <BioStep value={bio} onChange={setBio} />}
        </Animated.View>

        <View style={styles.footer}>
          {error && (
            <AppText tone="danger" style={styles.center}>
              {error}
            </AppText>
          )}
          <Button
            title={last ? "let's go" : 'continue'}
            onPress={last ? finish : () => go(step + 1)}
            disabled={!ready}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Progress({ step }: { step: number }) {
  const styles = useStyles();
  return (
    <View accessibilityLabel={`Step ${step + 1} of ${STEPS}`} style={styles.dots}>
      {Array.from({ length: STEPS }, (_, index) => (
        <ProgressDot key={index} on={index <= step} />
      ))}
    </View>
  );
}

function ProgressDot({ on }: { on: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  const width = useSharedValue(on ? 30 : 18);
  useEffect(() => {
    width.set(withSpring(on ? 30 : 18, Springs.slide));
  }, [on, width]);
  const style = useAnimatedStyle(() => ({ width: width.get() }));
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: on ? colors.gold : colors.lineStrong }, style]}
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
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.bottomStep}>
      <AppText variant="hero">what should we call you?</AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="your first name"
        placeholderTextColor={colors.textMuted}
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
  const colors = useColors();
  const styles = useStyles();
  const [custom, setCustom] = useState('');
  const has = (interest: string) => interests.some((existing) => sameInterest(existing, interest));
  const options = [
    ...SUGGESTED_INTERESTS.map(({ name }) => name),
    ...interests.filter((interest) => !isSuggested(interest)),
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
      <AppText variant="hero">what are you into?</AppText>
      <AppText variant="label" tone="secondary" style={styles.lead}>
        pick {MIN_INTERESTS} or more
      </AppText>
      <View style={styles.chips}>
        {options.map((name) => (
          <Chip
            key={name}
            label={name}
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
        placeholderTextColor={colors.textMuted}
        maxLength={40}
        returnKeyType="done"
        submitBehavior="submit"
        style={styles.input}
      />
    </ScrollView>
  );
}

function BioStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.bottomStep}>
      <AppText variant="hero">anything else?</AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="learning to climb, obsessed with film photography, always down for ramen"
        placeholderTextColor={colors.textMuted}
        maxLength={300}
        multiline
        style={[styles.input, styles.multiline]}
      />
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  sparkler: {
    position: 'absolute',
    top: 64,
    right: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four - 4,
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
    height: 3,
    borderRadius: 2,
  },
  step: {
    flex: 1,
    paddingHorizontal: Spacing.four - 4,
  },
  bottomStep: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.four,
    paddingBottom: Spacing.three,
  },
  scrollStep: {
    gap: Spacing.three - 4,
    paddingTop: 208,
    paddingBottom: Spacing.three,
  },
  lead: {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    color: colors.text,
    fontFamily: Fonts.regular,
    fontSize: 19,
  },
  bigInput: {
    height: 62,
    fontFamily: Fonts.regularItalic,
    fontSize: 28,
  },
  multiline: {
    height: 132,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three - 2,
    paddingTop: Spacing.three - 4,
    textAlignVertical: 'top',
  },
  footer: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four - 4,
    paddingBottom: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
}));
