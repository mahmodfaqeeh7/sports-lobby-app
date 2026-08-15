import {ApiClient} from '../../services/api/apiClient';
import {SessionUser} from '../../services/session/sessionTypes';
import {AuthResponse} from '../auth/api';

export type Vendor = {
  id: string;
  ownerUserId: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  countryCode: string;
  city: string;
  area?: string;
  addressLine: string;
  supportedSports?: string;
  venueCountEstimate?: number;
  openingHours?: string;
  verificationStatus: string;
  statusReason?: string;
  approvedAt?: string;
  suspendedAt?: string;
};

export type DocumentUpload = {
  fileId: string;
  documentType: string;
  objectKey: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type VerificationSubmission = {
  id: string;
  vendorId: string;
  status: string;
  submissionNumber: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByAdminUserId?: string;
  decisionReason?: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  countryCode: string;
  city: string;
  area?: string;
  addressLine: string;
  supportedSports?: string;
  venueCountEstimate?: number;
  openingHours?: string;
};

export type AdminVerificationDocument = {
  id: string;
  fileId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadStatus: 'PENDING_UPLOAD' | 'UPLOADED' | 'ABANDONED';
  uploadedAt?: string;
};

export type AdminVendorReview = {
  vendor: Vendor;
  owner: SessionUser;
  submission: VerificationSubmission;
  documents: AdminVerificationDocument[];
  readyForDecision: boolean;
};

export type SignedDownload = {
  downloadUrl: string;
  expiresAt: string;
};

export type VendorKyc = {
  vendor: Vendor;
  latestSubmission: VerificationSubmission;
  documents: VendorVerificationDocument[];
};

export type VendorVerificationDocument = {
  id: string;
  fileId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadStatus: 'PENDING_UPLOAD' | 'UPLOADED' | 'ABANDONED';
  uploadedAt?: string;
};

export type VendorResubmissionResponse = {
  vendor: Vendor;
  verificationSubmission: VerificationSubmission;
  documentUploads: DocumentUpload[];
};

export type VendorSignupRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  password: string;
  deviceLabel?: string;
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  countryCode: string;
  city: string;
  area?: string;
  addressLine: string;
  supportedSports?: string;
  venueCountEstimate?: number;
  openingHours?: string;
  verificationDocuments: {
    documentType: 'BUSINESS_LICENSE' | 'OWNER_ID' | 'FACILITY_PHOTO' | 'BUSINESS_LOGO' | 'OTHER';
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }[];
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

export type VendorSignupResponse = AuthResponse & {
  vendor: Vendor;
  verificationSubmission: VerificationSubmission;
  documentUploads: DocumentUpload[];
};

export const vendorApi = {
  signup(client: ApiClient, request: VendorSignupRequest) {
    return client.post<VendorSignupResponse>('/vendors/signup', request);
  },
  me(client: ApiClient, accessToken: string) {
    return client.get<Vendor>('/vendor/me', accessToken);
  },
  async kyc(client: ApiClient, accessToken: string) {
    const response = await client.get<VendorKyc>('/vendor/kyc', accessToken);
    return {
      ...response,
      documents: Array.isArray(response.documents) ? response.documents : [],
    };
  },
  resubmit(
    client: ApiClient,
    accessToken: string,
    verificationDocuments: VendorSignupRequest['verificationDocuments'],
  ) {
    return client.post<VendorResubmissionResponse>(
      '/vendor/verification/resubmit',
      {verificationDocuments},
      accessToken,
    );
  },
  continueDocumentUpload(
    client: ApiClient,
    accessToken: string,
    fileId: string,
    file: {fileName: string; contentType: string; sizeBytes: number},
  ) {
    return client.post<DocumentUpload>(
      `/vendor/verification-documents/${fileId}/upload-url`,
      file,
      accessToken,
    );
  },
  completeDocumentUpload(client: ApiClient, accessToken: string, fileId: string) {
    return client.post<VendorVerificationDocument>(
      `/vendor/verification-documents/${fileId}/complete`,
      undefined,
      accessToken,
    );
  },
  listPending(client: ApiClient, adminAccessToken: string) {
    return client.get<Vendor[]>('/admin/vendors/pending', adminAccessToken);
  },
  approve(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/approve`, {reason}, adminAccessToken);
  },
  reject(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/reject`, {reason}, adminAccessToken);
  },
  async adminReview(client: ApiClient, adminAccessToken: string, vendorId: string) {
    const response = await client.get<AdminVendorReview>(
      `/admin/vendors/${vendorId}/review`,
      adminAccessToken,
    );
    return {
      ...response,
      documents: Array.isArray(response.documents) ? response.documents : [],
    };
  },
  adminDocumentDownload(client: ApiClient, adminAccessToken: string, fileId: string) {
    return client.get<SignedDownload>(
      `/admin/vendors/verification-documents/${fileId}/download`,
      adminAccessToken,
    );
  },
  suspend(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/suspend`, {reason}, adminAccessToken);
  },
  reactivate(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/reactivate`, {reason}, adminAccessToken);
  },
};
