export interface PatientBudget {
  id: number;
  title: string;
  description?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  currency?: string | null;
  total_paid?: number;
  payments_count?: number;
  valid_until?: string | null;
  created_at: string;
}
