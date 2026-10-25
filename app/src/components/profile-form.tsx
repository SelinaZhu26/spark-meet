import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import {
  MAX_INTERESTS,
  SUGGESTED_INTERESTS,
  cleanInterest,
  isSuggested,
  sameInterest,
  toggleInterest,
} from '@/lib/interests';
import type { Me, ProfileInput } from '@/lib/types';

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

  const has = (interest: string) => interests.some((existing) => sameInterest(existing, interest));

  const addCustom = () => {
    const interest = cleanInterest(custom);
    if (interest && !has(interest)) {
      setInterests((current) => toggleInterest(current, interest));
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

  const options = [
    ...SUGGESTED_INTERESTS.map(({ name }) => name),
    ...interests.filter((interest) => !isSuggested(interest)),
  ];

  return (
    <View style={styles.form}>
      <Card>
        <Field label="first name">
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="your name"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
            autoComplete="given-name"
            style={styles.input}
          />
        </Field>
        <Field label="about you">
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="learning to climb, obsessed with film photography, always down for ramen"
            placeholderTextColor={Colors.textMuted}
            maxLength={300}
            multiline
            style={[styles.input, styles.multiline]}
          />
        </Field>
      </Card>

      <Card>
        <Field label="interests" aside={`${interests.length}/${MAX_INTERESTS}`}>
          <View style={styles.chips}>
            {options.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                selected={has(interest)}
                onPress={() => setInterests((current) => toggleInterest(current, interest))}
              />
            ))}
          </View>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            placeholder="add your own"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
            returnKeyType="done"
            submitBehavior="submit"
            style={styles.input}
          />
        </Field>
      </Card>

      <Card>
        <Field label="looking for">
          <View style={styles.chips}>
            <Chip label="🤝 friends" selected={friends} onPress={() => setFriends(!friends)} />
            <Chip
              label="💗 dating"
              tone="dating"
              selected={dating}
              onPress={() => setDating(!dating)}
            />
          </View>
        </Field>
      </Card>

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

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
        {aside && (
          <AppText variant="caption" tone="muted">
            {aside}
          </AppText>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three - 4,
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
    minHeight: 50,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    color: Colors.text,
    fontFamily: Fonts.medium,
    fontSize: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 3,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
