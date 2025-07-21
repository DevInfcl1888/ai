// src/types/business.d.ts
export interface Representative {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  businessTitle: string;
}

export interface Business {
  userId: string;
  businessName: string;
  businessType: string;
  businessIndustry: string;
  registrationIdType: string;
  registrationNumber: string;
  registrationCountryOfOperation: string;
  websiteUrl: string;
  physicalAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  authorizedRepresentative: Representative;
  secondAuthorizedRepresentative?: Representative;
}
