import {Injectable} from '@angular/core';
import {AddressFormats} from "../config/address-format";
import {CloudAppConfigService, CloudAppRestService, Entity, EntityType,} from "@exlibris/exl-cloudapp-angular-lib";
import {forkJoin, iif, Observable, of, throwError} from "rxjs";
import {catchError, map, switchMap, tap} from "rxjs/operators";
import {ToolboxService} from "./toolbox.service";
import {AlmaRequest, AlmaUser} from "./interfaces";

@Injectable({
    providedIn: 'root'
})

export class UserService {

    addressFormat = AddressFormats['1'];
    showCountry : boolean = true;
    showRecipient : boolean = true;
    // To get the user address from the page entities
    // there is the need for two more API call (There might be other ways)
    // get the requests from the link string in the entity object (if there is user info in it)
    // then get the user info from the user_primary_id or user_id or primary_id field and extract the address from the response
    users$ = (entities: Entity[]) => {

        let config = this.configService.get().pipe(
            map(config => this.toolboxService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.addressFormat = config.addressFormat.addresses[config.addressFormat.default]),
            tap(config => this.showCountry = config.addressFormat.showCountry),
            tap(config => this.showRecipient = config.addressFormat.showRecipient),
            catchError(err => this.handleError(err))
        );

        let calls = entities.filter(entity => [EntityType.VENDOR, EntityType.LOAN, EntityType.USER, EntityType.REQUEST, EntityType.BORROWING_REQUEST].includes(entity.type))
            .map(entity => {
                switch (entity.type) {
                    case EntityType.LOAN:
                        return this.userFromLoan(entity.link);
                    case EntityType.REQUEST:
                        return this.userFromRequest(entity.link);
                    case EntityType.BORROWING_REQUEST:
                        return this.userFromBorrowingRequest(entity.link);
                    case EntityType.USER:
                    case EntityType.VENDOR:
                        return this.userOrVendorFromAlma(entity.link);
                }
            });
        // TODO Find a better way to ensure having the config before piping the addresses into partnerAddressFromLoan
        calls.push(config); // Pushing the config into array of observables
        return (calls.length === 1) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err)),
                tap(users => users.pop()), // Pulling the config off of the array of results
                map(users => users.map((user, index) => this.toolboxService.userFromAlmaUser(this.addressFormat, this.showCountry, user, index))),
            );
    };

    private userFromBorrowingRequest = (link) => this.getBorrowingRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.requester !== null,
            this.userFromAlma(`/users/${request.requester.value}`),
            of(null),
        ))
    );

    private userFromLoan = (link) => this.getLoanFromAlma(link).pipe(
        switchMap(loan => this.userFromAlma(`/users/${loan.user_id}`))
    );

    private userFromRequest = (link) => this.requestFromAlma(link).pipe(
        switchMap((request): Observable<AlmaRequest> => iif(() => ('user_primary_id' in request && request.user_primary_id !== null),
            this.userFromAlma(`/users/${request.user_primary_id}`),
            of(null)
        ))
    );

    private requestFromAlma = (link): Observable<AlmaRequest> => this.restService.call(link);

    private userFromAlma = (link): Observable<AlmaUser> => this.restService.call(link);

    private getBorrowingRequestFromAlma = (link) => {
        if (this.userNotNull(link)){
            return this.restService.call(link);
        } else {
            return of(null);
        }
    }

    private getLoanFromAlma = (link) => this.restService.call(link);

    private userOrVendorFromAlma = (link): Observable<AlmaUser> => this.restService.call(link);

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private toolboxService: ToolboxService,
    ) {}

    private userNotNull = (link) => !link.includes("/users/null/");
}
