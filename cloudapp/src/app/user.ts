/* Defines the User entity (the ultimate user object shape) */
export interface User {
    id?: number;
    name?: string;
    selectedAddress?: string;
    addresses?: [{
        type:string;
        address:string;
    }];
    checked?: boolean;
}
