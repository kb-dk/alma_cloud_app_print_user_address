import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService, Entity} from "@exlibris/exl-cloudapp-angular-lib";
import {from, throwError} from "rxjs";
import {catchError, concatMap, filter, map, toArray} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})

export class UserService {
    private usersRowNumber:number[]=[]; // Keeps the record number in the page

    // To get the user address from the page entities
    // there is the need for two more API call (There might be other ways)
    // get the requests from the link string in the entity object (if there is user info in it)
    // then get the user info from the user_primary_id or user_id field and extract the address from the response
    users$ = (entities: Entity[]) => {
        this.saveUsersRowNumber(entities);
        return from(entities).pipe(
            catchError(err => this.handleError(err)),
            concatMap(entity => this.getAlmaRequest(entity)),
            concatMap(request => this.getAlmaUser(request)),
            map((almaUser, index) => this.extractUserFromAlmaUser(almaUser, index)),
            toArray()
        );
    };

    constructor(private restService: CloudAppRestService){}

    private saveUsersRowNumber = (entities) =>  entities.map((entity, index)=> {
            if (entity.link.includes('users')) {
                this.usersRowNumber.push(index);
            }
        });

    private getAlmaRequest = (entity: Entity) => from([entity]).pipe(
        filter(entity => this.returnIfUser(entity)),
        map(entity => entity.link),
        concatMap(link => this.getRequestFromAlma(link))
    );

    private getAlmaUser = (request) => from([request]).pipe(
        filter(request => this.returnIfUserIdExists(request)),
        map(request => request.hasOwnProperty('user_primary_id') ? request.user_primary_id : request.user_id),
        concatMap(id => this.getUserFromAlma(id))
    );

    private returnIfUserIdExists = (request) =>  request.hasOwnProperty('user_primary_id') || request.hasOwnProperty('user_id');

    private returnIfUser = (entity) => entity.link.includes('users');

    private extractUserFromAlmaUser = (almaUser, index) => {
        return {
            id: this.usersRowNumber[index],
            name: almaUser.full_name.search('null ')==0?almaUser.full_name.replace('null ', ''):almaUser.full_name,
            addresses: almaUser.contact_info.address.map(
                address => ({
                    type: address.address_type[0].value,
                    address: this.convertToPrintableAddress(address)
                })
            ),
            selectedAddress: almaUser.contact_info.address.find(address => address.preferred == true).address_type[0].value,
            checked: false
        };
    };

    private getRequestFromAlma = link => this.restService.call(link);

    private getUserFromAlma = id => this.restService.call(`/users/${id}`);

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
