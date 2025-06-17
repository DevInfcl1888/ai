export interface User {
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SocialUser {
    socialId: string;
    socialType: string;
    user: any;
    createdAt: Date;
    updatedAt: Date;
}