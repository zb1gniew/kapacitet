export type CompanyDetails = {
  name: string;
  categories: string[];
  defaultLocation: string;
  contactEmail: string;
};

export type OnboardingStatus = {
  isOnboardingCompleted: boolean;
  company: CompanyDetails;
};
