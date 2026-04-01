export type CompanyDetails = {
  name: string;
  industry: string;
  defaultLocation: string;
  contactEmail: string;
};

export type OnboardingStatus = {
  isOnboardingCompleted: boolean;
  company: CompanyDetails;
};
