import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Check from 'lucide-react-native/icons/check';
import {AppButton} from '../../../components';
import {colors, radii, spacing, typography} from '../../../theme/tokens';

export type LegalDocument = 'terms' | 'privacy';

type Props = {
  document: LegalDocument;
  accepted: boolean;
  onChange: (accepted: boolean) => void;
  onBlur?: () => void;
  errorText?: string;
};

const copy = {
  terms: {
    title: 'Terms of Service',
    intro: 'By using PlayLobby, you agree to provide accurate account and business information and to follow marketplace, booking, safety, cancellation, and community rules.',
    sections: [
      'Vendors are responsible for keeping facility, schedule, price, and availability information accurate.',
      'Identity and business documents must be genuine. Fraud, unsafe conduct, repeated harmful cancellations, or policy abuse can restrict or suspend access.',
      'Publishing is available only after vendor approval. Booking, cancellation, refund, and attendance rules shown in the app apply to each transaction.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'PlayLobby collects the information needed to create accounts, verify vendors, operate bookings, prevent abuse, and provide support.',
    sections: [
      'Owner login details and customer-facing business contacts are stored separately. Private verification documents are access-controlled and are not public facility media.',
      'Facility coordinates, opening hours, logo, and images may be used to present the facility and support nearby discovery.',
      'Security, legal, moderation, and transaction records may be retained as required to operate the service and resolve disputes.',
    ],
  },
} as const;

export function LegalConsentField({document, accepted, onChange, onBlur, errorText}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const content = copy[document];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{checked: accepted}}
          accessibilityLabel={`Accept ${content.title}`}
          onPress={() => {
            onChange(!accepted);
            onBlur?.();
          }}
          style={[styles.checkbox, accepted && styles.checked]}
        >
          {accepted ? <Check color={colors.surface} size={17} strokeWidth={3} /> : null}
        </Pressable>
        <Text style={styles.lead}>I have read and accept the </Text>
        <Pressable accessibilityRole="link" onPress={() => setOpen(true)}>
          <Text style={styles.link}>{content.title}</Text>
        </Pressable>
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.version}>Effective August 14, 2026 · version 2026-08-14</Text>
          <ScrollView contentContainerStyle={styles.document}>
            <Text style={styles.body}>{content.intro}</Text>
            {content.sections.map(section => <Text key={section} style={styles.body}>• {section}</Text>)}
            <Text style={styles.body}>Questions or policy requests can be raised through PlayLobby support before continuing registration.</Text>
          </ScrollView>
          <AppButton
            label={accepted ? 'Accepted' : `Accept ${content.title}`}
            onPress={() => {
              onChange(true);
              onBlur?.();
              setOpen(false);
            }}
            variant="brand"
            size="large"
          />
          <AppButton label="Close" onPress={() => setOpen(false)} variant="ghost" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: spacing.xs},
  row: {alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap'},
  checkbox: {alignItems: 'center', borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, height: 24, justifyContent: 'center', marginRight: spacing.sm, width: 24},
  checked: {backgroundColor: colors.brand, borderColor: colors.brand},
  lead: {...typography.caption, color: colors.text},
  link: {...typography.button, color: colors.brand},
  error: {...typography.caption, color: colors.danger},
  modal: {backgroundColor: colors.surface, flex: 1, gap: spacing.md, padding: spacing.xl, paddingTop: spacing.xxl},
  title: {...typography.title, color: colors.ink},
  version: {...typography.caption, color: colors.muted},
  document: {gap: spacing.lg, paddingVertical: spacing.md},
  body: {...typography.body, color: colors.text},
});
