import React from 'react';
import { Text, TextInput } from 'react-native';
import {
  act,
  create,
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';
import { authApi } from '../src/features/auth/api';
import { ForgotPasswordScreen } from '../src/features/auth/screens/ForgotPasswordScreen';

jest.mock('../src/features/auth/api', () => ({
  authApi: {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
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

it('requests a reset code before enabling password update', async () => {
  const forgotPassword = jest.mocked(authApi.forgotPassword);
  forgotPassword.mockResolvedValue({ status: 'accepted' });
  const setNotice = jest.fn();
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <ForgotPasswordScreen onNavigate={jest.fn()} setNotice={setNotice} />,
    );
  });

  expect(
    buttonWithLabel(renderer!, 'Update password').props.accessibilityState
      .disabled,
  ).toBe(true);

  await act(async () => {
    renderer!.root
      .findAllByType(TextInput)
      .find(input => input.props.keyboardType === 'phone-pad')
      ?.props.onChangeText('0790000000');
  });

  await act(async () => {
    await buttonWithLabel(renderer!, 'Send reset code').props.onPress();
  });

  expect(forgotPassword).toHaveBeenCalledWith(
    expect.anything(),
    '+962790000000',
  );
  expect(
    renderer!.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Code sent successfully'),
  ).toBe(true);
  expect(
    buttonWithLabel(renderer!, 'Update password').props.accessibilityState
      .disabled,
  ).toBe(false);

  await act(async () => renderer?.unmount());
});
