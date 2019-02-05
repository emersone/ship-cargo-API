This is a RESTful API that manages ships and cargo. CRUD operations are implemented for both ships and cargo, and cargo can also be “placed” on ships. Storage is through Google Datastore (NoSQL) and the API is hosted on Google App Engine. 

Server code is written in Node.js. Integration tests are performed in Postman. 

To see that the tests pass, please download Postman [here](https://www.getpostman.com/).

Once you have downloaded Postman, go to **File** and click on **Import**. Choose to import **ship-cargo.postman_collection.json**. When the collection has been imported, choose to run it (hover over the name of the collection, and click the arrow). Click **Run** on the menu, and then again while on the Collection Runner screen. 

There are 40 API requests, and 53 tests total, all of which should pass.
