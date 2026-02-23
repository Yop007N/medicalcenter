export interface Budget {
  id: number;
  patient_id: number;
  created_by: number;
  title: string;
  description: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  items: BudgetItem[];
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}
