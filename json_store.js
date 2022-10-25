const fs = require('fs');

exports.jsonStore = (() => {
    let store = {};
    let filename = "store.json"

    const _readStore = async (name) =>{
        filename = name;
        try{
            const data = fs.readFileSync(name, "utf-8");
            store = JSON.parse(data);
        }catch(err){
            _writeStore();
        }
       
       
    }

    const _writeStore = () =>{
        const storeJSON = JSON.stringify(store);
        fs.writeFileSync(filename, storeJSON);
    }

    const _clearStore = () => {
        store = {};
        _writeStore();
    }

    const _put = (key, data) => {
        if(!key || !data) throw new Error ("Key and Data are required");
        store[key.toString()]=data
        _writeStore();
    }

    const _get = (key) => {
        if(store === {}) _readStore();
        return store[key];
    }

    return {
        init: (name) => {_readStore(name)},
        save: ()=>{_writeStore()},
        clear: ()=>{_clearStore()},
        put: (key, data)=>{_put(key,data)},
        get: (key)=>{return _get(key)}
    } 
})();