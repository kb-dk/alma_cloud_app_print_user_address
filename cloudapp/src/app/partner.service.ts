import {Injectable} from '@angular/core';
import {CloudAppConfigService, CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, throwError} from "rxjs";
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";
import {AddressFormats} from "./config/address-format";
import {FixConfigService} from "./fix-config.service";
import {ConvertService} from "./convert.service";

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
        map(partner => this.convertService.partnerFromAlmaPartner(this.addressFormat, this.showCountry, partner, this.senders_address)),
    );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private fixConfigService: FixConfigService,
                private convertService: ConvertService,
    ){}

    private getLoanFromAlma = link => this.restService.call(link);

    private getRequestFromLoan = loan => this.restService.call(loan.request_id.link);

    private getResourceSharingRequestFromRequest = id => this.restService.call(`/users/${this.user_id}/resource-sharing-requests/${id}`);

    private getPartnerFromResourceSharingRequest = resourceSharingRequest => this.restService.call(resourceSharingRequest.partner.link);

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };
}
