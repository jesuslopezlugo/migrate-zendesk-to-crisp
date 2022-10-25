const fs = require('fs');
const crisp = require('./crisp');
const jsonStore = require('./json_store');
const nReadlines = require('n-readlines');
const FOLDER = "zendesk_files";
const store = jsonStore.jsonStore;

const main = async ()=>{
    store.init("tickets_synced.json");
    fs.readdir(FOLDER, (err, files) => {
        return files.forEach(async (filename) => {
            console.log("Processing file: ",filename);
            const file = new nReadlines(`${FOLDER}/${filename}`);
            let line;
            let lineNumber = 1;
            while (line = file.next()) {
                console.log("Read Line #",lineNumber);
                const ticket_json = JSON.parse(line.toString('utf-8'));
                console.log("Ticket ID ", ticket_json.id);
                // console.log("Ticket: ", ticket_json);
                const ticket_stored = store.get(ticket_json.id);
                if(!ticket_stored){
                    console.log("Migrating Ticket: ", ticket_json.id);
                    try{
                        await crisp.importZendeskTicket(ticket_json);
                        console.log("Ticket Migrated Successfully",ticket_json.id);
                        store.put(ticket_json.id, true);
                    }catch(err){
                        console.error("Error importZendeskTicket: ",err);
                        if(process.env.MODE === "test"){
                            break;
                        }
                    }
                }
                if(process.env.MODE === "test" && lineNumber == process.env.LINES){
                    break;
                }
                lineNumber++;
                
            }
        });
    });
}

main();