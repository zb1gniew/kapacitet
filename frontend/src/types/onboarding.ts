export type CompanyDetails = {
  name: string;
  cvr?: string | null;
  categories: string[];
  defaultLocation: string;
  contactEmail: string;
  contactPhone?: string | null;
};

export type OnboardingStatus = {
  isOnboardingCompleted: boolean;
  company: CompanyDetails;
};
