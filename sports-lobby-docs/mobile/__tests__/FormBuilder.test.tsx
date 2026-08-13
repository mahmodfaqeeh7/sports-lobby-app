import React from 'react';
import { Text, TextInput } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppButton, FormBuilder, FormBuilderField } from '../src/components';

type TestFormValues = {
  displayName: string;
};

const fields: FormBuilderField<TestFormValues>[] = [
  {
    type: 'text',
    name: 'displayName',
    label: 'Display name',
    rules: { required: 'Display name is required.' },
  },
];

it('validates configured fields and submits their values', async () => {
  const onSubmit = jest.fn();
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <FormBuilder
        fields={fields}
        defaultValues={{ displayName: '' }}
        onSubmit={onSubmit}
        submitLabel="Continue"
      />,
    );
  });

  await act(async () => {
    renderer!.root.findByType(AppButton).props.onPress();
  });

  expect(onSubmit).not.toHaveBeenCalled();
  expect(
    renderer!.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Display name is required.'),
  ).toBe(true);

  await act(async () => {
    renderer!.root.findByType(TextInput).props.onChangeText('Maya');
    renderer!.root.findByType(AppButton).props.onPress();
  });

  expect(onSubmit).toHaveBeenCalledWith({ displayName: 'Maya' }, undefined);

  await act(async () => {
    renderer?.unmount();
  });
});
