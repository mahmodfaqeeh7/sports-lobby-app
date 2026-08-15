import React from 'react';
import { Text, TextInput } from 'react-native';
import {
  act,
  create,
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';
import { VendorSignupScreen } from '../src/features/vendor-onboarding/screens/VendorSignupScreen';

jest.mock('../src/features/sports/api', () => ({
  sportsApi: {
    list: jest.fn().mockResolvedValue([]),
  },
}));

function buttonWithLabel(
  renderer: ReactTestRenderer,
  label: string,
): ReactTestInstance {
  return renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.findAllByType(Text).some(text => text.props.children === label),
  )[0];
}

function inputWithLabel(
  renderer: ReactTestRenderer,
  label: string,
): ReactTestInstance {
  return renderer.root
    .findAllByType(TextInput)
    .find(input => input.props.accessibilityLabel === label)!;
}

it('moves between account and business steps while preserving business values', async () => {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <VendorSignupScreen
        onAuthenticated={jest.fn()}
        onNavigate={jest.fn()}
        setNotice={jest.fn()}
      />,
    );
  });

  await act(async () => {
    inputWithLabel(renderer!, 'First name').props.onChangeText('Maya');
    inputWithLabel(renderer!, 'Last name').props.onChangeText('Saleh');
    inputWithLabel(renderer!, 'Owner email').props.onChangeText(
      'maya@example.com',
    );
    inputWithLabel(renderer!, 'Owner mobile number').props.onChangeText(
      '790000000',
    );
    inputWithLabel(renderer!, 'Password').props.onChangeText('Password123');
    inputWithLabel(renderer!, 'Confirm password').props.onChangeText(
      'Password123',
    );
    renderer!.root.findByProps({
      accessibilityLabel: 'Accept Terms of Service',
    }).props.onPress();
    renderer!.root.findByProps({
      accessibilityLabel: 'Accept Privacy Policy',
    }).props.onPress();
    await buttonWithLabel(renderer!, 'Continue').props.onPress();
  });

  expect(
    renderer!.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Business Information'),
  ).toBe(true);

  await act(async () => {
    inputWithLabel(renderer!, 'Business name').props.onChangeText(
      'Amman Courts',
    );
    buttonWithLabel(renderer!, 'Back').props.onPress();
  });

  await act(async () => {
    await buttonWithLabel(renderer!, 'Continue').props.onPress();
  });

  expect(inputWithLabel(renderer!, 'Business name').props.value).toBe(
    'Amman Courts',
  );

  await act(async () => renderer?.unmount());
});
