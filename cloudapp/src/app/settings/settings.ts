/* Defines the Settings entity*/
export interface Settings {
    myAddress: string;
    partnerPrintType: string;
    labelWidth: string;
    labelHeight: string;
    defaultTab: number;
    logoInBottom: boolean;
    logoWidth: string;
    addressTopMargin: string;
    addressLeftMargin: string;
    addressRightMargin: string;
    addressBottomMargin: string;
    addressDefaultFontSize: number;
    addressWidth: string;
    textBeforeAddress: string;
    languageDirection: string;
    paperSize: string;
    paperMargin?: string; // deprecated but kept for compatibility reasons.
    paperMarginTop: string;
    paperMarginBottom: string;
    paperMarginLeft: string;
    paperMarginRight: string;
    multiAddressPerPage: boolean;
    repeatAddress: boolean;
    numAddressPerRow: number;
    numAddressPerColumn: number;
    cellPaddingLeft: number;
    cellPaddingRight: number;
}