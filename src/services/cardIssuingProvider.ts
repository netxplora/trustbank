export interface CardProvisionRequest {
  userId: string;
  cardType: "virtual" | "debit";
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
 * Simulates a request to a Card Issuing provider (e.g., Stripe Issuing, Marqeta)
 */
export async function provisionCard(request: CardProvisionRequest): Promise<CardProvisionResult> {
  // Validate network connectivity before attempting to provision
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return {
      success: false,
      message: "Network connection lost. Please check your internet connection and try again."
    };
  }

  // Simulate network latency for API call (1.5 seconds for card generation)
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // Generate mock PCI-compliant data for the frontend display
    // Note: In production, real PANs should not be fully stored/displayed directly
    const num = Array.from({ length: 4 }, () => String(Math.floor(1000 + Math.random() * 9000))).join("");
    const cvv = String(Math.floor(100 + Math.random() * 900));
    
    // Future expiry date (3 years from now)
    const now = new Date();
    const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expiryYear = String(now.getFullYear() + 3).slice(-2);
    
    const mockProviderCardId = `ic_${Math.random().toString(36).substring(2, 12)}`;
    
    return {
      success: true,
      providerCardId: mockProviderCardId,
      cardNumber: num,
      expiryDate: `${expiryMonth}/${expiryYear}`,
      cvv,
      cardBrand: Math.random() > 0.5 ? "Visa" : "Mastercard",
      status: request.cardType === "virtual" ? "active" : "inactive", // Virtual cards active immediately
      message: "Card successfully provisioned by issuing partner."
    };
  } catch (error: any) {
    console.error("[Card Issuing Provider] Error:", error);
    return {
      success: false,
      message: error.message || "Failed to provision card with issuing provider due to an internal error."
    };
  }
}
