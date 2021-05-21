import {Injectable} from "@angular/core";
import {AddressFormats} from "./config/address-format";

@Injectable({
    providedIn: 'root'
})

export class FixConfigService {
    addressFormats = AddressFormats;

    constructor(
    ) {
    }

    fixOldOrEmptyConfigElements = (config) => {
        // Fix it if config is an empty object
        if (!Object.keys(config).length) {
            config = {user: {logo: ''}, partner: {addresses: []}, addressFormat: {addresses: {}, default: "1"}};
            config.addressFormat.addresses = this.addressFormats;
        }
        // Fix it if logo is directly in the config and not under user
        if (config.hasOwnProperty('logo')) {
            config.user = {};
            config.user.logo = config.logo;
            delete config.logo;
        }
        // Fix the config if there is no partner
        if (!config.hasOwnProperty('partner')) {
            config.partner = {}
        }
        // Fix the config if there is not addresses in partner
        if (!config.partner.hasOwnProperty('addresses')) {
            config.partner.addresses = []
        }
        // Fix the config if there is not addressFormat
        if (!config.hasOwnProperty('addressFormat')) {
            config.addressFormat = {addresses: {}, default: "1"};
            config.addressFormat.addresses = this.addressFormats;
        }
        // Fix empty addresses in address format
        if (!config.addressFormat.addresses.length) {
            config.addressFormat.addresses = this.addressFormats;
        }
        return config;
    };
}