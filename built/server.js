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
const app = (0, express_1.default)();
const port = 3000;
const categories = [
    "cool",
    "cleaning",
    "appliances",
    "food",
    "rawmaterial",
    "tools"
];
const logger = function (req, res, next) {
    console.log("Incoming request from: " + req.ip);
    console.log(req.method + " " + req.path);
    next();
};
const errorCheck = function (req, res, next) {
    valid = true;
    if (req.method === "POST") {
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
var valid = true;
app.use((0, body_parser_1.default)());
app.use(errorCheck);
app.use(logger);
app.use(express_1.default.json());
app.set("views", "templates");
app.engine("handlebars", (0, express_handleBars_1.engine)());
app.set("view engine", "handlebars");
app.use((0, helmet_1.default)());
app.get("/catalog", (req, res) => {
    const catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8"));
    res.render("catalog.handlebars", {
        req,
        catalog
    });
});
app.get("/", (req, res) => {
    res.redirect("/catalog");
});
app.get("/about", (req, res) => {
    res.render("about.handlebars");
});
app.get("/catalog/search", (req, res) => {
    const search = true;
    var invalid = false;
    var active = false;
    var catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8"));
    console.log(catalog);
    if (req.query.category !== undefined && req.query.category !== "") {
        active = true;
        catalog = catalog.filter((i) => i.category === req.query.category);
        console.log(catalog);
    }
    if (req.query.name !== undefined && req.query.name !== "") {
        active = true;
        var name = JSON.stringify(req.query.name);
        name = name.substring(1, name.length - 1);
        catalog = catalog.filter((i) => JSON.stringify(i.name).toLowerCase().indexOf(name) !== -1);
        console.log(catalog);
    }
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
app.get("/catalog/:id", (req, res) => {
    const catalog = JSON.parse(fs_1.default.readFileSync("catalog.json", "utf-8")).filter((i) => i.id === req.params.id);
    if (JSON.stringify(catalog) == "[]") {
        const invalid = true;
        res.status(404);
        res.render("details.handlebars", {
            req,
            invalid
        });
    }
    else {
        res.render("details.handlebars", {
            req,
            catalog
        });
    }
});
app.post("/catalog", (req, res) => {
    if (valid) {
        var again = true;
        var file = fs_1.default.readFileSync("catalog.json", "utf8");
        var randomId = 0;
        while (again) {
            randomId = Math.floor(Math.random() * 1000);
            console.log(randomId);
            const filtered = JSON.parse(file).filter((i) => i.id === randomId);
            console.log(filtered);
            if (JSON.stringify(filtered) === "[]") {
                again = false;
            }
        }
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
        res.send("Your input is invalid. Make sure your JSON is formatted correctly and has the required fields.");
    }
});
app.put("/catalog/:id", (req, res) => {
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
app.delete("/catalog/:id", (req, res) => {
    const file = fs_1.default.readFileSync("catalog.json", "utf8");
    const catalog = JSON.parse(file);
    const newCatalog = catalog.filter((catalog) => catalog.id !== req.params.id);
    if (catalog === newCatalog) {
        res.status(400).send("There is nothing to delete at" + req.params.id);
    }
    else {
        fs_1.default.writeFileSync("catalog.json", JSON.stringify(newCatalog));
        res.status(200).send("Product " + req.params.id + " has been deleted.");
    }
});
app.listen(port, () => {
    console.log("[server]: Server is running at http://localhost:" + port);
});
