import React from 'react';
import {Text} from 'react-native';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {VendorKycStatusPanel} from '../src/features/vendor/components/VendorKycStatusPanel';
import {VendorKyc} from '../src/features/vendor/api';

const baseKyc: VendorKyc = {
  vendor: {
    id: 'vendor-1',
    ownerUserId: 'user-1',
    businessName: 'Amman Courts',
    contactPhone: '+962790000000',
    contactEmail: 'courts@example.com',
    countryCode: 'JO',
    city: 'Amman',
    area: 'Khalda',
    addressLine: 'Main Street',
    verificationStatus: 'PENDING',
  },
  latestSubmission: {
    id: 'submission-1',
    vendorId: 'vendor-1',
    status: 'PENDING',
    submissionNumber: 1,
    submittedAt: '2026-08-14T12:00:00Z',
    businessName: 'Amman Courts',
    contactPhone: '+962790000000',
    contactEmail: 'courts@example.com',
    countryCode: 'JO',
    city: 'Amman',
    addressLine: 'Main Street',
  },
  documents: [],
};

it('shows the reviewer reason for a rejected vendor', async () => {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <VendorKycStatusPanel
        kyc={{
          ...baseKyc,
          vendor: {...baseKyc.vendor, verificationStatus: 'REJECTED'},
          latestSubmission: {
            ...baseKyc.latestSubmission,
            status: 'REJECTED',
            decisionReason: 'Upload a clearer license image.',
          },
        }}
        accessToken="token"
        onRefresh={jest.fn()}
      />,
    );
  });

  expect(
    renderer!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Upload a clearer license image.'),
  ).toBe(true);

  await act(async () => renderer?.unmount());
});

it('does not crash when an older KYC response omits documents', async () => {
  const olderResponse = {
    ...baseKyc,
    documents: undefined,
  } as unknown as VendorKyc;
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <VendorKycStatusPanel
        kyc={olderResponse}
        accessToken="token"
        onRefresh={jest.fn()}
      />,
    );
  });

  expect(
    renderer!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Application submitted'),
  ).toBe(true);

  await act(async () => renderer?.unmount());
});
