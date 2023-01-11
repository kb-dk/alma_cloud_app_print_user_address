# print-address
Cloud App for printing user, vendor and partner address from Alma

Please use GitHub issues to report defects, ask questions, or suggest enhancements.
https://github.com/kb-dk/alma_cloud_app_print_user_address/issues

# For developers
For at add a new address format, add a new entry to the AddressFormats array in the  cloudapp/src/app/config/address-format.ts

## Current Node version of the app
Current node version: v16.19.0

## To update the app:
1. Update the node version (to the latest version that can work with the eca): `nvm install node` to install the latest node or `nvm install VERSION_NUMBER` to install a specific version.
2. Install Exlibris' CLI in the node package: `npm install -g @exlibris/exl-cloudapp-cli`
3. Sometimes it is better to delete `node_modules` folder and `package-lock.json` before the next step.
4. Run: `npm install`
5. Run `npm update`
6. Update cloudapp-sdk: `eca update`

## Install
1. Install node: `nvm install node`
2. npm install
