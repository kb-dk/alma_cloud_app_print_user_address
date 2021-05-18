import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, throwError} from "rxjs";
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";

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

    partners$ = (entities: Entity[]) => {
        let calls = entities.filter(entity => [EntityType.LOAN].includes(entity.type))
            .map(entity => this.partnerAddressFromLoan(entity.link));
        console.log('Entities:', entities);
        return (calls.length === 0) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err))
            );
    };

    private partnerAddressFromLoan = (link) => this.getLoanFromAlma(link).pipe(
        filter(loan => loan.location_code.name === 'Borrowing Resource Sharing Requests'),
        tap(loan => this.user_id = loan.user_id),
        tap(loan => console.log('loan:',loan)),
        switchMap(loan => this.getRequestFromLoan(loan)),
        tap(loan => this.senders_address = loan.pickup_location),
        tap(request => console.log('request:',request)),
        switchMap(request => this.getResourceSharingRequestFromRequest(request.resource_sharing.id)),
        switchMap(resourceSharingRequest => this.getPartnerFromResourceSharingRequest(resourceSharingRequest)),
        map(partner => this.partnerFromAlmaPartner(partner)),
    );

    constructor(private restService: CloudAppRestService) {
    }

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
        let neededFields = {
            address: ['line1', 'line2', 'line3', 'line4', 'line5'],
            city: ['state_province', 'postal_code', 'city']
        };
        let address: string = '';
        neededFields.address.map(field => {
            address = addressObj[field] && !address.includes(addressObj[field]) ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = address + '<br/>';
        neededFields.city.map(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = address + '<br/>';
        return addressObj.country && addressObj.country.desc ? address.concat(addressObj.country.desc) : address;

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
