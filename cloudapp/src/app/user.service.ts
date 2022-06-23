import {Injectable} from '@angular/core';
import {AddressFormats} from "./config/address-format";
import {ConvertService} from "./convert.service";
import {FixConfigService} from "./fix-config.service";
import {CloudAppConfigService, CloudAppRestService, Entity, EntityType,} from "@exlibris/exl-cloudapp-angular-lib";
import {forkJoin, iif, of, throwError} from "rxjs";
import {catchError, map, switchMap, tap} from "rxjs/operators";

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
            map(config => this.fixConfigService.fixOldOrEmptyConfigElements(config)),
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
                    case EntityType.USER:
                        return this.getRequestFromAlma(entity.link);
                    case EntityType.BORROWING_REQUEST:
                        return this.getRequesterFromAlma(entity.link);
                    case EntityType.VENDOR:
                        return this.getRequestFromAlma(entity.link);
                }
            });
        // TODO Find a better way to ensure having the config before piping the addresses into partnerAddressFromLoan
        calls.push(config); // Pushing the config into array of observables
        return (calls.length === 1) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err)),
                tap(users => users.pop()), // Pulling the config off of the array of results
                map(users => users.map((user, index) => this.convertService.userFromAlmaUser(this.addressFormat, this.showCountry, user, index))),
            );
    };

    private getRequesterFromAlma = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.requester !== null,
            this.getRequestFromAlma(`/users/${request.requester.value}`),
            of(null),
        ))
    );

    private userFromLoan = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(loan => this.getRequestFromAlma(`/users/${loan.user_id}`))
    );

    private userFromRequest = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.user_primary_id !== undefined,
            this.getRequestFromAlma(`/users/${request.user_primary_id}`),
            of(null)
        ))
    );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private fixConfigService: FixConfigService,
                private convertService: ConvertService,
    ) {
    }

    private getRequestFromAlma = link => this.restService.call(link);

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };
}
