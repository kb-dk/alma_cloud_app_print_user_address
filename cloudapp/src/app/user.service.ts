import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService, Entity, EntityType} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, iif, throwError} from "rxjs";
import {catchError, map, switchMap} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})

export class UserService {

    // To get the user address from the page entities
    // there is the need for two more API call (There might be other ways)
    // get the requests from the link string in the entity object (if there is user info in it)
    // then get the user info from the user_primary_id or user_id or primary_id field and extract the address from the response
    users$ = (entities: Entity[]) => {

        let calls = entities.filter(entity => [EntityType.LOAN, EntityType.USER, EntityType.REQUEST].includes(entity.type))
            .map(entity => {
                switch (entity.type) {
                    case EntityType.LOAN:
                        return this.userFromLoan(entity.link);
                    case EntityType.REQUEST:
                        return this.userFromRequest(entity.link);
                    case EntityType.USER:
                        return this.getRequestFromAlma(entity.link);
                }
            });
        return (calls.length === 0) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err)),
                map(users => users.map((user, index) => this.userFromAlmaUser(user, index))),
            );
    };

    private userFromLoan = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(loan => this.getRequestFromAlma(`/users/${loan.user_id}`))
    );

    private userFromRequest = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.user_primary_id !== undefined,
            this.getRequestFromAlma(`/users/${request.user_primary_id}`),
            of(null)
        ))
    );

    constructor(private restService: CloudAppRestService) {
    }

    private userFromAlmaUser = (almaUser, index) => almaUser === null ?
        {id: index, name: 'N/A', addresses: []} :
        {
            id: index,
            name: almaUser.full_name.search('null ') === 0 ? almaUser.full_name.replace('null ', '') : almaUser.full_name,
            addresses: almaUser.contact_info.address.map(
                address => ({
                    type: address.address_type[0].value,
                    address: this.convertToPrintableAddress(address)
                })
            ),
            selectedAddress: almaUser.contact_info.address.some(address => address.preferred === true)
                ? almaUser.contact_info.address.find(address => address.preferred === true).address_type[0].value
                : almaUser.contact_info.address.length > 0 ? almaUser.contact_info.address[0].address_type[0].value : 'none',
            checked: false
        };

    private getRequestFromAlma = link => this.restService.call(link);

    private convertToPrintableAddress = (addressObj: Address) => {
        let neededFields = {
            address: ['line1', 'line2', 'line3', 'line4', 'line5'],
            city: ['city', 'state_province', 'postal_code']
        };
        let address: string = '';
        neededFields.address.map(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = address + '<br/>';
        neededFields.city.map(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = addressObj.country.desc ? address.concat(addressObj.country.desc) : address;
        return address;
    };

    private handleError = (err: any) => {
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
            // A client-side or network error occurred.
            errorMessage = `An error occurred: ${err.error.message}`;
        } else {
            // The backend returned an unsuccessful response code.
            errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
        }
        console.error(err);
        return throwError(errorMessage);
    };
}
