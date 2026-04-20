export interface ResourceItem {
  id: number;
  title: string;
  subtitle: string | null;
  icon: string | null;
  resource_type: string;
  file_url: string | null;
  link: string | null;
  status: boolean;
}

export interface GroupedResources {
  education_help?: ResourceItem[];
  legal_registration?: ResourceItem[];
  business_services?: ResourceItem[];
  download_assets?: ResourceItem[];
  training_academy?: ResourceItem[];
}

export interface ResourceResponse {
  status: boolean;
  message: string;
  data: GroupedResources;
}
