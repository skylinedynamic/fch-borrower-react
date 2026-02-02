export interface SettingsData {
    payment_mode?: string;
    stripe_key_sandbox?: string;
    stripe_key_live?: string;
    [key: string]: any;
}

export interface SettingsResponse {
    status: boolean;
    message?: string;
    data: SettingsData;
}

export interface UpdateSettingsPayload {
    [key: string]: any;
}
