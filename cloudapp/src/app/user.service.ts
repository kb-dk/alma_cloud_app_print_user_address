import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService, Entity} from "@exlibris/exl-cloudapp-angular-lib";
import {from, throwError} from "rxjs";
import {catchError, concatMap, filter, map, toArray} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private requestIndexes:number[]=[];

    usersAddress$ = (entities: Entity[]) => {
        return from(entities).pipe(
            catchError(err => this.handleError(err)),
            filter((entity, index) => this.returnIfUser(entity, index)),
            map(entity => entity.link),
            concatMap(link => this.getRequest(link)),
            filter(userRequestInfo => this.returnIfUserIdExists(userRequestInfo)),
            map(userRequestInfo => userRequestInfo.hasOwnProperty('user_primary_id') ? userRequestInfo.user_primary_id : userRequestInfo.user_id),
            concatMap(id => this.getUser(id)),
            map((userInfo, index) => this.convertUserInfoToAddress(userInfo, index)),
            toArray(),
        );

    };

    constructor(
        private restService: CloudAppRestService,
    ){}

    private returnIfUserIdExists = (userRequestInfo) =>  userRequestInfo.hasOwnProperty('user_primary_id') || userRequestInfo.hasOwnProperty('user_id');

    private returnIfUser = (entity, index) => {
        if (entity.link.includes('users')) {
            this.requestIndexes.push(index);
            return true;
        } else {
            return false;
        }
    };

    private convertUserInfoToAddress = (userInfo, index) => {
        return {
            id: this.requestIndexes[index],
            name: userInfo.full_name.search('null ')==0?userInfo.full_name.replace('null ', ''):userInfo.full_name,
            addresses: userInfo.contact_info.address.map(
                address => ({
                    type: address.address_type[0].value,
                    address: this.convertToPrintableAddress(address)
                })
            ),
            selectedAddress: userInfo.contact_info.address.find(address => address.preferred == true).address_type[0].value,
            checked: false
        };
    };

    private getRequest = link => this.restService.call(link);

    private getUser = id => this.restService.call(`/users/${id}`);

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