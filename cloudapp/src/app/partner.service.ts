import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppConfigService, CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, throwError} from "rxjs";
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";
import {AddressFormats} from "./config/address-format";
import {FixConfigService} from "./fix-config.service";

@Injectable({
    providedIn: 'root'
})

export class PartnerService {
    // The Cloud App’s JSON includes the URL for GET-loan API (from workbench when you return an item).
    // You can then call the following APIs:
    // GET (historic) loan – starting Alma’s March Release it will include the related request ID and a link to the Get-Request API
    // GET request – from there you’ll get the GET resource-sharing-request API URL
    // GET resource-sharing-request – which includes the partner’s code
    // GET partner – which will give you the partner’s address.
    user_id : string = '';
    senders_address : string = '';
    addressFormat = AddressFormats['1'];
    showCountry = true;


    partners$ = (entities: Entity[]) => {

        let config = this.configService.get().pipe(
            map(config => this.fixConfigService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.addressFormat = config.addressFormat.addresses[config.addressFormat.default]),
            tap(config => this.showCountry = config.addressFormat.showCountry),
            catchError(err => this.handleError(err))
        );

        let calls = entities.filter(entity => [EntityType.LOAN].includes(entity.type))
            .map(entity => this.partnerAddressFromLoan(entity.link));
        // TODO Find a better way to ensure having the config before piping the addresses into partnerAddressFromLoan
        calls.push(config); // Pushing the config into array of observables
        return (calls.length === 1) ?
            of([]) :
            forkJoin(calls).pipe(
                tap(users => users.pop()),// Pulling the config off of the array of results
                catchError(err => this.handleError(err))
            );
    };

    private partnerAddressFromLoan = (link) => this.getLoanFromAlma(link).pipe(
        filter(loan => loan.location_code.name === 'Borrowing Resource Sharing Requests'),
        tap(loan => this.user_id = loan.user_id),
        switchMap(loan => this.getRequestFromLoan(loan)),
        tap(loan => this.senders_address = loan.pickup_location),
        switchMap(request => this.getResourceSharingRequestFromRequest(request.resource_sharing.id)),
        switchMap(resourceSharingRequest => this.getPartnerFromResourceSharingRequest(resourceSharingRequest)),
        map(partner => this.partnerFromAlmaPartner(partner)),
    );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private fixConfigService: FixConfigService,
                ){}

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
            checked: false
        };

    private getLoanFromAlma = link => this.restService.call(link);

    private getRequestFromLoan = loan => this.restService.call(loan.request_id.link);

    private getResourceSharingRequestFromRequest = id => this.restService.call(`/users/${this.user_id}/resource-sharing-requests/${id}`);

    private getPartnerFromResourceSharingRequest = resourceSharingRequest => this.restService.call(resourceSharingRequest.partner.link);

    private convertToPrintableAddress = (addressObj: Address) => {
        let address: string = '';
        this.addressFormat.map((addressFormatLine, index) => {
            addressFormatLine.map(field => {
                let value = field === 'country' && addressObj[field] !== null ? addressObj[field].desc : addressObj[field];
                    value = field === 'country' && addressObj[field] !== null && !this.showCountry ? '' : value;
                    address = (value && !(address.includes(value)&& field in ['line1', 'line2', 'line3', 'line4', 'line5'])) ? address.concat(value).concat(' ') : address;
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
