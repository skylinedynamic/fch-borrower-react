export interface AgreementTemplate {
  id: number;
  name?: string;
  template_html: string;
  slug: string;
  /** The wording's version; sent back on submit so a wording changed meanwhile is not signed unseen. */
  version_id?: number;
  version?: number;
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
  agreement_template_version_id?: number;
  /** The values entered, by field; the server builds the signed record from them. */
  fields?: Record<string, string | boolean>;
  content_html: string | null;
}
