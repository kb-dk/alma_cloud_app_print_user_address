import { BehaviorSubject, combineLatest, EMPTY, Subject, Subscription} from 'rxjs';
import { Component, OnDestroy, OnInit} from '@angular/core';
import { UserService } from '../user.service';
import { CloudAppEventsService, CloudAppRestService, Entity, PageInfo} from '@exlibris/exl-cloudapp-angular-lib';
import { User} from "../user";
import { catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy{

    numRecordsToPrint: number = 0;
    pageLoaded: boolean = false;
    private currentUserActions;
    private pageLoadSubscription:Subscription;
    private pageLoadedSubject = new Subject<Entity[]>();

    pageLoadedAction$ = this.pageLoadedSubject.asObservable().pipe(
        concatMap(entities => this.userService.users$(entities)),
        tap(currentUserAction => this.currentUserActions = currentUserAction),
        tap(() => this.pageLoaded=true),
    );

    private userToggledSubject = new BehaviorSubject<{id:number, checked:boolean}>({id:-1, checked:false});
    userToggledAction$ = this.userToggledSubject.asObservable();

    private addressSelectedSubject = new BehaviorSubject<{id:number, value:string}>({id:-1, value:''});
    addressSelectedAction$ = this.addressSelectedSubject.asObservable();

    userActions$ = combineLatest([
        this.pageLoadedAction$,
        this.userToggledAction$,
        this.addressSelectedAction$
    ])
        .pipe(
            map(([users, selectedUser, selectedAddressType]) =>
                users.map((user, requestIndex) => ({
                    ...user,
                    selectedAddress: user.id === selectedAddressType.id? selectedAddressType.value :this.currentUserActions[requestIndex].selectedAddress,
                    checked: user.id === selectedUser.id? selectedUser.checked:this.currentUserActions[requestIndex].checked,
                }) as User),
                toArray(),
            ),
            tap(currentUserActions => this.currentUserActions = currentUserActions),
            catchError(err => EMPTY),
        );

    constructor(private restService: CloudAppRestService, private eventsService: CloudAppEventsService, private userService: UserService) { }

    ngOnInit(): void {
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);
    }

    ngOnDestroy(): void {
        this.pageLoadSubscription.unsubscribe();
    }

    onPageLoad = (pageInfo: PageInfo) => {
        this.onClear();
        this.pageLoaded = false;
        this.userService.usersRowNumber = [];
        this.pageLoadedSubject.next(pageInfo.entities);
    };

    onClear = () => {
        this.numRecordsToPrint = 0;
        this.addressSelectedSubject.next({id:-1, value:''});
        this.userToggledSubject.next({id:-1, checked: false});
        if (typeof this.currentUserActions !== 'undefined') {
            this.currentUserActions.map(user => {
                user.checked = false;
            });
        }
    };

    onUserToggled = (e) => {
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
        this.userToggledSubject.next({id:e.source.value, checked: e.checked});
    };

    onAddressSelected = (e) => {
         let selectedId, selectedAddressType;
        [selectedId, selectedAddressType] = e.source.value.split('_');
        this.addressSelectedSubject.next({id:+selectedId, value:selectedAddressType});
    };

    onPrint = () => {
        let innerHtml: string = "";

        this.currentUserActions.map(user => {
            if (user.checked) {
                innerHtml =  innerHtml.concat(
                 `<div class='pageBreak'>
                      <p>${user.name}</p>
                      <p>${user.addresses.find(address => address.type === user.selectedAddress).address}</p>
                  </div>`);
            }
        });

        let content = `<html>
                       <style>@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}</style>
                           <body onload='window.print()'>
                               <button class='hidden-print' onclick='window.print()'>print</button>
                               ${innerHtml}
                           </body>
                       </html>`;

        let win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };
}
