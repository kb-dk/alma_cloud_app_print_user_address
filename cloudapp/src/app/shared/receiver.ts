/* Defines the Receiver entity (the ultimate user object shape) */
export interface User {
    id: number;
    name: string;
    selectedAddress: string;
    addresses?: [{
        type:string;
        address:string;
    }];
    checked?: boolean;
}

export interface Partner {
    id: number;
    name: string;
    selectedAddress: string;
    senders_addresses?: [{
        type:string;
        address:string;
    }];
    receivers_addresses?: [{
        type:string;
        address:string;
    }];
    checked?: boolean;
}
