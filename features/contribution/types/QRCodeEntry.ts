/**
 * QR-/Invite-Code für Events, Umfragen, Mandanten-Login etc.
 */
export interface QRCodeEntry {
  _id?: string;
  code: string;
  projectId: string;
  type?: 'invite' | 'survey' | 'event' | 'stream' | 'custom';
  created: string;
  expires?: string;
  usedBy?: string[];
  createdBy?: string;
  organizationId?: string;
  region?: string;
  scanStats?: QRCodeScanStats[];
  status?: 'active' | 'expired' | 'revoked';
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  archived?: boolean;
  version?: number;
}

export interface QRCodeScanStats {
  userId?: string;
  scannedAt: string;
  deviceType?: string;
  location?: {
    lat?: number;
    lng?: number;
    country?: string;
    region?: string;
  };
}
