export type BudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Budget {
  id: number;
  patient_id: number;
  created_by: number;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  status: BudgetStatus;
  valid_until?: string;
  items?: BudgetItem[];
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  professional?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  payments?: Payment[];
  /** Total amount paid for this budget */
  total_paid?: number;
  /** Number of payments made */
  payments_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface BudgetCreate {
  patient_id: number;
  title: string;
  description?: string;
  total_amount: number;
  currency?: string;
  valid_until?: string;
  items?: BudgetItem[];
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other' | 'insurance';

export interface Payment {
  id: number;
  budget_id?: number;
  amount: number;
  currency: string;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id?: string;
  transaction_reference?: string;
  payment_date?: string;
  notes?: string;
  budget?: {
    id: number;
    title: string;
    patient_id: number;
  };
  created_at: string;
  updated_at?: string;
}

export interface PaymentCreate {
  budget_id?: number;
  amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  payment_date?: string;
  transaction_reference?: string;
  notes?: string;
}

export interface PaymentUpdate {
  amount?: number;
  currency?: string;
  payment_method?: PaymentMethod;
  payment_date?: string;
  transaction_reference?: string;
  notes?: string;
}

export interface BudgetUpdate {
  title?: string;
  patient_id?: number;
  description?: string;
  total_amount?: number;
  currency?: string;
  valid_until?: string;
  items?: BudgetItem[];
}
