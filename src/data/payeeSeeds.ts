export type PayeeCategory = "utility" | "credit_card" | "mortgage" | "insurance" | "telecom" | "education" | "healthcare" | "tax" | "other";

export interface PayeeSeed {
  id: string;
  name: string;
  category: PayeeCategory;
  description?: string;
}

export const PAYEE_SEEDS: PayeeSeed[] = [
  // Utilities
  { id: "u1", name: "Con Edison", category: "utility", description: "Electricity & Gas" },
  { id: "u2", name: "Pacific Gas and Electric (PG&E)", category: "utility", description: "Electricity & Gas" },
  { id: "u3", name: "National Grid", category: "utility", description: "Electricity & Gas" },
  { id: "u4", name: "Eversource", category: "utility", description: "Electricity & Gas" },
  { id: "u5", name: "Waste Management", category: "utility", description: "Trash & Recycling" },
  { id: "u6", name: "Republic Services", category: "utility", description: "Trash & Recycling" },
  { id: "u7", name: "American Water", category: "utility", description: "Water Supply" },
  
  // Telecom & Internet
  { id: "t1", name: "AT&T", category: "telecom", description: "Mobile & Internet" },
  { id: "t2", name: "Verizon Wireless", category: "telecom", description: "Mobile & Internet" },
  { id: "t3", name: "T-Mobile", category: "telecom", description: "Mobile Services" },
  { id: "t4", name: "Spectrum", category: "telecom", description: "Cable & Internet" },
  { id: "t5", name: "Comcast Xfinity", category: "telecom", description: "Cable & Internet" },
  { id: "t6", name: "Cox Communications", category: "telecom", description: "Cable & Internet" },
  { id: "t7", name: "Google Fi", category: "telecom", description: "Mobile Services" },
  
  // Credit Cards
  { id: "cc1", name: "Chase Credit Card", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc2", name: "American Express", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc3", name: "Discover", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc4", name: "Capital One", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc5", name: "Citi Cards", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc6", name: "Bank of America Credit Card", category: "credit_card", description: "Credit Card Payment" },
  { id: "cc7", name: "Barclays", category: "credit_card", description: "Credit Card Payment" },
  
  // Insurance
  { id: "i1", name: "State Farm", category: "insurance", description: "Auto & Home" },
  { id: "i2", name: "Geico", category: "insurance", description: "Auto & Home" },
  { id: "i3", name: "Progressive", category: "insurance", description: "Auto & Home" },
  { id: "i4", name: "Allstate", category: "insurance", description: "Auto & Home" },
  { id: "i5", name: "Liberty Mutual", category: "insurance", description: "Auto & Home" },
  { id: "i6", name: "Farmers Insurance", category: "insurance", description: "Auto & Home" },
  { id: "i7", name: "USAA", category: "insurance", description: "Auto, Home & Life" },
  
  // Mortgage & Loans
  { id: "m1", name: "Wells Fargo Mortgage", category: "mortgage", description: "Home Loan" },
  { id: "m2", name: "Bank of America Mortgage", category: "mortgage", description: "Home Loan" },
  { id: "m3", name: "Rocket Mortgage", category: "mortgage", description: "Home Loan" },
  { id: "m4", name: "Chase Mortgage", category: "mortgage", description: "Home Loan" },
  { id: "m5", name: "U.S. Bank Mortgage", category: "mortgage", description: "Home Loan" },
  { id: "m6", name: "Sallie Mae", category: "other", description: "Student Loan" },
  { id: "m7", name: "Navient", category: "other", description: "Student Loan" },
  
  // Education
  { id: "e1", name: "FedLoan Servicing", category: "education", description: "Student Loan" },
  { id: "e2", name: "Great Lakes Educational", category: "education", description: "Student Loan" },
  { id: "e3", name: "Nelnet", category: "education", description: "Student Loan" },

  // Healthcare
  { id: "h1", name: "UnitedHealthcare", category: "healthcare", description: "Health Insurance" },
  { id: "h2", name: "Anthem Blue Cross", category: "healthcare", description: "Health Insurance" },
  { id: "h3", name: "Aetna", category: "healthcare", description: "Health Insurance" },
  { id: "h4", name: "Cigna", category: "healthcare", description: "Health Insurance" },
  { id: "h5", name: "Kaiser Permanente", category: "healthcare", description: "Health Insurance" },

  // Tax & Government
  { id: "g1", name: "Internal Revenue Service (IRS)", category: "tax", description: "Federal Taxes" },
  { id: "g2", name: "Franchise Tax Board", category: "tax", description: "State Taxes" },
  { id: "g3", name: "Department of Revenue", category: "tax", description: "State Taxes" },
];

export const getPayeesByCategory = (category: PayeeCategory) => {
  return PAYEE_SEEDS.filter(payee => payee.category === category);
};

export const searchPayees = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return PAYEE_SEEDS.filter(payee => 
    payee.name.toLowerCase().includes(lowerQuery) || 
    payee.description?.toLowerCase().includes(lowerQuery)
  );
};
