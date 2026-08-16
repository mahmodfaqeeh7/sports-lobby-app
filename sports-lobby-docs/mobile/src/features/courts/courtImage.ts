import {launchImageLibrary} from 'react-native-image-picker';
import {reachableBackendUrl} from '../../config/environment';
import {CourtImageUpload} from '../lobbies/api';

export const MAX_COURT_IMAGE_BYTES = 5 * 1024 * 1024;

export type SelectedCourtImage = {
  name: string;
  contentType: 'image/jpeg' | 'image/png';
  sizeBytes: number;
  uri: string;
};

export async function pickCourtImage(): Promise<SelectedCourtImage | undefined> {
  const response = await launchImageLibrary({
    assetRepresentationMode: 'compatible',
    includeBase64: false,
    includeExtra: false,
    maxHeight: 2400,
    maxWidth: 2400,
    mediaType: 'photo',
    presentationStyle: 'fullScreen',
    quality: 0.9,
    restrictMimeTypes: ['image/jpeg', 'image/png'],
    selectionLimit: 1,
  });

  if (response.didCancel) {
    return undefined;
  }
  if (response.errorCode) {
    throw new Error(response.errorMessage || 'The photo library could not be opened.');
  }

  const asset = response.assets?.[0];
  if (!asset?.uri) {
    throw new Error('The selected court image could not be read.');
  }
  const contentType = normalizeContentType(asset.type, asset.fileName);
  if (!contentType) {
    throw new Error('Choose a JPEG or PNG court image.');
  }
  if (!asset.fileSize || asset.fileSize <= 0) {
    throw new Error('The selected court image size could not be determined.');
  }
  if (asset.fileSize > MAX_COURT_IMAGE_BYTES) {
    throw new Error('The selected court image must be 5 MB or smaller.');
  }

  return {
    name: asset.fileName || `court-image.${contentType === 'image/png' ? 'png' : 'jpg'}`,
    contentType,
    sizeBytes: asset.fileSize,
    uri: asset.uri,
  };
}

export async function uploadCourtImage(
  image: SelectedCourtImage,
  instructions: CourtImageUpload,
  onProgress: (progress: number) => void,
): Promise<void> {
  if (instructions.method.toUpperCase() !== 'PUT') {
    throw new Error('The server returned an unsupported court image upload method.');
  }
  const {default: ReactNativeBlobUtil} = await import('react-native-blob-util');
  const path = decodeURIComponent(image.uri.replace(/^file:\/\//, ''));
  const task = ReactNativeBlobUtil.fetch(
    'PUT',
    reachableBackendUrl(instructions.uploadUrl),
    instructions.headers,
    ReactNativeBlobUtil.wrap(path),
  ).uploadProgress({interval: 150}, (sent, total) => {
    if (total > 0) {
      onProgress(Math.min(1, sent / total));
    }
  });
  const response = await task;
  const status = response.info().status;
  if (status < 200 || status >= 300) {
    throw new Error(`Court image upload failed with status ${status}.`);
  }
  onProgress(1);
}

function normalizeContentType(
  contentType: string | undefined,
  fileName: string | undefined,
): SelectedCourtImage['contentType'] | undefined {
  const normalized = contentType?.toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  if (normalized === 'image/png') {
    return 'image/png';
  }
  const lowerName = fileName?.toLowerCase() || '';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowerName.endsWith('.png')) {
    return 'image/png';
  }
  return undefined;
}
