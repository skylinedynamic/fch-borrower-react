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
/**
 * Download signed agreement as PDF.
 */
export const downloadAgreementSign = async (userId?: number | string) => {
    const url = userId ? `/borrower/agreement-sign/download/${userId}` : '/borrower/agreement-sign/download'
    const response = await apiClient.get(url, {
        responseType: 'blob'
    })
    return response
}

/**
 * Fetch the signed agreement HTML snapshot for preview.
 */
export const fetchSignedAgreementHtml = async (userId?: number | string): Promise<CheckAgreementSignResponse> => {
    const url = userId ? `/borrower/agreement-sign/signed-html/${userId}` : '/borrower/agreement-sign/signed-html'
    const res = await apiClient.get(url)
    return res.data
}
