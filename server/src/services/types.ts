// somewhere in your types or service
export interface BehaviorBaseline {
  avgTransactionAmount?: number;
  transactionFrequency?: number;
  preferredMerchants?: string[];
  typicalLocations?: string[];
}
export interface Transaction {
  id: string;
  amount: number;
  timestamp: Date;
  merchant: string;
  location: string;
  userId: string;
  riskScore?: number;
  flags?: string[];
}