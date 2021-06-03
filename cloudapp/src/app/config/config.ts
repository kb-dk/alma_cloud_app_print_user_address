/* Initiate Config fields*/
export interface Config {
    user: {
        logo: string;
    }
    partner: {
        addresses: string[];
    }
    addressFormat: {
        addresses: {},
        default: string,
        showCountry: boolean
    }
}