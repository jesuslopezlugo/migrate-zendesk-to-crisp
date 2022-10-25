# 01_Migration_Zendesk_to_Crysp

Script to migrate tickets from Zendesk to Crisp with sync  control

## Before Start
Migrate Tickets from Zendes in a JSON file, this script use that file as input


## Getting started

Before start install the npm dependencies

```bash 
npm install
```

Copy the `.env.example` to `.env` and update the values 

Copy your exported Zendesk JSON file into the folder `zendesk_files`

Execute the following script

```bash
npm run start
```

Note: This script include a sync status control that is stored in `ticket_synced.json`, if this this process is interrupted and runned again, then this script will only migrate missing records. If you want to reset this please delete the file `ticket_synced.json` and run the last script again.

## Author
- @jesuslopezlugo