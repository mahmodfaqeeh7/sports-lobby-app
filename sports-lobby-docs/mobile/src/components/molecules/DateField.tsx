import React from 'react';
import { AppTextField } from '../atoms/AppTextField';

type DateFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  errorText?: string;
  onBlur?: () => void;
};

export function DateField({
  label,
  value,
  onChangeText,
  placeholder = 'YYYY-MM-DD',
  errorText,
  onBlur,
}: DateFieldProps): React.JSX.Element {
  return (
    <AppTextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      errorText={errorText}
      maxLength={10}
      onBlur={onBlur}
    />
  );
}
