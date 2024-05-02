const { MongoClient, ObjectId } = require("mongodb");
const z = require("zod");
const express = require("express");

const app = express();
const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;


const IdSchema = z.object({
    _id: z.string(),
});
const ViewSchema = z.object({
    _id: z.string(),
    source: z.string(),
    url: z.string(),
    visitor: z.string(),
    createdAt: z.date(),
    meta: z.any(),
});
const CreateViewSchema = ViewSchema.omit({ _id: true, createdAt: true });
const PatchViewSchema = ViewSchema.omit({ createdAt: true }).optional({
    source: true,
    url: true,
    visitor: true,
    meta: true,
});
const ActionSchema = z.object({
    _id: z.string(),
    source: z.string(),
    url: z.string(),
    action: z.string(),
    visitor: z.string(),
    createdAt: z.date(),
    meta: z.any(),
});
const CreateActionSchema = ViewSchema.omit({ _id: true });
const PatchActionSchema = ActionSchema.omit({ createdAt: true }).optional({
    source: true,
    url: true,
    action: true,
    visitor: true,
    meta: true,
});
const GoalSchema = z.object({
    _id: z.string(),
    source: z.string(),
    url: z.string(),
    goal: z.string(),
    visitor: z.string(),
    createdAt: z.date(),
    meta: z.any(),
});
const CreateGoalSchema = ViewSchema.omit({ _id: true });
const PatchGoalSchema = ActionSchema.omit({ createdAt: true }).optional({
    source: true,
    url: true,
    goal: true,
    visitor: true,
    meta: true,
});

app.use(express.json());

app.get("/views", async (req, res) => {
    const ack = await db
        .collection("analytics")
        .find({action: null, goal: null})
        .toArray();
    res.send(ack);
});

app.get("/views/:id", async (req, res) => {
    const ack = await db
        .collection("analytics")
        .find({ _id: new ObjectId(req.params.id), action: null, goal: null})
        .toArray();
    res.send(ack);
});

app.post("/views", async (req, res) => {
    const result = CreateViewSchema.safeParse(req.body);
    if(result.success){
        const { source, url, visitor, meta } = result.data;
        const ack = await db
            .collection("analytics")
            .insertOne({source, url, visitor, createdAt: Date.now(), meta});
        res.send({ _id: ack.insertedId, source, url, visitor, createdAt: Date.now(), meta});
    }
    else{
        res.status(400).send(result);
    }
});

app.delete("/views", async (req, res) => {
    const result = IdSchema.safeParse(req.body);
    if(result.success){
        const { _id } = result.data;
        const ack = await db
            .collection("analytics")
            .deleteOne({_id: new ObjectId(_id) });
        res.send(ack);
    }
    else{
        res.status(400).send(result);
    }
});

client.connect().then(() => {
    db = client.db("myDB2");
    app.listen(port, () => {
        console.log(`Listening on http://localhost:${port}`);
    });
});