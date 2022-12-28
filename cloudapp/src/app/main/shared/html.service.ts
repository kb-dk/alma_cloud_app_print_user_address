import {Injectable} from '@angular/core';

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

    getMultiAddressPerPageStyling = (cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin) => `
                .address-flex-item{
                    padding-left: ${cellPaddingLeft}cm;                
                    padding-right: ${cellPaddingRight}cm;                 
                } 
                             
                .address-flex-item p{
                    width:${(this.getPaperWidth(paperSize, paperMarginLeft, paperMarginRight) / numAddressPerRow) - parseFloat(addressLeftMargin) - parseFloat(addressRightMargin) - cellPaddingLeft - cellPaddingRight}cm;                 
                    max-height:${(this.getPaperHeight(paperSize, paperMarginTop, paperMarginBottom) / numAddressPerColumn) - 1 - parseFloat(addressTopMargin) - parseFloat(addressBottomMargin)}cm;
                    margin-top: ${addressTopMargin}cm;               
                }  
               `;

    getContent = (innerHtml, context, languageDirection, logoWidth, partnerPrintType, multiAddressPerPage, cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin, addressWidth, userFontSize, partnerFontSize, logoInBottom, labelWidth, labelHeight) => `
                <html dir = '${languageDirection}'>
                    <style>                                                                     
                        ${this.getGeneralStyling()}
                        ${this.getLogoStyling(logoWidth)}
                        ${partnerPrintType === 'paper' || context === 'user' ? this.getPageStyling(context, multiAddressPerPage, cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin, addressWidth, userFontSize, partnerPrintType, partnerFontSize, logoWidth, logoInBottom) : this.getLabelStyling(labelWidth, labelHeight)}                        
                    </style>
                        
                    <body onload='window.print();'>
                        ${innerHtml}
                    </body>
                </html>
                `;

    getPageStyling = (context, multiAddressPerPage, cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin, addressWidth, userFontSize, partnerPrintType, partnerFontSize, logoWidth, logoInBottom) => ` 
                ${multiAddressPerPage ? this.getMultiAddressPerPageStyling(cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin) : this.getOneAddressPerPageStyling(addressTopMargin, addressWidth)}

                .paper{
                    width: ${this.getPaperWidth(paperSize, paperMarginLeft, paperMarginRight)}cm;
                    height: ${this.getPaperHeight(paperSize, paperMarginTop, paperMarginBottom)}cm; 
                    /* Using padding instead of margin so wouldn't need to calculate 
                       the width and height of the page based on margin. */
                    padding-top: ${paperMarginTop}cm; 
                    padding-bottom: ${paperMarginBottom}cm; 
                    padding-left: ${paperMarginLeft}cm; 
                    padding-right: ${paperMarginRight}cm; 
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
                    font-size: ${context === 'user' ? userFontSize || 17 : (partnerPrintType === 'paper' ? partnerFontSize || 17 : 17)}px
                }
                .address-flex-item p{
                    margin-left: ${addressLeftMargin}cm;
                    margin-right: ${addressRightMargin}cm;
                    margin-bottom: ${addressBottomMargin}cm;
                }
                .logo-flex-item{
                    order: 2;
                }
                .logo-flex-item img{
                    float: right; 
                    width:${logoWidth}cm; 
                    ${logoInBottom ? 'margin-top: 18cm;' : ''}
               `;

    getHtmlForLabel = (partner, addresses, showRecipient, senderAddress) => `
                      <div class='label pageBreak' style="position:relative; padding:0.15cm;"> 
                      <div class="recipient" style="position: relative; font-size: 16px;"> 
                      ${showRecipient ? partner.name + '<br/>' : ''} 
                      ${addresses.find(address => address.type === partner.selectedAddress).address}</div>
                      <div class="sender" style="position: absolute; bottom:0.15cm; left:0.8cm;">${senderAddress}</div>
                      </div>
                    `;

    printContent = (innerHtml, context, languageDirection, logoWidth, partnerPrintType, multiAddressPerPage, cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin, addressWidth, userFontSize, partnerFontSize, logoInBottom, labelWidth, labelHeight) => {
        let content = this.getContent(innerHtml, context, languageDirection, logoWidth, partnerPrintType, multiAddressPerPage, cellPaddingLeft, cellPaddingRight, numAddressPerRow, addressLeftMargin, addressRightMargin, paperSize, paperMarginLeft, paperMarginRight, paperMarginTop, paperMarginBottom, numAddressPerColumn, addressTopMargin, addressBottomMargin, addressWidth, userFontSize, partnerFontSize, logoInBottom, labelWidth, labelHeight);
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