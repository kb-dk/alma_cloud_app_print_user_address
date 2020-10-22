/* Defines the User entity */
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
