import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

export type StepperStep = {
  key: string;
  label: string;
  content: ReactNode;
};

type StepperProps = {
  steps: StepperStep[];
  activeStep: number;
  onStepPress?: (stepIndex: number) => void;
  allowCompletedStepNavigation?: boolean;
};

export function Stepper({
  steps,
  activeStep,
  onStepPress,
  allowCompletedStepNavigation = false,
}: StepperProps): React.JSX.Element | null {
  if (steps.length === 0) {
    return null;
  }

  const safeActiveStep = Math.min(Math.max(activeStep, 0), steps.length - 1);

  return (
    <View style={styles.wrap}>
      <View accessibilityRole="tablist" style={styles.progress}>
        {steps.map((step, index) => {
          const active = index === safeActiveStep;
          const completed = index < safeActiveStep;
          const pressable =
            allowCompletedStepNavigation && completed && Boolean(onStepPress);

          return (
            <React.Fragment key={step.key}>
              {index > 0 ? (
                <View
                  style={[
                    styles.connector,
                    completed || active ? styles.connectorComplete : undefined,
                  ]}
                />
              ) : null}
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active, disabled: !pressable }}
                disabled={!pressable}
                onPress={() => onStepPress?.(index)}
                style={styles.step}
              >
                <View
                  style={[
                    styles.circle,
                    active || completed ? styles.circleActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.number,
                      active || completed ? styles.numberActive : undefined,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.stepCopy}>
                  <Text
                    style={[
                      styles.label,
                      active || completed ? styles.labelActive : undefined,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {active ? (
                    <Text style={styles.activeText}>active</Text>
                  ) : null}
                </View>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      <View key={steps[safeActiveStep].key} style={styles.content}>
        {steps[safeActiveStep].content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxl,
  },
  progress: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 360,
    width: '100%',
  },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
  },
  circle: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  circleActive: {
    borderColor: colors.brand,
  },
  number: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  },
  numberActive: {
    color: colors.brand,
  },
  stepCopy: {
    minWidth: 52,
  },
  label: {
    ...typography.body,
    color: colors.muted,
  },
  labelActive: {
    color: colors.brand,
    fontWeight: '500',
  },
  activeText: {
    ...typography.caption,
    color: colors.brand,
  },
  connector: {
    backgroundColor: colors.divider,
    height: 1,
    marginHorizontal: spacing.lg,
    maxWidth: 72,
    minWidth: 28,
  },
  connectorComplete: {
    backgroundColor: colors.brand,
  },
  content: {
    width: '100%',
  },
});
