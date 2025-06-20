export interface User {
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SocialUser {
    socialId: string;
    socialType: string;
    user: any;
    device_token: string
    createdAt: Date;
    updatedAt: Date;
}