# print-address
Cloud App for printing user, vendor and partner address from Alma

Please use GitHub issues to report defects, ask questions, or suggest enhancements.
https://github.com/kb-dk/alma_cloud_app_print_user_address/issues

# For developers
For at add a new address format, add a new entry to the AddressFormats array in the  cloudapp/src/app/config/address-format.ts

## To update the app:
1. Update the node version if necessary
2. Install Exlibris' CLI in the node package: `npm install -g @exlibris/exl-cloudapp-cli`
3. Update the app: `eca update`

## Install
1. Install node version (best via nvm): v12.18.3
2. npm install
