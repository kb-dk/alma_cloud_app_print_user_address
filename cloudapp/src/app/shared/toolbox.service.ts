import {Injectable} from "@angular/core";
import {Settings} from "../settings/settings";
import {Config} from "../config/config";
import {AddressFormats} from "../config/address-format";
import {Address, AlmaPartner, AlmaUser, User} from "./interfaces";

@Injectable({
    providedIn: 'root'
})

export class ToolboxService {
    addressFormats = AddressFormats;

    constructor(){}

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

    convertToPrintableAddress = (addressFormat, showCountry: boolean, addressObj: Address) => {

        let address: string = '';

        addressFormat.map((addressFormatLine, index) => {
            addressFormatLine.map(field => {
                    let value = field === 'country' && addressObj[field] !== null ? addressObj[field].desc : addressObj[field];
                    value = field === 'country' && addressObj[field] !== null && !showCountry ? '' : value;
                    address = (value && !(address.includes(value) && field in ['line1', 'line2', 'line3', 'line4', 'line5'])) ? address.concat(value).concat(' ') : address;
                }
            );
            address = index + 1 !== addressFormat.length && index != 0 ? address + '<br/>' : address;
        });
        return address;
    };

    userFromAlmaUser = (addressFormat, showCountry, almaUser: AlmaUser, index: number): User => {
        return almaUser === null ?
            {id: index, name: 'N/A', receivers_addresses: [{}]} as User :
            {
                id: index,
                name: almaUser.full_name ? (almaUser.full_name.search('null ') === 0 ? almaUser.full_name.replace('null ', '') : almaUser.full_name) : (almaUser.name ? almaUser.name : ''),
                receivers_addresses: almaUser.contact_info.address.map(
                    address => ({
                        type: address.address_type[0].value,
                        address: this.convertToPrintableAddress(addressFormat, showCountry,address)
                    })
                ),
                selectedAddress: almaUser.contact_info.address.some(address => address.preferred === true)
                    ? almaUser.contact_info.address.find(address => address.preferred === true).address_type[0].value
                    : almaUser.contact_info.address.length > 0 ? almaUser.contact_info.address[0].address_type[0].value : 'none',
                checked: false
            } as User;
    };

    partnerFromAlmaPartner = (addressFormat, showCountry: boolean, almaPartner: AlmaPartner, senders_address: String, index: Number) : User => {
        return almaPartner === null ?
            {id: index, name: 'N/A', receivers_addresses: [{}], senders_address: ''} as User:
            {
                id: index,
                name: almaPartner.partner_details.name,
                receivers_addresses: almaPartner.contact_info.address.map(
                    address => ({
                        type: address.address_type.join(),
                        address: this.convertToPrintableAddress(addressFormat, showCountry, address)
                    })
                ),
                senders_address: senders_address,
                selectedAddress: almaPartner.contact_info.address.some(address => address.preferred === true)
                    ? almaPartner.contact_info.address.find(address => address.preferred === true).address_type.join()
                    : almaPartner.contact_info.address.length > 0 ? almaPartner.contact_info.address[0].address_type.join() : true,
                checked: false
            } as User;
    }

}