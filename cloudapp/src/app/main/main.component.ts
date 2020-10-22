import {BehaviorSubject, combineLatest, EMPTY, Subject, Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { UserService } from '../user.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    Entity,
    PageInfo,
} from '@exlibris/exl-cloudapp-angular-lib';
import {User} from "../user";
import {catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy{

    private numRecordsToPrint: number = 0;
    private currentState;
    private pageLoadSubscription:Subscription;

    private pageEntitiesSubject = new Subject<Entity[]>();
    pageLoadAction$ = this.pageEntitiesSubject.asObservable().pipe(
        concatMap(entities => this.userService.usersAddress$(entities)),
        tap(currentInfo => this.currentState = currentInfo)
    );

    private clickedUserNameSubject = new BehaviorSubject<{id:number, checked:boolean}>({id:-1, checked:false});
    clickedUserNameAction$ = this.clickedUserNameSubject.asObservable();

    private clickedAddressSubject = new BehaviorSubject<{id:number, value:string}>({id:-1, value:''});
    clickedAddressAction$ = this.clickedAddressSubject.asObservable();

    userAddressWithPrintInfo$ = combineLatest([
        this.pageLoadAction$,
        this.clickedUserNameAction$,
        this.clickedAddressAction$
    ])
        .pipe(
            map(([users, selectedUser, selectedAddressType]) =>
                users.map((user, requestIndex) => ({
                    ...user,
                    selectedAddress: user.id === selectedAddressType.id? selectedAddressType.value :this.currentState[requestIndex].selectedAddress,
                    checked: user.id === selectedUser.id? selectedUser.checked:this.currentState[requestIndex].checked,
                }) as User),
                toArray(),
            ),
            tap(currentInfo => this.currentState = currentInfo),
            catchError(err => EMPTY),
        );

    constructor(private restService: CloudAppRestService,
                private eventsService: CloudAppEventsService,
                private userService: UserService
    ) {
    }

    ngOnInit(): void {
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);
    }

    ngOnDestroy(): void {
        this.pageLoadSubscription.unsubscribe();
    }

    onPageLoad = (pageInfo: PageInfo) => {
        this.pageEntitiesSubject.next(pageInfo.entities);
    };

    onUserToggled = (e) => {
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
        this.clickedUserNameSubject.next({id:e.source.value, checked: e.checked});
    };

    onAddressSelected = (e) => {
         let selectedId, selectedAddressType;
        [selectedId, selectedAddressType] = e.source.value.split('_');
        this.clickedAddressSubject.next({id:+selectedId, value:selectedAddressType});
    };

    onPrint = () => {
        let innerHtml: string = "";
        let printButton: string = "Print";

        console.log(typeof this.currentState);
        this.currentState.map(userInfo => {
            if (userInfo.checked) {
                innerHtml = innerHtml + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo.addresses.find(address => address.type === userInfo.selectedAddress).address + '</p></div>';
            }
        });

        let content = "<html>";
        content += "<style>";
        content += "@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}";
        content += "</style>";
        content += "<body onload='window.print()'>";
        content += "<button class='hidden-print' onclick='window.print()'>";
        content += printButton;
        content += "</button>";
        content += innerHtml;
        content += "</body>";
        content += "</html>";

        var win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };

    onClear = () => {
        this.numRecordsToPrint = 0;
        this.currentState.map(userInfo => {
            userInfo.checked = false;
        });
    };
}
