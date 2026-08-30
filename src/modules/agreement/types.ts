export interface AgreementTemplate {
  id: number;
  name?: string;
  template_html: string;
  slug: string;
}

export interface CheckAgreementSignResponse {
  status: boolean;
  data: {
    needs_sign: boolean;
    template: AgreementTemplate | null;
  };
}

export interface SubmitAgreementSignRequest {
  agreement_template_id: number;
  content_html: string | null;
}
