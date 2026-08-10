import {ApiClient} from '../../services/api/apiClient';
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
  latitude?: number;
  longitude?: number;
  supportedSports?: string;
  venueCountEstimate?: number;
  openingHours?: string;
  verificationStatus: string;
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
  latitude?: number;
  longitude?: number;
  supportedSports?: string;
  venueCountEstimate?: number;
  openingHours?: string;
  verificationDocuments: {
    documentType: 'BUSINESS_LICENSE' | 'OWNER_ID' | 'TAX_DOCUMENT' | 'OTHER';
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }[];
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
  listPending(client: ApiClient, adminAccessToken: string) {
    return client.get<Vendor[]>('/admin/vendors/pending', adminAccessToken);
  },
  approve(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/approve`, {reason}, adminAccessToken);
  },
  reject(client: ApiClient, adminAccessToken: string, vendorId: string, reason: string) {
    return client.post<Vendor>(`/admin/vendors/${vendorId}/reject`, {reason}, adminAccessToken);
  },
};
