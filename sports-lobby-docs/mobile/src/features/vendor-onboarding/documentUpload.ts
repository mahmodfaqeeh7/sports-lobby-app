import { launchImageLibrary } from 'react-native-image-picker';
import {reachableBackendUrl} from '../../config/environment';
import { DocumentUpload } from '../vendor/api';

export const MAX_VERIFICATION_DOCUMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

export type SelectedVerificationDocument = {
  name: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number;
  sourceUri: string;
  localUri: string;
};

export async function pickVerificationDocument(): Promise<
  SelectedVerificationDocument | undefined
> {
  const { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } =
    await import('@react-native-documents/picker');

  try {
    const [picked] = await pick({
      allowMultiSelection: false,
      allowVirtualFiles: false,
      mode: 'import',
      type: [types.pdf, types.images],
    });

    if (!picked || picked.error) {
      throw new Error(
        picked?.error || 'The selected document could not be read.',
      );
    }
    if (!picked.hasRequestedType) {
      throw new Error('Choose a PDF, JPEG, or PNG document.');
    }
    if (!picked.name) {
      throw new Error('The selected document must have a file name.');
    }
    if (!picked.size || picked.size <= 0) {
      throw new Error('The selected document size could not be determined.');
    }
    if (picked.size > MAX_VERIFICATION_DOCUMENT_BYTES) {
      throw new Error('The selected document must be 5 MB or smaller.');
    }

    const contentType = normalizedContentType(picked.type, picked.name);
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new Error('Choose a PDF, JPEG, or PNG document.');
    }

    const [copy] = await keepLocalCopy({
      destination: 'cachesDirectory',
      files: [{ fileName: picked.name, uri: picked.uri }],
    });
    if (copy.status !== 'success') {
      throw new Error(
        copy.copyError || 'The document could not be prepared for upload.',
      );
    }

    return {
      name: picked.name,
      contentType: contentType as SelectedVerificationDocument['contentType'],
      sizeBytes: picked.size,
      sourceUri: picked.uri,
      localUri: copy.localUri,
    };
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function pickBusinessImage(): Promise<
  SelectedVerificationDocument | undefined
> {
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
    throw new Error(
      response.errorMessage || 'The photo library could not be opened.',
    );
  }

  const picked = response.assets?.[0];
  if (!picked?.uri) {
    throw new Error('The selected image could not be read.');
  }
  const contentType = normalizedContentType(
    picked.type ?? null,
    picked.fileName ?? '',
  );
  if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
    throw new Error('Choose a JPEG or PNG image.');
  }
  if (!picked.fileSize || picked.fileSize <= 0) {
    throw new Error('The selected image size could not be determined.');
  }
  if (picked.fileSize > MAX_VERIFICATION_DOCUMENT_BYTES) {
    throw new Error('The selected image must be 5 MB or smaller.');
  }

  return {
    name:
      picked.fileName ||
      `business-image.${contentType === 'image/png' ? 'png' : 'jpg'}`,
    contentType,
    sizeBytes: picked.fileSize,
    sourceUri: picked.uri,
    localUri: picked.uri,
  };
}

export async function uploadVerificationDocument(
  document: SelectedVerificationDocument,
  instructions: DocumentUpload,
  onProgress: (progress: number) => void,
): Promise<void> {
  const { default: ReactNativeBlobUtil } =
    await import('react-native-blob-util');
  const path = decodeURIComponent(document.localUri.replace(/^file:\/\//, ''));
  const url = reachableBackendUrl(instructions.uploadUrl);
  if (instructions.method.toUpperCase() !== 'PUT') {
    throw new Error('The server returned an unsupported upload method.');
  }
  const task = ReactNativeBlobUtil.fetch(
    'PUT',
    url,
    instructions.headers,
    ReactNativeBlobUtil.wrap(path),
  ).uploadProgress({ interval: 150 }, (sent, total) => {
    if (total > 0) {
      onProgress(Math.min(1, sent / total));
    }
  });
  const response = await task;
  const status = response.info().status;

  if (status < 200 || status >= 300) {
    throw new Error(`Document upload failed with status ${status}.`);
  }
  onProgress(1);
}

export async function removeLocalDocument(
  document: SelectedVerificationDocument | undefined,
): Promise<void> {
  if (!document) {
    return;
  }

  const { default: ReactNativeBlobUtil } =
    await import('react-native-blob-util');
  const path = decodeURIComponent(document.localUri.replace(/^file:\/\//, ''));
  const exists = await ReactNativeBlobUtil.fs.exists(path);
  if (exists) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }
}

export function formatDocumentSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizedContentType(
  contentType: string | null,
  fileName: string,
): string | undefined {
  const normalized = contentType?.toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  if (normalized && ALLOWED_CONTENT_TYPES.has(normalized)) {
    return normalized;
  }

  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowerName.endsWith('.png')) {
    return 'image/png';
  }
  return undefined;
}
