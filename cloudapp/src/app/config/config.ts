/* Defines the Config entity*/
export interface Config {
    user: {
        logo: string;
        }
    partner: {
        addresses: string[];
    }
    addressFormat: {
        addresses: {},
        default: string
    }
}