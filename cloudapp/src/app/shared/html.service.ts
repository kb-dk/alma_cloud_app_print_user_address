import {Injectable} from '@angular/core';
import {Settings} from "../settings/settings";

@Injectable({
    providedIn: 'root'
})
export class HtmlService {

    constructor() {
    }

    getGeneralStyling = () => `
                @media print{
                    .hidden-print{
                        display: none !important;
                    }
                }
                
                body{
                    font-size:80%; 
                    font-family: sans-serif; 
                    font-weight:600; 
                    margin: 0;
                }
                 
               `;

    getLabelStyling = (labelWidth, labelHeight) => `
                div.pageBreak{
                    page-break-after: always;
                    }
                                       
                @page{
                    margin: 0;
                }
                
                html, body, .label{
                    width: ${labelWidth}cm;
                    height: ${labelHeight}cm;
                }
                               
                .sender strong{
                    font-weight: bold; 
                    font-size: 18px;
                }
                
                .sender:before{
                    content:"";
                    position:absolute;
                    border-top:1px solid black;
                    width:7cm;
                    transform: rotate(13deg);
                    transform-origin: 0 0;
                }
                
                .sender:after{
                    content:"";
                    position:absolute;
                    left:0;
                    bottom:0.1cm;
                    border-bottom:1px solid black;
                    width:7cm;
                    transform: rotate(-13deg);
                    transform-origin: 0 0;
                }
                 
               `;

    getOneAddressPerPageStyling = (addressTopMargin, addressWidth) => `
                .address-flex-item{
                    order: 1;
                    flex-grow: 3;
                    top:${addressTopMargin}cm;
                }  
                
                .address-flex-item p{
                    width:${addressWidth}cm;                 
                }  
               `;

    getLogoStyling = (logoWidth) => `
               img.logo{
               width: ${logoWidth}cm;
               max-width: 100%;
               float: right;
               }
               `;

    getPaperWidth = (paperSize, paperMarginLeft, paperMarginRight) => parseFloat(paperSize.substring(0, paperSize.search('X'))) - parseFloat(paperMarginLeft) - parseFloat(paperMarginRight);

    getPaperHeight = (paperSize, paperMarginTop, paperMarginBottom) => parseFloat(paperSize.substring(paperSize.search('X') + 1)) - parseFloat(paperMarginTop) - parseFloat(paperMarginBottom);

    getMultiAddressPerPageStyling = (settings) => `
                .address-flex-item{
                    padding-left: ${settings.cellPaddingLeft}cm;                
                    padding-right: ${settings.cellPaddingRight}cm;                 
                } 
                             
                .address-flex-item p{
                    width:${(this.getPaperWidth(settings.paperSize, settings.paperMarginLeft, settings.paperMarginRight) / settings.numAddressPerRow) - parseFloat(settings.addressLeftMargin) - parseFloat(settings.addressRightMargin) - settings.cellPaddingLeft - settings.cellPaddingRight}cm;                 
                    max-height:${(this.getPaperHeight(settings.paperSize, settings.paperMarginTop, settings.paperMarginBottom) / settings.numAddressPerColumn) - 1 - parseFloat(settings.addressTopMargin) - parseFloat(settings.addressBottomMargin)}cm;
                    margin-top: ${settings.addressTopMargin}cm;               
                }  
               `;

    getContent = (innerHtml, context, settings: Settings, fontSize) => `
                <html dir = '${settings.languageDirection}'>
                    <style>                                                                     
                        ${this.getGeneralStyling()},
                        ${this.getLogoStyling(settings.logoWidth)},
                        ${settings.partnerPrintType === 'paper' || context === 'user' ? this.getPageStyling(context, settings, fontSize) : this.getLabelStyling(settings.labelWidth, settings.labelHeight)},                        
                    </style>
                        
                    <body onload='window.print();'>
                        ${innerHtml}
                    </body>
                </html>
                `;

