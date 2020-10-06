import {Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserAddressInfoService} from '../userAddressInfo.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    Entity,
    PageInfo,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserAddressInfo} from "../userAddressInfo";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

    private numRecordsToPrint: number = 0;

    private pageLoad$: Subscription;
    pageEntities: Entity[];
    private _apiResult: any;

    hasApiResult: boolean = false;
    private usersInfo: UserAddressInfo[] = [];

    constructor(private restService: CloudAppRestService,
                private eventsService: CloudAppEventsService,
                private toastr: ToastrService,
                private userAddressInfoService: UserAddressInfoService
    ) {
    }

    ngOnInit() {
        this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
    }

    ngOnDestroy = () => {
        this.pageLoad$.unsubscribe();
    };

    onListChanged = (e) => {
        this.usersInfo[e.source.value].checked = e.checked;
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
    };

    onAddressChanged = (e) => {
        let id, addressType;
        [id, addressType] = e.source.value.split('_');
        this.usersInfo[id].desiredAddress = addressType;
    };

    onPrintPreviewNewTab = () => {
        console.log('hej');
        let innerHtml: string = "";
        let printButton: string = "Print";
        this.usersInfo.forEach(userInfo => {
            if (userInfo.checked) {
                innerHtml = innerHtml + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + '</p></div>';
            }
        });
        var content = "<html>";
        content += "<style>";
        content += "@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}";
        content += "</style>";
        content += "<body>";
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
        this.numRecordsToPrint = 0;
        this.usersInfo.forEach(userInfo => {
            userInfo.checked = false;
        });
    };

    onPageLoad = (pageInfo: PageInfo) => {
        this.pageEntities = pageInfo.entities;
        this.usersInfo = this.userAddressInfoService.getUsersInfo(this.pageEntities);
    };
}
