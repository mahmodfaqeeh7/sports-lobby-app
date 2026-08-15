import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { VerificationDocumentField } from '../src/features/vendor-onboarding/components/VerificationDocumentField';
import { SelectedVerificationDocument } from '../src/features/vendor-onboarding/documentUpload';

const document: SelectedVerificationDocument = {
  name: 'business-license.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2 * 1024 * 1024,
  sourceUri: 'content://business-license.pdf',
  localUri: 'file:///cache/business-license.pdf',
};

const callbacks = {
  onPick: jest.fn(),
  onRemove: jest.fn(),
  onRetry: jest.fn(),
};

function textValues(renderer: ReactTestRenderer): string[] {
  const textValue = (value: React.ReactNode): string =>
    Array.isArray(value)
      ? value.map(textValue).join('')
      : typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
  return renderer.root
    .findAllByType(Text)
    .map(node => textValue(node.props.children));
}

it('shows replace and remove actions for a selected document', () => {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(
      <VerificationDocumentField
        {...callbacks}
        document={document}
        status="ready"
        progress={0}
      />,
    );
  });

  expect(textValues(renderer!)).toEqual(
    expect.arrayContaining(['business-license.pdf', '2.0 MB', 'Replace']),
  );
  expect(
    renderer!.root.findAll(node => Boolean(node.props.accessibilityLabel)).some(
      node =>
        node.props.accessibilityLabel === 'Remove verification document',
    ),
  ).toBe(true);
  act(() => renderer!.unmount());
});

it('shows upload progress, failure retry, and completed confirmation states', () => {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(
      <VerificationDocumentField
        {...callbacks}
        document={document}
        status="uploading"
        progress={0.42}
      />,
    );
  });
  expect(textValues(renderer!)).toContain('Uploading… 42%');

  act(() => {
    renderer!.update(
      <VerificationDocumentField
        {...callbacks}
        document={document}
        status="failed"
        progress={0.42}
        errorText="Connection lost."
        locked
      />,
    );
  });
  expect(textValues(renderer!)).toEqual(
    expect.arrayContaining(['Retry', 'Connection lost.']),
  );

  act(() => {
    renderer!.update(
      <VerificationDocumentField
        {...callbacks}
        document={document}
        status="uploaded"
        progress={1}
        locked
      />,
    );
  });
  expect(textValues(renderer!)).toContain('Upload completed successfully.');
  expect(textValues(renderer!)).not.toContain('Retry');
  act(() => renderer!.unmount());
});
