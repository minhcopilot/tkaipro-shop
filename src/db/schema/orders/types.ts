import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { orderTable, sepayTransactionTable } from "./tables";

// Order types
export type Order = InferSelectModel<typeof orderTable>;
export type OrderInsert = InferInsertModel<typeof orderTable>;
export type OrderUpdate = Partial<OrderInsert>;

// SePay Transaction types  
export type SepayTransaction = InferSelectModel<typeof sepayTransactionTable>;
export type SepayTransactionInsert = InferInsertModel<typeof sepayTransactionTable>;
export type SepayTransactionUpdate = Partial<SepayTransactionInsert>;

// Order with relations
export interface OrderWithTransactions extends Order {
  transactions?: SepayTransaction[];
}

// Checkout form data
export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;  
  customerPhone?: string;
  notes?: string;
}

// SePay webhook payload
export interface SepayWebhookPayload {
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  transferType: "in" | "out";
  transferAmount: number;
  accumulated: number;
  code: string;
  content: string;
  referenceCode: string;
  description: string;
} 