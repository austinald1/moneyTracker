// create variable to hold db connection
const indexedDB = window.indexedDB;
let db;
const request = indexedDB.open('budget', 1);

if (!window.indexedDB) {
    console.log(`Your browser doesn't support IndexedDB`);
}
else{
        console.log("IndexDB activated.");

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            db.createObjectStore('new_transaction', { autoIncrement: true });
        };

        request.onsuccess = function(event) {
            // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
            db = event.target.result;

            // check if app is online, if yes run checkDatabase() function to send all local db data to api
            if (navigator.onLine) {
                uploadTransaction();
            }
        };

        request.onerror = function(event) {
            // log error here
            console.log(event.target.errorCode);
        };

        function saveRecord(record) {
            console.log("Saving record...");
        const transaction = db.transaction(['new_transaction'], 'readwrite');

        const transactionObjectStore = transaction.objectStore('new_transaction');

        // add record to your store with add method.
        transactionObjectStore.add(record);
        console.log("record saved");
        }

        function uploadTransaction() {
            console.log("Uploading transaction...");
            // open a transaction on your pending db
            const transaction = db.transaction(['new_transaction'], 'readwrite');

            // access your pending object store
            const transactionObjectStore = transaction.objectStore('new_transaction');

            // get all records from store and set to a variable
            const getAll = transactionObjectStore.getAll();

            getAll.onsuccess = function() {
                // if there was data in indexedDb's store, let's send it to the api server
                if (getAll.result.length > 0) {
                fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                    }
                })
                    .then(response => response.json())
                    .then(serverResponse => {
                    if (serverResponse.message) {
                        console.log("ERROR");
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    // clear all items in your store
                    transactionObjectStore.clear();
                    console.log("transaction uploaded");
                    })
                    .catch(err => {
                    // set reference to redirect back here
                    console.log(err);
                    });
                }
            };
    }

    // listen for app coming back online
    window.addEventListener('online', uploadTransaction);
}