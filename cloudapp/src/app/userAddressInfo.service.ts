import {Injectable} from '@angular/core';
import {Address} from "./address";
import {CloudAppRestService} from "@exlibris/exl-cloudapp-angular-lib";
import {from, throwError} from "rxjs";
import {catchError, concatMap, filter, map, tap, toArray} from "rxjs/operators";
import {pageEntity} from "./pageEntity";

@Injectable({
    providedIn: 'root'
})
export class UserAddressInfoService {
    private index:number[]=[];

    usersAddress$ = (entities: pageEntity[]) => {
        return from(entities).pipe(
            catchError(err => this.handleError(err)),
            filter((entity, index) => {
                if (entity.link.includes('users')){
                    this.index.push(index);
                    return true;
                }else{
                    return false;
                }
            }),
            map(entity => entity.link),
            concatMap(link => this.getUserRequestInfo(link)),
            filter(userRequestInfo => userRequestInfo.hasOwnProperty('user_primary_id') || userRequestInfo.hasOwnProperty('user_id')),
            map(userRequestInfo => userRequestInfo.hasOwnProperty('user_primary_id') ? userRequestInfo.user_primary_id : userRequestInfo.user_id),
            concatMap(id => this.getUserInfo(id)),
            map((userInfo, index) => {
                return {
                    id: this.index[index],
                    name: userInfo.full_name.search('null ')==0?userInfo.full_name.replace('null ', ''):userInfo.full_name,
                    addresses: userInfo.contact_info.address.map(
                        address => ({
                            type: address.address_type[0].value,
                            address: this.getAddress(address)
                        })
                    ),
                    desiredAddress: userInfo.contact_info.address.find(address => address.preferred == true).address_type[0].value,
                    checked: false
                };
            }),
            toArray(),
            tap(i => console.log(this.index, i)),
        );
    };

    constructor(
        private restService: CloudAppRestService,
    ) {
    }

    private getUserRequestInfo = link => this.restService.call(link);

    private getUserInfo = id => this.restService.call(`/users/${id}`);

    private getAddress = (addressObj: Address) => {
        let desiredFields = {
            address: ['line1', 'line2', 'line3', 'line4', 'line5'],
            city: ['city', 'state_province', 'postal_code']
        };
        let address: string = '';
        desiredFields.address.map(field => {
            address = addressObj[field] ? address.concat(addressObj[field]).concat(' ') : address;
        });
        address = address + '<br/>';
        desiredFields.city.map(field => {
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
