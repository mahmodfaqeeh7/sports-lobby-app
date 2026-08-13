import React, { MutableRefObject, ReactNode, useEffect } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  TextInputProps,
  View,
} from 'react-native';
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  DefaultValues,
  FieldValues,
  Path,
  RegisterOptions,
  SubmitHandler,
  UseFormReturn,
  useForm,
} from 'react-hook-form';
import { spacing } from '../../theme/tokens';
import { AppButton, AppButtonSize, AppButtonVariant } from '../atoms/AppButton';
import { FieldAppearance } from '../atoms/AppTextField';
import { DateField } from '../molecules/DateField';
import {
  MultiSelectChips,
  MultiSelectOption,
} from '../molecules/MultiSelectChips';
import { PasswordField } from '../molecules/PasswordField';
import { PhoneNumberField } from '../molecules/PhoneNumberField';
import { TextField } from '../molecules/TextField';

export type PhoneFieldValue = {
  countryCode: string;
  nationalNumber: string;
};

type FormFieldRules<TValues extends FieldValues> = Omit<
  RegisterOptions<TValues, Path<TValues>>,
  'disabled' | 'setValueAs' | 'valueAsDate' | 'valueAsNumber'
>;

type BaseField<TValues extends FieldValues> = {
  name: Path<TValues>;
  rules?: FormFieldRules<TValues>;
  row?: string;
};

type TextFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'text';
  label: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  trailingAccessory?: ReactNode;
};

type PasswordFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'password';
  label: string;
  placeholder?: string;
  hideLabel?: boolean;
};

type PhoneFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'phone';
  label: string;
  placeholder?: string;
  hideLabel?: boolean;
};

type DateFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'date';
  label: string;
  placeholder?: string;
};

type ChipsFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'chips';
  label: string;
  options: MultiSelectOption[];
  emptyText?: string;
};

export type CustomFieldRenderProps<TValues extends FieldValues> = {
  field: ControllerRenderProps<TValues, Path<TValues>>;
  fieldState: ControllerFieldState;
  form: UseFormReturn<TValues>;
};

type CustomFieldConfig<TValues extends FieldValues> = BaseField<TValues> & {
  type: 'custom';
  render: (props: CustomFieldRenderProps<TValues>) => ReactNode;
};

export type FormBuilderField<TValues extends FieldValues> =
  | TextFieldConfig<TValues>
  | PasswordFieldConfig<TValues>
  | PhoneFieldConfig<TValues>
  | DateFieldConfig<TValues>
  | ChipsFieldConfig<TValues>
  | CustomFieldConfig<TValues>;

type FormBuilderProps<TValues extends FieldValues> = {
  fields: FormBuilderField<TValues>[];
  defaultValues: DefaultValues<TValues>;
  onSubmit: SubmitHandler<TValues>;
  submitLabel: string;
  busy?: boolean;
  secondaryAction?: ReactNode;
  beforeSubmit?: ReactNode;
  footer?: ReactNode;
  appearance?: FieldAppearance;
  submitVariant?: AppButtonVariant;
  submitSize?: AppButtonSize;
  submitDisabled?: boolean;
  formRef?: MutableRefObject<UseFormReturn<TValues> | null>;
};

