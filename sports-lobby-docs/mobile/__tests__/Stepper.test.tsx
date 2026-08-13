import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Stepper, StepperStep } from '../src/components';

const steps: StepperStep[] = [
  { key: 'account', label: 'Account', content: <Text>Account screen</Text> },
  { key: 'verify', label: 'Verify', content: <Text>Verify screen</Text> },
];

it('renders only the active step screen', async () => {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(<Stepper steps={steps} activeStep={1} />);
  });

  const text = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children);
  expect(text).toContain('Verify screen');
  expect(text).not.toContain('Account screen');

  await act(async () => renderer?.unmount());
});

it('allows controlled navigation to completed steps when enabled', async () => {
  const onStepPress = jest.fn();
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <Stepper
        steps={steps}
        activeStep={1}
        allowCompletedStepNavigation
        onStepPress={onStepPress}
      />,
    );
  });

  await act(async () => {
    renderer!.root
      .findAll(node => node.props.accessibilityRole === 'tab')[0]
      .props.onPress();
  });

  expect(onStepPress).toHaveBeenCalledWith(0);

  await act(async () => renderer?.unmount());
});
