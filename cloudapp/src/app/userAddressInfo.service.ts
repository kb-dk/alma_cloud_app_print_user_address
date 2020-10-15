import {Injectable} from '@angular/core';
import {Address} from "./address";
import {UserAddressInfo} from "./userAddressInfo";
import {CloudAppRestService, PageInfo} from "@exlibris/exl-cloudapp-angular-lib";
import {EMPTY, from, Observable, throwError} from "rxjs";
import {catchError, filter, map, mergeMap, pluck, tap, toArray} from "rxjs/operators";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {pageEntity} from "./pageEntity";

@Injectable({
    providedIn: 'root'
})
export class UserAddressInfoService {

    constructor(
        private restService: CloudAppRestService,
    ) {
    }

    usersAddress$ = (entities: pageEntity[]) => from(entities).pipe(
        catchError(err => this.handleError(err)),
        filter(entity => entity.link.includes('users')),
        map(entity => entity.link),
        map((link, index) => this.getUserInfoFromLink(link, index)),
        toArray()
    );

    private getUserInfoFromLink = (link, index) => {
        let user: UserAddressInfo = this.emptyUserInfo();
        user.id = index;
        this.getUserRequestInfo(link).subscribe(response => {
            let id = '';
            id = (response.hasOwnProperty('user_primary_id')) ? response.user_primary_id : id;
            id = (response.hasOwnProperty('user_id')) ? response.user_id : id;

            if (id !== '') {
                this.getUserInfo(id).subscribe(response => {
                    if (response.full_name || []) {
                        user.name = response.full_name;
                    }
                    
                    response.contact_info.address.map(address => {
                        let address_type = address.address_type[0].value + 'Address';
                        if (address.preferred) {
                            user.desiredAddress = address_type;
                        }
                        user[address_type] = this.getAddress(address);
                    });
                });
            }
        });
        return user;
    };

    private getUserRequestInfo = link => this.restService.call(link);

    private getUserInfo = id => this.restService.call(`/users/${id}`);

    private getAddress = (addressObj: Address) => {
        let desiredFields = {
            "address": ['line1', 'line2', 'line3', 'line4', 'line5'],
            "city": ['city', 'state_province', 'postal_code']
        };
        let address: string = '';
        desiredFields.address.forEach(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = address + '<br/>';
        desiredFields.city.forEach(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = addressObj.country.desc ? address.concat(addressObj.country.desc) : address;
        return address;
    };

    private emptyUserInfo = () => {
        return {
            "id": 0,
            "name": "",
            "homeAddress": "",
            "workAddress": "",
            "alternativeAddress": "",
            "desiredAddress": "home",
            "checked": false
        };
    };

    private handleError = (err: any) => {
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            errorMessage = `An error occurred: ${err.error.message}`;
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
        }
        console.error(err);
        return throwError(errorMessage);
    };
}
