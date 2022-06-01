import {Injectable} from "@angular/core";
import {Address} from "./address";

@Injectable({
    providedIn: 'root'
})

export class ConvertService {


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

    userFromAlmaUser = (addressFormat, showCountry, almaUser, index) => {
        return almaUser === null ?
            {id: index, name: 'N/A', addresses: []} :
            {
                id: index,
                name: almaUser.full_name ? (almaUser.full_name.search('null ') === 0 ? almaUser.full_name.replace('null ', '') : almaUser.full_name) : (almaUser.name ? almaUser.name : ''),
                addresses: almaUser.contact_info.address.map(
                    address => ({
                        type: address.address_type[0].value,
                        address: this.convertToPrintableAddress(addressFormat, showCountry,address)
                    })
                ),
                selectedAddress: almaUser.contact_info.address.some(address => address.preferred === true)
                    ? almaUser.contact_info.address.find(address => address.preferred === true).address_type[0].value
                    : almaUser.contact_info.address.length > 0 ? almaUser.contact_info.address[0].address_type[0].value : 'none',
                checked: false
            };
    };

    partnerFromAlmaPartner = (addressFormat, showCountry, almaPartner, senders_address, index) => {
        return almaPartner === null ?
            {id: index, name: 'N/A', receivers_addresses: [], senders_address: ''} :
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
            };
    }
}