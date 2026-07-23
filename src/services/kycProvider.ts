export interface KYCSubmissionData {
  userId: string;
  fullName: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  documents: { type: string; fileUrl: string }[];
}

export interface KYCSubmissionResult {
  success: boolean;
  vendorReferenceId?: string;
  status?: "pending" | "approved" | "rejected";
  message?: string;
}

/**
 * Simulates a submission to a third-party KYC provider (e.g., Onfido, SumSub)
 */
export async function submitToKycProvider(data: KYCSubmissionData): Promise<KYCSubmissionResult> {
  // Simulate network latency for API call (1.5 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // In a real implementation, you would use fetch() to call the provider's API.
    // Example:
    // const response = await fetch("https://api.onfido.com/v3.4/applicants", { ... });
    // const result = await response.json();
    
    // Simulating a successful provider acceptance:
    const mockVendorRefId = `kyc_req_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    
    return {
      success: true,
      vendorReferenceId: mockVendorRefId,
      status: "pending",
      message: "Identity documents accepted by provider and are under review."
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to communicate with KYC provider."
    };
  }
}
