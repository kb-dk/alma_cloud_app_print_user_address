import {Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {UserAddressInfoService} from '../userAddressInfo.service';
import {
  CloudAppEventsService,
  CloudAppRestService,
  Entity,
  HttpMethod,
  PageInfo,
  Request,
  RestErrorResponse
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserAddressInfo} from "../userAddressInfo";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private numRecordsToPrint: number = 0;
  private userInfoHash: UserAddressInfo;

  private pageLoad$: Subscription;
  pageEntities: Entity[];
  private _apiResult: any;

  hasApiResult: boolean = false;
  loading = false;
  private usersInfo: UserAddressInfo[] = [];

  constructor(private restService: CloudAppRestService,
              private eventsService: CloudAppEventsService,
              private toastr: ToastrService,
              private userInfoService: UserAddressInfoService
  ) {
  }

  ngOnInit() {
    this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  onListChanged(e) {
    this.usersInfo[e.source.value].checked = e.checked;
    this.numRecordsToPrint = (e.checked)?this.numRecordsToPrint + 1:this.numRecordsToPrint - 1;
  }

  onAddressChanged(e) {
    let id, addressType;
    [id, addressType] = e.source.value.split('_');
    this.usersInfo[id].desiredAddress = addressType;
  }

  onPrintPreviewNewTab() {
    console.log('hej');
    let innerHtml: string = "";
    let printButton: string = "Print";
    this.usersInfo.forEach(userInfo => {
      if(userInfo.checked){
        innerHtml = innerHtml + "<div class='pageBreak'><p>"+ userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + '</p></div>';
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

    var win = window.open('','','left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
    win.document.write(content);
    win.document.close();
  }

  onClearSelected() {
    this.numRecordsToPrint = 0;
    this.usersInfo.forEach(userInfo => {
      userInfo.checked = false;
    });
  }

  get apiResult() {
    return this._apiResult;
  }

  set apiResult(result: any) {
    this._apiResult = result;
    this.hasApiResult = result && Object.keys(result).length > 0;
  }

  onPageLoad = (pageInfo: PageInfo) => {
    this.pageEntities = pageInfo.entities;

    this.usersInfo = this.userInfoService.getUsersInfo(this.pageEntities);

    // if ((pageInfo.entities || []).length == 1) {
    //   const entity = pageInfo.entities[0];
    //   this.restService.call(entity.link).subscribe(result => this.apiResult = result);
    // } else {
    //   this.apiResult = {};
    // }
  };

  // getUsersInfo(entities){
  //   entities.forEach(entity => {
  //         if(entity.type === 'REQUEST' && entity.link.includes('users')){
  //           this.requests.push(this.userInfoService.getUserInfoFromLink(entity.link));
  //         }
  //       }
  //   )
  // }

  // update(value: any) {
  //   this.loading = true;
  //   let requestBody = this.tryParseJson(value);
  //   if (!requestBody) {
  //     this.loading = false;
  //     return this.toastr.error('Failed to parse json');
  //   }
  //   this.sendUpdateRequest(requestBody);
  // }

  // refreshPage = () => {
  //   this.loading = true;
  //   this.eventsService.refreshPage().subscribe({
  //     next: () => this.toastr.success('Success!'),
  //     error: e => {
  //       console.error(e);
  //       this.toastr.error('Failed to refresh page');
  //     },
  //     complete: () => this.loading = false
  //   });
  // }

  // private sendUpdateRequest(requestBody: any) {
  //   let request: Request = {
  //     url: this.pageEntities[0].link,
  //     method: HttpMethod.PUT,
  //     requestBody
  //   };
  //   this.restService.call(request).subscribe({
  //     next: result => {
  //       this.apiResult = result;
  //       this.refreshPage();
  //     },
  //     error: (e: RestErrorResponse) => {
  //       this.toastr.error('Failed to update data');
  //       console.error(e);
  //       this.loading = false;
  //     }
  //   });
  // }

  // private tryParseJson(value: any) {
  //   try {
  //     return JSON.parse(value);
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   return undefined;
  // }

}
