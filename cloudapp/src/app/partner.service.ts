import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, throwError} from "rxjs";
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})

export class PartnerService {

    // To get the partner address from the page entities
    // there is the need for two more API call (There might be other ways)
    // get the requests from the link string in the entity object (if there is user info in it)
    // then get the user info from the user_primary_id or user_id or primary_id field and extract the address from the response
    user_id : string = '';
    senders_address : string = '';

    partners$ = (entities: Entity[]) => {

        let calls = entities.filter(entity => [EntityType.LOAN].includes(entity.type))
            .map(entity => this.partnerAddressFromLoan(entity.link));
        return (calls.length === 0) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err)),
                // map(users => users.map((user, index) => this.userFromAlmaUser(user, index))),
            );
    };


    private partnerAddressFromLoan = (link) => this.getLoanFromAlma(link).pipe(
        tap(loan => console.log('step 2: ', loan)),
        // tap(result => result.location_code.name === 'Borrowing Resource Sharing Requests'?this.getPartnerAddress(result.request_id.link):''),
        filter(loan => loan.location_code.name === 'Borrowing Resource Sharing Requests'),
        tap(loan => this.user_id = loan.user_id),
        switchMap(loan => this.getRequestFromLoan(loan)),
        tap(loan => this.senders_address = loan.pickup_location),
        tap(request => console.log('step 3: ', request)),
        switchMap(request => this.getResourceSharingRequestFromRequest(request.resource_sharing.id)),
        tap(request => console.log('step 4: ', request)),
        switchMap(resourceSharingRequest => this.getPartnerFromResourceSharingRequest(resourceSharingRequest)),
        tap(request => console.log('step 5: ', request, request.partner_details.name)),
        map(partner => this.partnerFromAlmaPartner(partner)),
        // tap(request => console.log('step 6: ', request.contact_info.address[0]))
    );

    // private getPartnerAddress = (link) => {
    //     console.log(link);
    //     this.getRequestFromAlma(link).subscribe(
    //         result => console.log(result),
    //         err => console.log(err.message)
    //     );
    // };

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
    private getRequestFromLoan = loan => {
        return this.restService.call(loan.request_id.link);
        // res.user_id = loan.user_id;
        //
        // return {
        //     user_id: loan.user_id
        // }
    };
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
