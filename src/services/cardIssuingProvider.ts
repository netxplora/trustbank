export interface CardProvisionRequest {
  userId: string;
  cardType: "virtual" | "debit" | "premium" | "infinite";
  cardholderName: string;
}

export interface CardProvisionResult {
  success: boolean;
  providerCardId?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardBrand?: string;
  status?: "active" | "inactive";
  message?: string;
}

/**
 * Simulates a request to a Card Issuing partner provider (e.g., Visa Direct / Stripe Issuing)
 */
export async function provisionCard(request: CardProvisionRequest): Promise<CardProvisionResult> {
  // Validate network connectivity before attempting to provision
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return {
      success: false,
      message: "Network connection lost. Please check your internet connection and try again."
    };
  }

  // Simulate network latency for API call (1.2 seconds for secure card generation)
  await new Promise(resolve => setTimeout(resolve, 1200));

  try {
    // Generate secure card credentials for payment handling
    const isVisa = Math.random() > 0.4;
    const prefix = isVisa ? "4532" : "5412";
    const middle = Array.from({ length: 3 }, () => String(Math.floor(1000 + Math.random() * 9000))).join("");
    const cardNumber = `${prefix} ${middle.slice(0, 4)} ${middle.slice(4, 8)} ${middle.slice(8, 12)}`;
    
    const cvv = String(Math.floor(100 + Math.random() * 900));
    
    // Future expiration date (4 years from today)
    const now = new Date();
    const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expiryYear = String(now.getFullYear() + 4).slice(-2);
    
    const mockProviderCardId = `ic_${Math.random().toString(36).substring(2, 12)}`;
    const isVirtual = request.cardType === "virtual";
    
    return {
      success: true,
      providerCardId: mockProviderCardId,
      cardNumber,
      expiryDate: `${expiryMonth}/${expiryYear}`,
      cvv,
      cardBrand: isVisa ? "Visa" : "Mastercard",
      status: isVirtual ? "active" : "inactive", // Virtual cards activate instantly; physical cards require user activation
      message: isVirtual 
        ? "Virtual card provisioned successfully." 
        : "Physical card request registered successfully and pending delivery."
    };
  } catch (error: any) {
    console.error("[Card Issuing Service] Error:", error);
    return {
      success: false,
      message: error.message || "Failed to provision card with issuing provider due to an internal error."
    };
  }
}
