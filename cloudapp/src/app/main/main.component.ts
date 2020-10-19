import {BehaviorSubject, combineLatest, EMPTY, from, Observable, Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {UserAddressInfoService} from '../userAddressInfo.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    Entity,
    PageInfo,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserAddressInfo} from "../userAddressInfo";
import {catchError, concatMap, filter, map, mergeMap, switchMap, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent {

    private numRecordsToPrint: number = 0;

    usersAddress$ = this.eventsService.getPageMetadata()
        .pipe(
            map(pageInfo => pageInfo.entities),
            concatMap(entities => this.userAddressInfoService.usersAddress$(entities)),
            toArray(),
        );

    private clickedUserNameSubject = new BehaviorSubject<number>(-1);
    clickedUserNameAction$ = this.clickedUserNameSubject.asObservable();

    private clickedAddressSubject = new BehaviorSubject<[number, string]>([-1, '']);
    clickedAddressAction$ = this.clickedAddressSubject.asObservable();

    userAddressWithPrintInfo$ = combineLatest([
        this.usersAddress$,
        this.clickedUserNameAction$,
        this.clickedAddressAction$
    ])
        .pipe(
            map(([usersAddress, selectedUserId, selectedUserIdAndAddressType]) =>
                usersAddress.map(userAddress => ({
                    ...userAddress,
                    desiredAddress: userAddress.id === selectedUserIdAndAddressType[0]? userAddress.desiredAddress = selectedUserIdAndAddressType[1] :userAddress.desiredAddress,
                    checked: userAddress.id === selectedUserId? !userAddress.checked:userAddress.checked,
                }) as UserAddressInfo),
                toArray(),
            ),
            tap(),
            tap(i => console.log(i)),
            catchError(err => EMPTY),
        );

    constructor(private restService: CloudAppRestService,
                private eventsService: CloudAppEventsService,
                private toastr: ToastrService,
                private userAddressInfoService: UserAddressInfoService
    ) {
    }

    onUserNameClick = (e) => {
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
        this.clickedUserNameSubject.next(+e.source.value);
    };

    onAddressClick = (e) => {
         let id, addressType;
        [id, addressType] = e.source.value.split('_');
        this.clickedAddressSubject.next([+id, addressType]);
    };

    // innerHtml$ = this.usersAddress$.pipe(
    //     tap(items=> console.log('innerhtml:',items)),
    //     map(usersInfo => usersInfo.filter(userInfo => userInfo.checked)),
    //     map(usersInfo => usersInfo.map( userInfo =>
    //         this.innerHtml$ + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + "</p></div>"
    //     )),
    // );



    onPrintPreviewNewTab = () => {
        let innerHtml: string = "";
        let printButton: string = "Print";

        // this.usersAddress$.forEach(userInfo => {
        //     if (userInfo.checked) {
        //         innerHtml = innerHtml + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + '</p></div>';
        //     }
        // });
        var content = "<html>";
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

    onClearSelected = () => {
        // this.numRecordsToPrint = 0;
        // this.usersAddress$.forEach(userInfo => {
        //     userInfo.checked = false;
        // });
    };
}
