import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import {
  OpeningHoursField,
  serializeOpeningHours,
  validateOpeningHours,
} from '../src/features/vendor-onboarding/components/OpeningHoursField';

function button(renderer: ReactTestRenderer, label: string) {
  return renderer.root.findByProps({ accessibilityLabel: label });
}

it('collects opening and closing times without exposing a date', () => {
  let value = { opensAt: '', closesAt: '' };
  let renderer: ReactTestRenderer;

  act(() => {
    renderer = create(
      <OpeningHoursField
        value={value}
        onChange={nextValue => {
          value = nextValue;
          renderer.update(
            <OpeningHoursField value={value} onChange={() => undefined} />,
          );
        }}
      />,
    );
  });

  expect(button(renderer!, 'Opens at. Not selected')).toBeDefined();
  expect(button(renderer!, 'Closes at. Not selected')).toBeDefined();

  act(() => renderer!.unmount());
});

it('serializes normal and overnight time ranges', () => {
  expect(
    serializeOpeningHours({ opensAt: '08:00', closesAt: '23:00' }),
  ).toBe('Daily 08:00–23:00');
  expect(
    serializeOpeningHours({ opensAt: '18:00', closesAt: '02:00' }),
  ).toBe('Daily 18:00–02:00 (next day)');
  expect(validateOpeningHours({ opensAt: '08:00', closesAt: '08:00' })).toBe(
    'Opening and closing times must be different.',
  );
});
