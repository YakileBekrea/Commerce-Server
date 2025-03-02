This is an express server to manage an online catalog for a business

To run, ensure Node.js is properly installed. Then, navigate to the install location using command prompt.

Run the following commands.

npm run build
npm run start

The server will then run on the port specificed in server.ts. By default, this port is 3000.

GET /catalog to access the catalog.
GET /catalog/search to access the search functionality. Query parameters are used and a front end form is supplied for front end requesting.
POST /catalog to add a new product. Body must include name, description, price, and category
PUT /catalog/:id to update a product. Body follows the same rules as POST /catalog
DELETE /catalog/:id to delete a product by id.

It is not neccessary to supply an id when making a POST request. If data supplied is valid, the server will generate one.
