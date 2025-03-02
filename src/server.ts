import express, {Express, Request, Response} from "express";
import fs from "fs";
import { engine } from "express-handleBars"
import helmet from "helmet"
import { ParsedQs } from "qs";
import bodyParser from "body-parser";


//We open on default port 3000
const app: Express = express();
const port = 3000;

//This middleware function logs the request and where it comes from.
const logger = function(req: Request, res: Response, next: Function) {
    console.log("Incoming request from: "+ req.ip);
    console.log(req.method + " " +  req.path)

    next();
}

//This middleware function checks the validity of POST request data.
const errorCheck = function(req: Request, res: Response, next: Function)
{
    valid = true;

    if (req.method === "POST")
    {
        //43 is the max size string we can display, so we we cap it at that. Also make sure the string actually has
        //length.
        if (req.body.name.length === 0 || req.body.name.length > 43)
        {
            valid = false;
        }
        if (req.body.description.length === 0)
        {
            valid = false;
        }
        if (req.body.price < 0)
        {
            valid = false;
        }
        if (valid)
        {
            console.log("POST request has valid data.");
        }
        else
        {
            console.log("POST request has invalid data.");
        }
    }
    

    next();
}

//This is used for error checking later on.
var valid = true;

//Set up our middleware and handlebars
app.use(bodyParser());
app.use(errorCheck)
app.use(logger)
app.use(express.json())

app.set("views", "templates");
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(helmet());

//Basic get request. Just read the file and display everything.
app.get("/catalog", (req: Request, res: Response) => {

    const catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8"))

    res.render("catalog.handlebars", {
        req,
        catalog
    });
});

//if user goes to just the domain name, take them to /catalog
app.get("/", (req: Request, res: Response) => {
    res.redirect("/catalog");
});

//Show the user to the about page.
app.get("/about", (req: Request, res: Response) => {
    res.render("about.handlebars");
})

//This route is for the search functionality.
app.get("/catalog/search", (req: Request, res: Response) => {

    //Search and invalid are used to handle what to display.
    //invalid causes the error message to appear when true,
    //Search is used to enable the search bar.
    //Active is disabled when there is no query parameters sent,
    //so we don't display any results at all.
    const search = true;
    var invalid = false;
    var active = false;

    var catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8"));

    console.log(catalog);

    //We don't want to filter if there's nothing in the query field, so we check that
    //and then filter.
    if (req.query.category !== undefined && req.query.category !== "")
    {
        active = true;
        catalog = catalog.filter((i: { category: string | ParsedQs | (string | ParsedQs)[] | undefined; }) => i.category === req.query.category);
        console.log(catalog);
    }
    if (req.query.name !== undefined && req.query.name !== "")
    {
        //
        active = true;
        var name = JSON.stringify(req.query.name);
        name = name.substring(1, name.length-1);
        catalog = catalog.filter((i: { name: any; }) => JSON.stringify(i.name).toLowerCase().indexOf(name) !== -1);
        console.log(catalog);
    }

    //if after filtering catalog is empty, then our query was invalid
    //(No results)
    if (JSON.stringify(catalog) === "[]")
    {
        invalid = true;
    }

    if (active)
    {
        res.render("catalog.handlebars", {
            req,
            catalog,
            search,
            invalid
        })
    }
    else
    {
        res.render("catalog.handlebars", {
            req,
            search
        });
    }
});

//Route for displaying just a single product.
app.get("/catalog/:id", (req: Request, res: Response) => {
    
    //Get just that product.
    const catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8")).filter(
        (i: { id: string | ParsedQs | (string | ParsedQs)[] | undefined; }) => i.id === req.params.id)

    //If not found.
    if(JSON.stringify(catalog) == "[]")
    {
        const invalid = true;
        
        res.status(404);
        res.render("details.handlebars", {
            req,
            invalid
        })
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
app.post("/catalog", (req: Request, res: Response) => {
    
    //Check if middleware validated the request.
    if (valid)
    {
        var again = true;

        var file = fs.readFileSync("catalog.json", "utf8")

        var randomId = 0;

        var counter = 0;

        //Keep generating random ids until we get one that works.
        //If this goes on too long, exit as a failsafe.
        while (again)
        {
            randomId = Math.floor(Math.random() * 1000);
            
            console.log(randomId);

            const filtered = JSON.parse(file).filter((i: { id: any; }) => i.id === randomId)
            
            console.log(filtered);

            if (JSON.stringify(filtered) === "[]")
            {
                again = false;
            }
            else
            {
                counter++;
            }
            if (counter >= 1000)
            {
                again = false;
            }
        }
        
        //If we didn't exit as failsafe
        if (counter <= 1000)
        {
            const newProduct = {
                "name": req.body.name,
                "description": req.body.description,
                "price": req.body.price,
                "category": req.body.category,
                "id": randomId + "",
                "path": "/catalog/" + randomId
            }

            file = file.replace("]",",");

            const newCatalog = JSON.parse(file + JSON.stringify(newProduct) + "]");

            fs.writeFileSync("catalog.json", JSON.stringify(newCatalog), "utf-8");

            res.status(201).json(req.body);
        }
        else
        {
            res.status(500).send("It appears that the catalog may be full. Old listings should be deleted before more can be added.")
        }
    }
    else
    {
        res.status(400).send("Your input is invalid. Make sure your JSON is formatted correctly and has the required fields.")
    }
});

//Update a product.
app.put("/catalog/:id", (req: Request, res: Response) => {

    //Check if everything is valid.
    if (!isNaN(req.body.price) && req.body.name.length <= 43 && req.body.name.length !== 0 && req.body.description !== "")
    {
        const file = fs.readFileSync("catalog.json", "utf8");

        const catalog = JSON.parse(file);

        const newCatalog = catalog.filter((catalog: { id: string; }) => catalog.id !== req.params.id);

        const updatedCatalog = {
            "id" : req.params.id,
            "name": req.body.name,
            "category": req.body.category,
            "price": req.body.price,
            "path": "/catalog/" + req.params.id,
            "description": req.body.description
        };

        newCatalog.push(updatedCatalog);

        fs.writeFileSync("catalog.json", JSON.stringify(newCatalog));

        res.status(200).send("Product " + req.params.id + " has been edited.");
    }
    else
    {
        res.status(400).send("Your input is invalid. Make sure it is formatted correctly and has all necessary fields.")
    }
});

//Deleting a product
app.delete("/catalog/:id", (req: Request, res: Response) => {
    const file = fs.readFileSync("catalog.json", "utf8");

    const catalog = JSON.parse(file);

    const newCatalog = catalog.filter((catalog: { id: string; }) => catalog.id !== req.params.id);

    //If there was nothing filtered out, then there was nothing to delete.
    if (catalog === newCatalog)
    {
        res.status(400).send("There is nothing to delete at" + req.params.id);
    }
    else
    {
        fs.writeFileSync("catalog.json", JSON.stringify(newCatalog));

        res.status(200).send("Product " + req.params.id + " has been deleted.")
    }
    
});

//Start 'er up!
app.listen(port, () => {
    console.log("[server]: Server is running at http://localhost:" + port);
});