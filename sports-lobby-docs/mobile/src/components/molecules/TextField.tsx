import React from 'react';
import { AppTextField, AppTextFieldProps } from '../atoms/AppTextField';

export type TextFieldProps = Omit<AppTextFieldProps, 'secureTextEntry'>;

export function TextField(props: TextFieldProps): React.JSX.Element {
  return <AppTextField {...props} />;
}
