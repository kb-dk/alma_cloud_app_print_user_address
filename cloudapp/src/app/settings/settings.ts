/* Defines the Settings entity*/
export interface Settings {
    myAddress: string;
    partnerPrintType: string;
    labelWidth: string;
    labelHeight: string;
    defaultTab: string;
    logoInBottom: boolean;
    logoWidth: string;
    addressTopMargin: string;
    addressLeftMargin: string;
    addressRightMargin: string;
    addressBottomMargin: string;
    addressWidth: string;
    textBeforeAddress: string;
    languageDirection: string;
    paperSize: string;
    paperMargin: string;
    multiAddressPerPage: boolean;
    repeatAddress: boolean;
    numAddressPerRow: number;
    numAddressPerColumn: number;
    cellPaddingLeft: number;
    cellPaddingRight: number;
}