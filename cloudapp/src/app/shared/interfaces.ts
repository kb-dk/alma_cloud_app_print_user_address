/* Defines the Receiver entity (the ultimate user object shape) */
export interface User {
    id: number;
    name: string;
    selectedAddress?: string;
    receivers_addresses?: [{
        type?:string;
        address?:string;
    }];
    senders_address?: String;
    checked?: boolean;
}
