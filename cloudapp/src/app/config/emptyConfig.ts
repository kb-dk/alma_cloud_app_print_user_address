import {Config} from "./config";

/* Defines the Config entity*/
export const emptyConfig : Config = {
    user: { logo: '' },
    partner: { addresses: [] },
    addressFormat: { addresses: {}, default: "1", showCountry: true, showRecipient: true }
};