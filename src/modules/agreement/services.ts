import { apiClient } from "../../lib/http/apiClient";
import { CheckAgreementSignResponse, SubmitAgreementSignRequest } from "./types";

/**
 * Check if the authenticated borrower must sign an agreement.
 */
export const checkAgreementSign = async (): Promise<CheckAgreementSignResponse> => {
    try {
        const response = await apiClient.get("/borrower/agreement-sign/check");
        return response.data;
    } catch (error) {
        console.error("Error checking agreement sign status:", error);
        throw error;
    }
};

/**
 * Submit the signed agreement.
 */
export const submitAgreementSign = async (data: SubmitAgreementSignRequest) => {
    try {
        const response = await apiClient.post("/borrower/agreement-sign/submit", data);
        return response.data;
    } catch (error) {
        console.error("Error submitting agreement sign:", error);
        throw error;
    }
};
