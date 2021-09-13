const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/css/styles.css",
    "/js/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/manifest.json",
    "/js/idb.js"
    // everything from public folder goes in here
  ];
  
  const CACHE_NAME = "static-cache-v2";
  const DATA_CACHE_NAME = "data-cache-v1";
  
  // installs service worker and cache files
  self.addEventListener("install", function (evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  // on subsequent visits remove old cache files not needed and re-attch them in browser
  self.addEventListener("activate", function (evt) {
    evt.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  // The claim() method of the Clients interface allows an active service worker to set itself as the controller for all clients within its scope.
    self.clients.claim();
  });
  
  // checking all api request and if they exist it will restore bulk offline transactions
  self.addEventListener("fetch", function (evt) {
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then((cache) => {
            return fetch(evt.request)
              .then((response) => {
                // If the response was good, clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put(evt.request.url, response.clone());
                }
  
                return response;
              })
              .catch((err) => {
                // Network request failed, try to get it from the cache.
                return cache.match(evt.request);
              });
          })
          .catch((err) => console.log(err))
      );
  
      return;
      // will end function after all new requests are dealt with
    }