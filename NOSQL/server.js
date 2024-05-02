const { MongoClient, ObjectId } = require("mongodb");
const z = require("zod");
const express = require("express");

const app = express();
const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;

const ProductSchema = z.object({
    _id: z.string(),
    name: z.string(),
    about: z.string(),
    price: z.number().positive(),
    categoryIds: z.array(z.string()),
});
const CreateProductSchema = ProductSchema.omit({ _id: true });
const PatchNameProductSchema = ProductSchema.omit({ 
    about: true,
    price: true,
    categoryIds: true,
});
const PatchAboutProductSchema = ProductSchema.omit({ 
    name: true,
    price: true,
    categoryIds: true,
});
const PatchPriceProductSchema = ProductSchema.omit({ 
    name: true,
    about: true,
    categoryIds: true,
});
const PatchCategoryIdsProductSchema = ProductSchema.omit({ 
    name: true,
    about: true,
    price: true,
});
const CategorySchema = z.object({
    _id: z.string(),
    name: z.string(),
});
const CreateCategorySchema = CategorySchema.omit({ _id: true });

app.use(express.json());

app.post("/products", async (req, res) => {
    const result = await CreateProductSchema.safeParse(req.body);

    if(result.success){
        const { name, about, price, categoryIds } = result.data;
        const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));
        
        const ack = await db
            .collection("products")
            .insertOne({name, about, price, categoryIds: categoryObjectIds});
        res.send({ _id: ack.insertedId, name, about, price, categoryIds: categoryObjectIds});
    }
    else{
        res.status(400).send(result);
    }
});

app.get("/products", async (req, res) => {
    const result = await db
        .collection("products")
        .aggregate([
            { $match: {} },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryIds",
                    foreignField: "_id",
                    as: "categories",
                },
            },
        ])
        .toArray();
    res.send(result);
})

app.get("/products/:id", async (req, res) => {
    const result = await db
        .collection("products")
        .find({ "_id": new ObjectId(req.params.id) })
        .toArray();
    if(result.length > 0){
        res.send(result[0]);
    }
    else{
        res.status(404).send("Not found");
    }
});

app.put("/products", async (req, res) => {
    const result = await ProductSchema.safeParse(req.body);
    if(result.success){
        const { _id, name, about, price, categoryIds } = result.data;
        const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));
        
        await db
            .collection("products")
            .deleteOne({ _id: new ObjectId(_id) });
        const ack = await db
            .collection("products")
            .insertOne({_id: new ObjectId(_id), name, about, price, categoryIds: categoryObjectIds});
        res.send({ _id: _id, name, about, price, categoryIds: categoryObjectIds});
    }
    else{
        res.status(400).send(result);
    }
});

app.patch("/products", async (req, res) => {
    const nameResult = await PatchNameProductSchema.safeParse(req.body);
    const aboutResult = await PatchAboutProductSchema.safeParse(req.body);
    const priceResult = await PatchPriceProductSchema.safeParse(req.body);
    const categoryResult = await PatchCategoryIdsProductSchema.safeParse(req.body);
    if(nameResult.success || aboutResult.success || priceResult.success || categoryResult){
        var ack;
        if(nameResult.success){
            const { _id, name } = nameResult.data;
            ack = await db
                .collection("products")
                .updateOne({ _id: new ObjectId(_id)}, { $set: { name: name}});
        }
        if(aboutResult.success){
            const { _id, about } = aboutResult.data;
            ack = await db
                .collection("products")
                .updateOne({ _id: new ObjectId(_id)}, { $set: { about: about}});
        }
        if(priceResult.success){
            const { _id, price } = priceResult.data;
            ack = await db
                .collection("products")
                .updateOne({ _id: new ObjectId(_id)}, { $set: { price: price}});
        }
        if(categoryResult.success){
            const { _id, categoryIds } = categoryResult.data;
            const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));
            ack = await db
                .collection("products")
                .updateOne({ _id: new ObjectId(_id)}, { $set: { categoryIds: categoryObjectIds}});
        }
        res.send(ack);
    }
    else{
        res.status(400).send([nameResult, aboutResult, priceResult, categoryResult]);
    }
});

app.delete("/products/:id", async (req, res) => {
    const ack = db
        .collection("products")
        .deleteOne({ _id: new ObjectId(req.params.id)});
    res.send(ack);
});

app.post("/categories", async (req, res) => {
    const result = await CreateCategorySchema.safeParse(req.body);
    if(result.success){
        const { name } = result.data;
        const ack = await db.collection("categories").insertOne({ name });
        res.send({ _id: ack.insertedId, name });
    }
    else{
        res.status(400).send(result);
    }
});

client.connect().then(() => {
    db = client.db("myDB");
    app.listen(port, () => {
        console.log(`Listening on http://localhost:${port}`);
    });
});