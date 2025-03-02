//This is an express server to manage a book database.

To run, ensure Node.js is properly installed. Then, navigate to the install location using command prompt.

Run the following commands.

npm run build
npm run start

The server will then run on the port specificed in server.ts. By default, this port is 3000.

GET /books to access the list of books.
POST /books to add a new book. Body must include id, title, author, and publicationYear.
PUT /books/:id to update a book. Body follows the same rules as POST /books
DELETE /books/:id to delete a book by id.