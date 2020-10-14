/* Defines the UserAddressInfo entity */
export interface UserAddressInfo {
    id: number,
    name: string,
    homeAddress: string,
    workAddress: string,
    alternativeAddress: string,
    desiredAddress:string,
    checked: boolean
}
