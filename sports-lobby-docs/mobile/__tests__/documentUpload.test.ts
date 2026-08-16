import {launchImageLibrary} from 'react-native-image-picker';
import {
  MAX_VERIFICATION_DOCUMENT_BYTES,
  pickBusinessImage,
} from '../src/features/vendor-onboarding/documentUpload';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

const mockedLaunchImageLibrary = jest.mocked(launchImageLibrary);

beforeEach(() => {
  mockedLaunchImageLibrary.mockReset();
});

it('selects a business image from the native photo library', async () => {
  mockedLaunchImageLibrary.mockResolvedValue({
    assets: [
      {
        fileName: 'facility.jpg',
        fileSize: 240_000,
        type: 'image/jpeg',
        uri: 'file:///tmp/facility.jpg',
      },
    ],
  });

  await expect(pickBusinessImage()).resolves.toEqual({
    name: 'facility.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 240_000,
    sourceUri: 'file:///tmp/facility.jpg',
    localUri: 'file:///tmp/facility.jpg',
  });
  expect(mockedLaunchImageLibrary).toHaveBeenCalledWith(
    expect.objectContaining({mediaType: 'photo', selectionLimit: 1}),
  );
});

it('does nothing when native photo selection is canceled', async () => {
  mockedLaunchImageLibrary.mockResolvedValue({didCancel: true});

  await expect(pickBusinessImage()).resolves.toBeUndefined();
});

it('rejects a business image larger than the upload limit', async () => {
  mockedLaunchImageLibrary.mockResolvedValue({
    assets: [
      {
        fileName: 'large.png',
        fileSize: MAX_VERIFICATION_DOCUMENT_BYTES + 1,
        type: 'image/png',
        uri: 'file:///tmp/large.png',
      },
    ],
  });

  await expect(pickBusinessImage()).rejects.toThrow(
    'The selected image must be 5 MB or smaller.',
  );
});
