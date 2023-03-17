#The purpose of this app
The only purpose of this app is to monitor the connectivity in between one Mikrotik router and list of other hosts by using Router OS ping command.
You can initiate several ping commands with independent configurations. Output of this ping commands will be structured in the console as a table.
It can highlight the table record and play alarm sound if certain number of echo responses were lost.
Only one SSH session will be established with Mikrotik router.

## How to install and use the app

###This application is intended to work with Microtik RouterOS exclusively!

Install NVM (Node Version Manager)
```
Download installer from here: https://github.com/coreybutler/nvm-windows/releases (latest version of nvm-setup.exe)
Install NVM from downloaded file - you may need to reboot your Windows to be able to use nvm command in CLI
```
Install NodeJS by using NVM
```
by using CLI, execute following commands:
nvm install 14.19.3
nvm use 14.19.3
```
Update example configuration with hosts you need to monitor:
```
open config/hostsList.json
keep the content structure unchanged, use double quotes
```
Update grobal app configuration:
.env
```
SSH_host=192.168.88.1 - Mikrotik router address to connect
SSH_user=admin - Mikrotik router user login
SSH_passphrase=12345 - Mikrotik router user password
```
To start the app:
```
execute start.bat
```
To close the app:
```
close the app window, or double press Ctrl + C
```
