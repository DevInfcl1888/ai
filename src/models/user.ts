export interface User {
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    phone_num: string;
    notification: string;
    sms: boolean;
    call_count: number; // <-- include this in the type definition

}


export interface SocialUser {
    socialId: string;
    socialType: string;
    user: any;
    device_token: string
    createdAt: Date;
    updatedAt: Date;
    notification:string;
    phone_num: string;
    sms: boolean,
    call_count: number; // <-- include this in the type definition

}