import React from 'react';
import { TextInput } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { OtpCodeInput } from '../src/components';

it('renders six OTP slots and keeps only six numeric characters', async () => {
  const onChangeText = jest.fn();
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <OtpCodeInput
        value="12"
        onChangeText={onChangeText}
        autoFocus={false}
      />,
    );
  });

  const digitSlotIds = new Set(
    renderer!.root
      .findAll(
        node =>
          typeof node.props.testID === 'string' &&
          node.props.testID.startsWith('otp-digit-'),
      )
      .map(node => node.props.testID),
  );

  expect([...digitSlotIds]).toEqual([
    'otp-digit-0',
    'otp-digit-1',
    'otp-digit-2',
    'otp-digit-3',
    'otp-digit-4',
    'otp-digit-5',
  ]);

  await act(async () => {
    renderer!.root.findByType(TextInput).props.onChangeText('12a34 5678');
  });

  expect(onChangeText).toHaveBeenCalledWith('123456');

  await act(async () => renderer?.unmount());
});
