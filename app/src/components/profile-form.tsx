import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Pastels, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { Me, ProfileInput } from '@/lib/types';

const SUGGESTED_INTERESTS = [
  'Bouldering',
  'Running',
  'Cycling',
  'Hiking',
  'Yoga',
  'Tennis',
  'Board games',
  'Chess',
  'Gaming',
  'Anime',
  'Indie music',
  'Jazz',
  'Hip-hop',
  'Photography',
  'Film',
  'Reading',
  'Cooking',
  'Coffee',
  'Startups',
  'AI',
  'Open source',
  'Design',
  'Thrifting',
  'Travel',
];
const MAX_INTERESTS = 20;

export type ProfileFormProps = {
  initial: ProfileInput;
  submitLabel: string;
  onSaved: (me: Me) => void;
};

export function ProfileForm({ initial, submitLabel, onSaved }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio);
  const [interests, setInterests] = useState(initial.interests);
  const [custom, setCustom] = useState('');
  const [friends, setFriends] = useState(initial.friends_enabled);
  const [dating, setDating] = useState(initial.dating_enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const has = (interest: string) =>
    interests.some((existing) => existing.toLowerCase() === interest.toLowerCase());

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      has(interest)
        ? current.filter((existing) => existing.toLowerCase() !== interest.toLowerCase())
        : current.length < MAX_INTERESTS
          ? [...current, interest]
          : current
    );
  };

  const addCustom = () => {
    const interest = custom.trim().replace(/\s+/g, ' ');
    if (interest && !has(interest)) {
      toggleInterest(interest);
    }
    setCustom('');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await api.updateMe({
          display_name: displayName,
          bio,
          avatar_url: initial.avatar_url,
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

  const customInterests = interests.filter(
    (interest) => !SUGGESTED_INTERESTS.some((s) => s.toLowerCase() === interest.toLowerCase())
  );

  return (
    <View style={styles.form}>
      <Field label="First name" hint="Only shown after you both wave.">
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Alex"
          placeholderTextColor={Colors.textMuted}
          maxLength={40}
          autoComplete="given-name"
          style={styles.input}
        />
      </Field>

      <Field label="About you" hint="What would you talk about for hours?">
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Learning to climb, obsessed with film photography, always down for ramen."
          placeholderTextColor={Colors.textMuted}
          maxLength={300}
          multiline
          style={[styles.input, styles.multiline]}
        />
      </Field>

      <Field
        label="Interests"
        aside={`${interests.length}/${MAX_INTERESTS}`}
        hint="The more specific, the better the sparks.">
        <View style={styles.chips}>
          {[...SUGGESTED_INTERESTS, ...customInterests].map((interest) => (
            <Chip
              key={interest}
              label={interest}
              selected={has(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          placeholder="Add your own, e.g. Radiohead, sourdough, F1"
          placeholderTextColor={Colors.textMuted}
          maxLength={40}
          returnKeyType="done"
          submitBehavior="submit"
          style={styles.input}
        />
      </Field>

      <Field label="Looking for" hint="Separate pools. Dating sparks only happen between two people who both opted in.">
        <View style={styles.chips}>
          <Chip
            label="Friends"
            color={Pastels.friends[0]}
            selected={friends}
            onPress={() => setFriends(!friends)}
          />
          <Chip
            label="Dating"
            color={Pastels.dating[0]}
            selected={dating}
            onPress={() => setDating(!dating)}
          />
        </View>
      </Field>

      {error && <AppText tone="danger">{error}</AppText>}

      <Button
        title={submitLabel}
        onPress={save}
        loading={saving}
        disabled={!displayName.trim() || (!friends && !dating)}
      />
    </View>
  );
}

type FieldProps = { label: string; aside?: string; hint?: string; children: React.ReactNode };

function Field({ label, aside, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <AppText variant="heading">{label}</AppText>
        {aside && (
          <AppText variant="caption" tone="muted">
            {aside}
          </AppText>
        )}
      </View>
      {hint && (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.medium,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
