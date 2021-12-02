import {Injectable, ElementRef} from '@angular/core';
import {of, throwError} from "rxjs";
import {catchError, concatMap, map, tap} from "rxjs/operators";
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    CloudAppSettingsService,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserService} from "./user.service";
import {PartnerService} from "./partner.service";
import {FixConfigService} from "./fix-config.service";
import {Address} from "./address";
import {AddressFormats} from "./config/address-format";

@Injectable({
    providedIn: 'root'
})


export class ScanService {

    senders_address: string = '';
    addressFormat = AddressFormats['1'];
    showCountry = true;

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private settingsService: CloudAppSettingsService,
                private eventsService: CloudAppEventsService,
                private userService: UserService,
                private partnerService: PartnerService,
                private scanService: ScanService,
                private fixConfigService: FixConfigService
    ) {
    }

    scan = (barcode) => {

        this.configService.get().pipe(
            map(config => this.fixConfigService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.addressFormat = config.addressFormat.addresses[config.addressFormat.default]),
            tap(config => this.showCountry = config.addressFormat.showCountry),
            catchError(err => this.handleError(err))
        );


        return this.restService.call(`/almaws/v1/items?item_barcode=${barcode}`).pipe(
            concatMap(item => this.getRequests(item.link)),
            map(item => item.user_request[0].resource_sharing.partner.link),
            concatMap(partner_link => this.restService.call(partner_link)),
            map(partner => this.partnerFromAlmaPartner(partner)),
        )
    };

    getRequests = (link) => this.restService.call(`${link}/requests?status=history`);

    getResourceSharingRequestFromRequest = id => this.restService.call(`/resource-sharing-requests/${id}`);

    private partnerFromAlmaPartner = (almaPartner) => almaPartner === null ?
        {id: 'N/A', name: 'N/A', receivers_addresses: [], senders_address: ''} :
        {
            id: 0,
            name: almaPartner.partner_details.name,
            receivers_addresses: almaPartner.contact_info.address.map(
                address => ({
                    type: address.address_type.join(),
                    address: this.convertToPrintableAddress(address)
                })
            ),
            senders_address: this.senders_address,
            selectedAddress: almaPartner.contact_info.address.some(address => address.preferred === true)
                ? almaPartner.contact_info.address.find(address => address.preferred === true).address_type.join()
                : almaPartner.contact_info.address.length > 0 ? almaPartner.contact_info.address[0].address_type.join() : true,
            checked: true
        };

    private convertToPrintableAddress = (addressObj: Address) => {
        let address: string = '';
        this.addressFormat.map((addressFormatLine, index) => {
            addressFormatLine.map(field => {
                    let value = field === 'country' && addressObj[field] !== null ? addressObj[field].desc : addressObj[field];
                    value = field === 'country' && addressObj[field] !== null && !this.showCountry ? '' : value;
                    address = (value && !(address.includes(value) && field in ['line1', 'line2', 'line3', 'line4', 'line5'])) ? address.concat(value).concat(' ') : address;
                }
            );
            // Recipient is empty here, it will be calculate in userFromAlmaUser
            // so No page break after first and last line please
            address = index + 1 !== this.addressFormat.length && index != 0 ? address + '<br/>' : address;
        });
        return address;
    };

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };

}