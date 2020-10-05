/* Defines the Address entity */
export interface Address {
    "line1": string,
    "line2": string,
    "line3": string,
    "line4": string,
    "line5": string,
    "city": string,
    "state_province": string,
    "postal_code": string,
    "country": {
        "value": string,
        "desc": string
    },
    "address_note": string,
    "preferred": boolean,
    "segment_type": string,
    "address_type": [
        {
            "value": string,
            "desc": string
        }
        ]
}
