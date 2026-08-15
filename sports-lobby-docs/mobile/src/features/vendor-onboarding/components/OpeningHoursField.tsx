import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import Clock3 from 'lucide-react-native/icons/clock-3';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components';
import { colors, radii, spacing, typography } from '../../../theme/tokens';

export type OpeningHoursValue = {
  opensAt: string;
  closesAt: string;
};

type PickerTarget = keyof OpeningHoursValue;

type Props = {
  value: OpeningHoursValue;
  onChange: (value: OpeningHoursValue) => void;
  onBlur?: () => void;
  errorText?: string;
};

const DEFAULT_TIMES: Record<PickerTarget, string> = {
  opensAt: '08:00',
  closesAt: '23:00',
};

export function OpeningHoursField({
  value,
  onChange,
  onBlur,
  errorText,
}: Props): React.JSX.Element {
  const [iosTarget, setIosTarget] = useState<PickerTarget>();
  const [draftTime, setDraftTime] = useState(() => timeToDate(DEFAULT_TIMES.opensAt));

  const commitTime = (target: PickerTarget, date: Date) => {
    onChange({ ...value, [target]: dateToTime(date) });
    onBlur?.();
  };

  const openPicker = (target: PickerTarget) => {
    const current = timeToDate(value[target] || DEFAULT_TIMES[target]);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'time',
        display: 'default',
        is24Hour: false,
        onValueChange: (_event, selectedTime) =>
          commitTime(target, selectedTime),
      });
      return;
    }

    setDraftTime(current);
    setIosTarget(target);
  };

  const closeIosPicker = () => setIosTarget(undefined);

  const confirmIosTime = () => {
    if (iosTarget) {
      commitTime(iosTarget, draftTime);
    }
    closeIosPicker();
  };

  const overnight = isOvernight(value);

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={styles.label}>Opening hours</Text>
        <Text style={styles.help}>
          Choose the usual daily opening and closing times.
        </Text>
      </View>

      <View style={styles.range}>
        <TimeButton
          label="Opens at"
          value={value.opensAt}
          onPress={() => openPicker('opensAt')}
        />
        <Text accessibilityElementsHidden style={styles.separator}>
          to
        </Text>
        <TimeButton
          label="Closes at"
          value={value.closesAt}
          onPress={() => openPicker('closesAt')}
        />
      </View>

      {overnight ? (
        <Text style={styles.overnight}>Closing time is on the next day.</Text>
      ) : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal
        animationType="fade"
        onRequestClose={closeIosPicker}
        transparent
        visible={Platform.OS === 'ios' && Boolean(iosTarget)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {iosTarget === 'opensAt' ? 'Opening time' : 'Closing time'}
              </Text>
              <Text style={styles.pickerHelp}>Select a time only—no date.</Text>
            </View>
            <DateTimePicker
              display="spinner"
              mode="time"
              minuteInterval={5}
              onValueChange={(_event, selectedTime) =>
                setDraftTime(selectedTime)
              }
              themeVariant="light"
              value={draftTime}
            />
            <View style={styles.pickerActions}>
              <AppButton
                label="Cancel"
                onPress={closeIosPicker}
                variant="ghost"
                style={styles.action}
              />
              <AppButton
                label="Set time"
                onPress={confirmIosTime}
                variant="brand"
                style={styles.action}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

type TimeButtonProps = {
  label: string;
  value: string;
  onPress: () => void;
};

function TimeButton({ label, value, onPress }: TimeButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}. ${value ? formatTime(value) : 'Not selected'}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
    >
      <Clock3 color={colors.brand} size={21} strokeWidth={1.8} />
      <View style={styles.timeCopy}>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={[styles.timeValue, !value && styles.placeholder]}>
          {value ? formatTime(value) : 'Choose time'}
        </Text>
      </View>
    </Pressable>
  );
}

export function validateOpeningHours(value: unknown): true | string {
  if (!isOpeningHoursValue(value) || !value.opensAt || !value.closesAt) {
    return 'Choose both the opening and closing times.';
  }
  if (value.opensAt === value.closesAt) {
    return 'Opening and closing times must be different.';
  }
  return true;
}

export function serializeOpeningHours(value: OpeningHoursValue): string {
  const suffix = isOvernight(value) ? ' (next day)' : '';
  return `Daily ${value.opensAt}–${value.closesAt}${suffix}`;
}

function isOpeningHoursValue(value: unknown): value is OpeningHoursValue {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'opensAt' in value &&
    'closesAt' in value &&
    typeof value.opensAt === 'string' &&
    typeof value.closesAt === 'string'
  );
}

function isOvernight(value: OpeningHoursValue): boolean {
  return Boolean(
    value.opensAt && value.closesAt && value.closesAt < value.opensAt,
  );
}

function timeToDate(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
  return date;
}

function dateToTime(value: Date): string {
  return `${value.getHours().toString().padStart(2, '0')}:${value
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  heading: { gap: spacing.xs },
  label: { ...typography.button, color: colors.text },
  help: { ...typography.caption, color: colors.muted },
  range: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  timeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  timeCopy: { flex: 1, gap: 2 },
  timeLabel: { ...typography.caption, color: colors.muted },
  timeValue: { ...typography.body, color: colors.text, fontWeight: '700' },
  placeholder: { color: colors.subtle, fontWeight: '400' },
  separator: { ...typography.caption, color: colors.muted },
  pressed: { opacity: 0.72 },
  overnight: { ...typography.caption, color: colors.brand },
  error: { ...typography.caption, color: colors.danger },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 20, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.md,
    maxWidth: 440,
    padding: spacing.lg,
    width: '100%',
  },
  pickerHeader: { gap: spacing.xs },
  pickerTitle: { ...typography.sectionTitle, color: colors.ink },
  pickerHelp: { ...typography.caption, color: colors.muted },
  pickerActions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
