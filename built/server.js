"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const express_handleBars_1 = require("express-handleBars");
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = __importDefault(require("body-parser"));
//We open on default port 3000
const app = (0, express_1.default)();
const port = 3000;
//This middleware function logs the request and where it comes from.
const logger = function (req, res, next) {
    console.log("Incoming request from: " + req.ip);
    console.log(req.method + " " + req.path);
    next();
};
//This middleware function checks the validity of POST request data.
const errorCheck = function (req, res, next) {
    valid = true;
    if (req.method === "POST") {
        //43 is the max size string we can display, so we we cap it at that. Also make sure the string actually has
        //length.
        if (req.body.name.length === 0 || req.body.name.length > 43) {
            valid = false;
        }
        if (req.body.description.length === 0) {
            valid = false;
        }
        if (req.body.price < 0) {
            valid = false;
        }
        if (valid) {
            console.log("POST request has valid data.");
        }
        else {
            console.log("POST request has invalid data.");
        }
    }
    next();
};
//This is used for error checking later on.
var valid = true;
//Set up our middleware and handlebars
app.use((0, body_parser_1.default)());
app.use(errorCheck);
app.use(logger);
app.use(express_1.default.json());
app.set("views", "templates");
app.engine("handlebars", (0, express_handleBars_1.engine)());
app.set("view engine", "handlebars");
app.use((0, helmet_1.default)());
//Basic get request. Just read the file and display everything.
app.get("/catalog", (req, res) => {
    const catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8"));
    res.render("catalog.handlebars", {
        req,
        catalog
    });
});
//if user goes to just the domain name, take them to /catalog
app.get("/", (req, res) => {
    res.redirect("/catalog");
});
//Show the user to the about page.
app.get("/about", (req, res) => {
    res.render("about.handlebars");
});
//This route is for the search functionality.
app.get("/catalog/search", (req, res) => {
    //Search and invalid are used to handle what to display.
    //invalid causes the error message to appear when true,
    //Search is used to enable the search bar.
    //Active is disabled when there is no query parameters sent,
    //so we don't display any results at all.
    const search = true;
    var invalid = false;
    var active = false;
    var catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8"));
    console.log(catalog);
    //We don't want to filter if there's nothing in the query field, so we check that
    //and then filter.
    if (req.query.category !== undefined && req.query.category !== "") {
        active = true;
        catalog = catalog.filter((i) => i.category === req.query.category);
        console.log(catalog);
    }
    if (req.query.name !== undefined && req.query.name !== "") {
        //
        active = true;
        var name = JSON.stringify(req.query.name);
        name = name.substring(1, name.length - 1);
        catalog = catalog.filter((i) => JSON.stringify(i.name).toLowerCase().indexOf(name) !== -1);
        console.log(catalog);
    }
    //if after filtering catalog is empty, then our query was invalid
    //(No results)
    if (JSON.stringify(catalog) === "[]") {
        invalid = true;
    }
    if (active) {
        res.render("catalog.handlebars", {
            req,
            catalog,
            search,
            invalid
        });
    }
    else {
        res.render("catalog.handlebars", {
            req,
            search
        });
    }
});
//Route for displaying just a single product.
app.get("/catalog/:id", (req, res) => {
    //Get just that product.
    const catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8")).filter((i) => i.id === req.params.id);
    //If not found.
    if (JSON.stringify(catalog) == "[]") {
        const invalid = true;
        res.status(404);
        res.render("details.handlebars", {
            req,
            invalid
        });
    }
    else //If found
     {
        res.render("details.handlebars", {
            req,
            catalog
        });
    }
});
//Post route for adding a product to the catalog.
app.post("/catalog", (req, res) => {
    //Check if middleware validated the request.
    if (valid) {
        var again = true;
        var file = fs_1.default.readFileSync("catalog.json", "utf8");
        var randomId = 0;
        var counter = 0;
        //Keep generating random ids until we get one that works.
        //If this goes on too long, exit as a failsafe.
        while (again) {
            randomId = Math.floor(Math.random() * 1000);
            console.log(randomId);
            const filtered = JSON.parse(file).filter((i) => i.id === randomId);
            console.log(filtered);
            if (JSON.stringify(filtered) === "[]") {
                again = false;
            }
            else {
                counter++;
            }
            if (counter >= 1000) {
                again = false;
            }
        }
        //If we didn't exit as failsafe
        if (counter <= 1000) {
            const newProduct = {
                "name": req.body.name,
                "description": req.body.description,
                "price": req.body.price,
                "category": req.body.category,
                "id": randomId + "",
                "path": "/catalog/" + randomId
            };
            file = file.replace("]", ",");
            const newCatalog = JSON.parse(file + JSON.stringify(newProduct) + "]");
            fs_1.default.writeFileSync("catalog.json", JSON.stringify(newCatalog), "utf-8");
            res.status(201).json(req.body);
        }
        else {
            res.status(500).send("It appears that the catalog may be full. Old listings should be deleted before more can be added.");
        }
    }
    else {
        res.status(400).send("Your input is invalid. Make sure your JSON is formatted correctly and has the required fields.");
    }
});
//Update a product.
app.put("/catalog/:id", (req, res) => {
    //Check if everything is valid.
    if (!isNaN(req.body.price) && req.body.name.length <= 43 && req.body.name.length !== 0 && req.body.description !== "") {
        const file = fs_1.default.readFileSync("catalog.json", "utf8");
        const catalog = JSON.parse(file);
        const newCatalog = catalog.filter((catalog) => catalog.id !== req.params.id);
        const updatedCatalog = {
            "id": req.params.id,
            "name": req.body.name,
            "category": req.body.category,
            "price": req.body.price,
            "path": "/catalog/" + req.params.id,
            "description": req.body.description
        };
        newCatalog.push(updatedCatalog);
        fs_1.default.writeFileSync("catalog.json", JSON.stringify(newCatalog));
        res.status(200).send("Product " + req.params.id + " has been edited.");
    }
    else {
        res.status(400).send("Your input is invalid. Make sure it is formatted correctly and has all necessary fields.");
    }
});
//Deleting a product
app.delete("/catalog/:id", (req, res) => {
    const file = fs_1.default.readFileSync("catalog.json", "utf8");
    const catalog = JSON.parse(file);
    const newCatalog = catalog.filter((catalog) => catalog.id !== req.params.id);
    //If there was nothing filtered out, then there was nothing to delete.
    if (catalog === newCatalog) {
        res.status(400).send("There is nothing to delete at" + req.params.id);
    }
    else {
        fs_1.default.writeFileSync("catalog.json", JSON.stringify(newCatalog));
        res.status(200).send("Product " + req.params.id + " has been deleted.");
    }
});
//Start 'er up!
app.listen(port, () => {
    console.log("[server]: Server is running at http://localhost:" + port);
});