    getPageStyling = (context, settings:Settings, fontSize) => ` 
                ${settings.multiAddressPerPage ? this.getMultiAddressPerPageStyling(settings) : this.getOneAddressPerPageStyling(settings.addressTopMargin, settings.addressWidth)}

                .paper{
                    width: ${this.getPaperWidth(settings.paperSize, settings.paperMarginLeft, settings.paperMarginRight)}cm;
                    height: ${this.getPaperHeight(settings.paperSize, settings.paperMarginTop, settings.paperMarginBottom)}cm; 
                    /* Using padding instead of margin so wouldn't need to calculate 
                       the width and height of the page based on margin. */
                    padding-top: ${settings.paperMarginTop}cm; 
                    padding-bottom: ${settings.paperMarginBottom}cm; 
                    padding-left: ${settings.paperMarginLeft}cm; 
                    padding-right: ${settings.paperMarginRight}cm; 
                    page-break-after: always;
                    max-height: 100vh;
                }  
                .paper:last-child {
                    page-break-after: avoid;
                }                 
                .flex-container{
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                .address-flex-item{
                    position: relative;
                    font-size: ${fontSize ? fontSize : settings.addressDefaultFontSize}px
                }
                .address-flex-item p{
                    margin-left: ${settings.addressLeftMargin}cm;
                    margin-right: ${settings.addressRightMargin}cm;
                    margin-bottom: ${settings.addressBottomMargin}cm;
                }
                .logo-flex-item{
                    order: 2;
                }
                .logo-flex-item img{
                    float: right; 
                    width:${settings.logoWidth}cm; 
                    ${settings.logoInBottom ? 'margin-top: 18cm;' : ''}
               `;

    getHtmlForLabel = (partner, addresses, showRecipient, senderAddress) => `
                      <div class='label pageBreak' style="position:relative; padding:0.15cm;"> 
                      <div class="recipient" style="position: relative; font-size: 16px;"> 
                      ${showRecipient ? partner.name + '<br/>' : ''} 
                      ${addresses.find(address => address.type === partner.selectedAddress).address}</div>
                      <div class="sender" style="position: absolute; bottom:0.15cm; left:0.8cm;">${senderAddress}</div>
                      </div>
                    `;

    printContent = (innerHtml, context, settings: Settings, fontSize) => {
        let content = this.getContent(innerHtml, context, settings, fontSize);
        let win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        if (win.document) {
            win.document.write(content);
            win.document.close();
        }
    };

    getLogo = (logoUrl) => `<div class="logo-flex-item"><img class="logo" alt="logo" src="${logoUrl}"/></div>`;

    getOneAddress = (partnerOrUser, addresses, printLogo, multiAddressPerPage, logoUrl, textBeforeAddress, showRecipient) => `                    
                      ${multiAddressPerPage ? '' : "<div class='paper flex-container'>"}                                                                 
                      ${!multiAddressPerPage && printLogo && logoUrl ? this.getLogo(logoUrl) : ''}
                      <div class="address-flex-item">
                        <p style="">${textBeforeAddress ? '<u>' + textBeforeAddress + '</u><br/>' : ''}                      
                        ${showRecipient ? partnerOrUser.name + '<br/>' : ''} 
                        ${addresses.find(address => address.type === partnerOrUser.selectedAddress).address}
                        </p>
                      </div>
                      ${multiAddressPerPage ? '' : "</div>"}                                                                 
                    `;

    getHtmlForPaper = (partnerOrUser, numberOfAddresses, addresses, printLogo, repeatAddress, multiAddressPerPage, numAddressPerRow, numAddressPerColumn, logoUrl, textBeforeAddress, showRecipient) => {
        let html = this.getOneAddress(partnerOrUser, addresses, printLogo, multiAddressPerPage, logoUrl, textBeforeAddress, showRecipient);
        // Repeat the address if needed.
        if (numberOfAddresses === 1 && repeatAddress && multiAddressPerPage) {
            let length: number = numAddressPerRow * numAddressPerColumn;
            for (let i = 2; i <= length; i++) {
                html = html.concat(this.getOneAddress(partnerOrUser, addresses, printLogo, multiAddressPerPage, logoUrl, textBeforeAddress, showRecipient));
            }
        }
        return html;
    };

}