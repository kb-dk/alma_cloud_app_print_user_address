import {BehaviorSubject, combineLatest, EMPTY, Subject, Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../user.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    Entity,
    PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';
import {User} from "../user";
import {catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy {

    numRecordsToPrint: number = 0;
    pageLoaded: boolean = false;
    logoUrl: string = '';
    printLogo: boolean = true;

    private currentUserActions;
    private pageLoadSubscription: Subscription;
    private pageMetadataSubscription: Subscription;
    private pageLoadedSubject = new Subject<Entity[]>();

    pageLoadedAction$ = this.pageLoadedSubject.asObservable().pipe(
        concatMap(entities => this.userService.users$(entities)),
        tap(currentUserAction => this.currentUserActions = currentUserAction),
        tap(() => this.pageLoaded = true),
    );

    private userToggledSubject = new BehaviorSubject<{ id: number, checked: boolean }>({id: -1, checked: false});
    userToggledAction$ = this.userToggledSubject.asObservable();

    private addressSelectedSubject = new BehaviorSubject<{ id: number, value: string }>({id: -1, value: ''});
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
                        selectedAddress: user.id === selectedAddressType.id ? selectedAddressType.value : this.currentUserActions[requestIndex].selectedAddress,
                        checked: user.id === selectedUser.id ? selectedUser.checked : this.currentUserActions[requestIndex].checked,
                    }) as User),
                toArray(),
            ),
            tap(currentUserActions => this.currentUserActions = currentUserActions),
            catchError(error => {
                console.log('Error getting user action:', error);
                return EMPTY;
            }),
        );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private eventsService: CloudAppEventsService,
                private userService: UserService) {
    }

    ngOnInit(): void {
        this.pageMetadataSubscription = this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);

        this.configService.get().subscribe(
            config => this.logoUrl = config.logo,
            err => console.log(err.message));
    }

    ngOnDestroy(): void {
        this.pageLoadSubscription.unsubscribe();
        this.pageMetadataSubscription.unsubscribe();
    }

    onPageLoad = (pageInfo: PageInfo) => {
        this.onClear();
        this.pageLoaded = false;
        this.pageLoadedSubject.next(pageInfo.entities);
    };

    onPrintLogoToggled = (e) => {
        this.printLogo = e.checked;
    };

    onClear = () => {
        this.numRecordsToPrint = 0;
        this.addressSelectedSubject.next({id: -1, value: ''});
        this.userToggledSubject.next({id: -1, checked: false});
        if (typeof this.currentUserActions !== 'undefined') {
            this.currentUserActions.map(user => {
                user.checked = false;
            });
        }
    };

    onUserToggled = (e) => {
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
        this.userToggledSubject.next({id: e.source.value, checked: e.checked});
    };

    onAddressSelected = (e) => {
        let selectedId, selectedAddressType;
        [selectedId, selectedAddressType] = e.source.value.split('_');
        this.addressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
    };

    onPrint = () => {
        let innerHtml: string = "";

        this.currentUserActions.map(user => {
            if (user.checked) {
                let logo = this.printLogo&&this.logoUrl?`<div style="float: right; width: 25%"><img src="${this.logoUrl}" style="max-width: 100%;"/></div>`:'';
                innerHtml = innerHtml.concat(
                    `<div class='pageBreak'>
                      ${logo}  
                      <br/><br/><br/>
                      <p>${user.name}<br/>
                      ${user.addresses.find(address => address.type === user.selectedAddress).address}</p>
                  </div>`);
            }
        });

        let content = `<html>
                       <style>@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}</style>
                           <body onload='window.print();' style="font-size:80%; font-family: sans-serif; font-weight:600;">
                               ${innerHtml}
                           </body>
                       </html>`;

        let win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };
}
