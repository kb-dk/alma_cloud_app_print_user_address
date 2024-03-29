import {Injectable} from '@angular/core';
import {CloudAppConfigService, CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {forkJoin, Observable, of, throwError} from "rxjs";
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";
import {AddressFormats} from "../config/address-format";
import {ToolboxService} from "./toolbox.service";
import {AlmaPartner} from "./interfaces";

@Injectable({
    providedIn: 'root'
})

export class PartnerService {
    user_id : string = '';
    senders_address : string = '';
    addressFormat = AddressFormats['1'];
    showCountry = true;
    showRecipient = true;


    partners$ = (entities: Entity[]) => {
        let config = this.configService.get().pipe(
            map(config => this.toolboxService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.addressFormat = config.addressFormat.addresses[config.addressFormat.default]),
            tap(config => this.showCountry = config.addressFormat.showCountry),
            tap(config => this.showRecipient = config.addressFormat.showRecipient),
            catchError(err => this.handleError(err))
        );
        let calls = entities.filter(entity => [EntityType.LOAN,  EntityType.LENDING_REQUEST, EntityType.BORROWING_REQUEST, EntityType.PARTNER].includes(entity.type))
            .map(
                entity => {
                    switch (entity.type) {
                        case EntityType.LOAN:
                            return this.partnerAddressFromLoan(entity.link);
                        case EntityType.BORROWING_REQUEST:
                        case EntityType.LENDING_REQUEST:
                            return this.partnerAddressFromBorrowingOrLendingRequest(entity.link);
                        case EntityType.PARTNER:
                            return this.getPartnerFromAlma(entity.link);
                    }
                });

        // TODO Find a better way to ensure having the config before piping the addresses into partnerAddressFromLoan
        calls.push(config); // Pushing the config into array of observables
        return (calls.length === 1) ?
            of([]) :
            forkJoin(calls).pipe(
                tap(partners => partners.pop()),// Pulling the config off of the array of results
                map(partners => partners.map((partner, index) => this.toolboxService.partnerFromAlmaPartner(this.addressFormat, this.showCountry, partner, this.senders_address, index))),
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
    );

    private partnerAddressFromBorrowingOrLendingRequest = (link) => this.getLoanFromAlma(link).pipe(
        switchMap(loan => this.getPartnerFromResourceSharingRequest(loan)),
    );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private toolboxService: ToolboxService,
    ){}

    private getPartnerFromAlma = (link): Observable<AlmaPartner> => this.restService.call(link);

    private getLoanFromAlma = (link) => this.restService.call(link);

    private getRequestFromLoan = loan => this.restService.call(loan.request_id.link);

    private getResourceSharingRequestFromRequest = id => this.restService.call(`/users/${this.user_id}/resource-sharing-requests/${id}`);

    private getPartnerFromResourceSharingRequest = resourceSharingRequest =>
    {
        if (resourceSharingRequest.partner === null){
            return of(null);
        }
        return this.restService.call(resourceSharingRequest.partner.link);};

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };
}
