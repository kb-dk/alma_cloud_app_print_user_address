/* Defines the UserAddressInfo entity */
export interface UserAddressInfo {
    id?: number;
    name?: string;
    desiredAddress?: string;
    addresses?: [{
        type:string;
        address:string;
    }];
    checked?: boolean;
}