export function FormBuilder<TValues extends FieldValues>({
  fields,
  defaultValues,
  onSubmit,
  submitLabel,
  busy = false,
  secondaryAction,
  beforeSubmit,
  footer,
  appearance = 'default',
  submitVariant = 'primary',
  submitSize = 'default',
  submitDisabled = false,
  formRef,
}: FormBuilderProps<TValues>): React.JSX.Element {
  const form = useForm<TValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!formRef) {
      return;
    }

    formRef.current = form;
    return () => {
      formRef.current = null;
    };
  }, [form, formRef]);

  return (
    <View style={styles.form}>
      {groupFields(fields).map(group => (
        <View
          key={group.map(config => config.name).join('-')}
          style={group.length > 1 ? styles.fieldRow : undefined}
        >
          {group.map(config => (
            <View
              key={config.name}
              style={group.length > 1 ? styles.rowField : undefined}
            >
              <Controller
                control={form.control}
                name={config.name}
                rules={config.rules}
                render={({ field, fieldState }) =>
                  renderField(config, field, fieldState, form, appearance)
                }
              />
            </View>
          ))}
        </View>
      ))}
      {beforeSubmit}
      <View
        style={[
          styles.actions,
          secondaryAction ? styles.actionsWithSecondary : undefined,
        ]}
      >
        {secondaryAction}
        <AppButton
          label={submitLabel}
          onPress={form.handleSubmit(onSubmit)}
          disabled={busy || form.formState.isSubmitting || submitDisabled}
          loading={busy || form.formState.isSubmitting}
          variant={submitVariant}
          size={submitSize}
          style={secondaryAction ? styles.actionButton : undefined}
        />
      </View>
      {footer}
    </View>
  );
}

function renderField<TValues extends FieldValues>(
  config: FormBuilderField<TValues>,
  field: ControllerRenderProps<TValues, Path<TValues>>,
  fieldState: ControllerFieldState,
  form: UseFormReturn<TValues>,
  appearance: FieldAppearance,
): React.JSX.Element {
  const errorText = fieldState.error?.message;

  switch (config.type) {
    case 'password':
      return (
        <PasswordField
          label={config.label}
          value={asString(field.value)}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder={config.placeholder}
          errorText={errorText}
          appearance={appearance}
          showLabel={!config.hideLabel}
        />
      );
    case 'phone': {
      const value = asPhoneValue(field.value);
      return (
        <PhoneNumberField
          label={config.label}
          countryCode={value.countryCode}
          nationalNumber={value.nationalNumber}
          onChangeCountryCode={countryCode =>
            field.onChange({ ...value, countryCode })
          }
          onChangeNationalNumber={nationalNumber =>
            field.onChange({ ...value, nationalNumber })
          }
          onBlur={field.onBlur}
          errorText={errorText}
          appearance={appearance}
          showLabel={!config.hideLabel}
          placeholder={config.placeholder}
        />
      );
    }
    case 'date':
      return (
        <DateField
          label={config.label}
          value={asString(field.value)}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder={config.placeholder}
          errorText={errorText}
        />
      );
    case 'chips':
      return (
        <MultiSelectChips
          label={config.label}
          options={config.options}
          selectedKeys={asStringArray(field.value)}
          onChange={field.onChange}
          onBlur={field.onBlur}
          emptyText={config.emptyText}
          errorText={errorText}
        />
      );
    case 'custom':
      return <>{config.render({ field, fieldState, form })}</>;
    case 'text':
    default:
      return (
        <TextField
          label={config.label}
          value={asString(field.value)}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder={config.placeholder}
          keyboardType={config.keyboardType}
          multiline={config.multiline}
          autoCapitalize={config.autoCapitalize}
          maxLength={config.maxLength}
          errorText={errorText}
          appearance={appearance}
          showLabel={!config.hideLabel}
          leadingIcon={config.leadingIcon}
          trailingAccessory={config.trailingAccessory}
        />
      );
  }
}

function groupFields<TValues extends FieldValues>(
  fields: FormBuilderField<TValues>[],
): FormBuilderField<TValues>[][] {
  return fields.reduce<FormBuilderField<TValues>[][]>((groups, field) => {
    const previousGroup = groups[groups.length - 1];
    const previousField = previousGroup?.[0];

    if (field.row && previousField?.row === field.row) {
      previousGroup.push(field);
      return groups;
    }

    groups.push([field]);
    return groups;
  }, []);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(item => typeof item === 'string')
    : [];
}

function asPhoneValue(value: unknown): PhoneFieldValue {
  if (
    value &&
    typeof value === 'object' &&
    'countryCode' in value &&
    'nationalNumber' in value
  ) {
    return value as PhoneFieldValue;
  }
  return { countryCode: '+962', nationalNumber: '' };
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    gap: spacing.sm,
  },
  actionsWithSecondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
  },
});
