import express, {Express, Request, Response} from "express";
import fs from "fs";
import { engine } from "express-handleBars"
import helmet from "helmet"
import { ParsedQs } from "qs";
import bodyParser from "body-parser";

const app: Express = express();
const port = 3000;
const categories = [
    "cool",
    "cleaning",
    "appliances",
    "food",
    "rawmaterial",
    "tools"
]

const logger = function(req: Request, res: Response, next: Function) {
    console.log("Incoming request from: "+ req.ip);
    console.log(req.method + " " +  req.path)

    next();
}

const errorCheck = function(req: Request, res: Response, next: Function)
{
    valid = true;

    if (req.method === "POST")
    {
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

var valid = true;

app.use(bodyParser());
app.use(errorCheck)
app.use(logger)
app.use(express.json())
app.set("views", "templates");

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(helmet());

app.get("/catalog", (req: Request, res: Response) => {

    const catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8"))

    res.render("catalog.handlebars", {
        req,
        catalog
    });
});

app.get("/", (req: Request, res: Response) => {
    res.redirect("/catalog");
});

app.get("/about", (req: Request, res: Response) => {
    res.render("about.handlebars");
})

app.get("/catalog/search", (req: Request, res: Response) => {

    const search = true;
    var invalid = false;
    var active = false;

    var catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8"));

    console.log(catalog);

    if (req.query.category !== undefined && req.query.category !== "")
    {
        active = true;
        catalog = catalog.filter((i: { category: string | ParsedQs | (string | ParsedQs)[] | undefined; }) => i.category === req.query.category);
        console.log(catalog);
    }
    if (req.query.name !== undefined && req.query.name !== "")
    {
        active = true;
        var name = JSON.stringify(req.query.name);
        name = name.substring(1, name.length-1);
        catalog = catalog.filter((i: { name: any; }) => JSON.stringify(i.name).toLowerCase().indexOf(name) !== -1);
        console.log(catalog);
    }

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

app.get("/catalog/:id", (req: Request, res: Response) => {
    
    const catalog = JSON.parse(fs.readFileSync("catalog.json", "utf-8")).filter(
        (i: { id: string | ParsedQs | (string | ParsedQs)[] | undefined; }) => i.id === req.params.id)

    if(JSON.stringify(catalog) == "[]")
    {
        const invalid = true;
        
        res.status(404);
        res.render("details.handlebars", {
            req,
            invalid
        })
    }
    else
    {
        res.render("details.handlebars", {
            req,
            catalog
        });
    }
});

app.post("/catalog", (req: Request, res: Response) => {
    
    if (valid)
    {
        var again = true;

        var file = fs.readFileSync("catalog.json", "utf8")

        var randomId = 0;

        var counter = 0;

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
            res.status(400).send("It appears that the catalog is full. Old listings must be deleted before more can be added.")
        }
    }
    else
    {
        res.send("Your input is invalid. Make sure your JSON is formatted correctly and has the required fields.")
    }
});

app.put("/catalog/:id", (req: Request, res: Response) => {

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

app.delete("/catalog/:id", (req: Request, res: Response) => {
    const file = fs.readFileSync("catalog.json", "utf8");

    const catalog = JSON.parse(file);

    const newCatalog = catalog.filter((catalog: { id: string; }) => catalog.id !== req.params.id);

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

app.listen(port, () => {
    console.log("[server]: Server is running at http://localhost:" + port);
});