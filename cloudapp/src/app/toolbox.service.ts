import {Injectable} from "@angular/core";
import {Settings} from "./settings/settings";
import {Config} from "./config/config";
import {AddressFormats} from "./config/address-format";

@Injectable({
    providedIn: 'root'
})

export class ToolboxService {
    addressFormats = AddressFormats;

    constructor(
    ) {
    }

    fixSettings = (settings, config: Config): Settings => {
        settings.numAddressPerRow = parseInt(settings.numAddressPerRow.toString());
        settings.numAddressPerColumn = parseInt(settings.numAddressPerColumn.toString());
        settings.cellPaddingLeft = parseFloat(settings.cellPaddingLeft.toString());
        settings.cellPaddingRight = parseFloat(settings.cellPaddingRight.toString());
        if (!settings.myAddress && config.partner.addresses.length) {
            settings.myAddress = config.partner.addresses[0];
        }
        return settings;
    }


    // Replace commas with line-break and bold the first line
    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>' + title + '</strong>' + address;
        return string.replace(/,/g, '<br/>')
    };

    fixOldOrEmptyConfigElements = (config): Config => {
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
        // Fix if showCountry is not defined
        if (!config.addressFormat.hasOwnProperty('showCountry')) {
            config.addressFormat.showCountry = true;
        }
        // Fix if showRecipient is not defined
        if (!config.addressFormat.hasOwnProperty('showRecipient')) {
            config.addressFormat.showRecipient = true;
        }

        return config;
    };

}