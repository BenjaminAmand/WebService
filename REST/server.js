const express = require("express");
const postgres = require("postgres");
const z = require("zod");
const { sha512 } = require('js-sha512');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const port = 8000;
const sql = postgres({ db: "mydb", user: "user", password: "password"});

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const ProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    about: z.string(),
    price: z.number().positive(),
})
const CreateProductSchema = ProductSchema.omit({id:true});

const UserSchema = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string()
});
const PatchUsernameUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    newUsername: z.string()
});
const PatchEmailUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    newEmail: z.string()
});
const PatchPasswordUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    newPassword: z.string()
});
const OrdersSchema = z.object({
    orderId: z.number().positive(),
    userId: z.string(),
    productId: z.number().positive(),
    payment: z.boolean()
});
const CreateOrdersSchema = z.object({
    userId: z.string(),
    productId: z.number().positive(),
    payment: z.boolean()
});
const UserPatchOrdersSchema = z.object({
    orderId: z.number().positive(),
    userId: z.string()
});
const ProductPatchOrdersSchema = z.object({
    orderId: z.number().positive(),
    productId: z.number().positive()
});
const paymentPatchOrdersSchema = z.object({
    orderId: z.number().positive(),
    payment: z.boolean()
});


app.get("/users", async (req, res) => {
    const users = await sql`
    SELECT username, email FROM users
    `;
    res.send(users);
});

app.get("/users/:username", async (req, res) => {
    const users = await sql`
    SELECT username, email FROM users
    WHERE username=${req.params.username}
    `;
    res.send(users);
});

app.put("/users", async (req, res) => {
    const result = await UserSchema.safeParse(req.body);
    if(result.success){
        const { username, password, email } = result.data;

        await sql`
        DELETE FROM users WHERE username=${username}
        `;

        const user = await sql`
        INSERT INTO users (username, password, email)
        VALUES (${username}, ${sha512(password)}, ${email})
        RETURNING username, email
        `;

        res.send(user[0]);
    }
    else{
        res.status(400).send(result);
    }
})
/**
 * @swagger
 * /users:
 *      get:
 *          summary: Get the list of all users
 *          description: Retrieve a list of users from the database.
 *          responses:
 *              200:
 *                  description: Successful response with a list of users.
 *      put:
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: username
 *                required: true
 *                type: string
 *                description: The user id
 *              - in: formData
 *                name: password
 *                required: true
 *                type: string
 *                description: The user password
 *              - in: formData
 *                name: email
 *                required: true
 *                type: string
 *                description: The user email
 *          summary: Add or replace a user
 *          description: Add or replace a user in the database.
 *          responses:
 *              200:
 *                  description: Successful response with user.
 *              400:
 *                  description: Error while parsing.
 *      patch:
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: username
 *                required: true
 *                type: string
 *                description: The user id
 *              - in: formData
 *                name: password
 *                required: true
 *                type: string
 *                description: The user password
 *              - in: formData
 *                name: newUsername
 *                required: false
 *                type: string
 *                description: The new username
 *              - in: formData
 *                name: newPassword
 *                required: false
 *                type: string
 *                description: The new password
 *              - in: formData
 *                name: newEmail
 *                required: false
 *                type: string
 *                description: The new mail
 *          summary: Update a user
 *          description: Update a user in the database.
 *          responses:
 *              200:
 *                  description: Successful response with user.
 *              400:
 *                  description: Error while parsing.
 * /users/{username}:
 *      get:
 *          parameters:
 *              - in: path
 *                name: username
 *                required: true
 *                type: string
 *                description: The user id
 *          summary: Get a user
 *          description: Retrieve a user from the database.
 *          responses:
 *              200:
 *                  description: Successful response with user.
 */
app.patch("/users", async (req, res) => {
    const resultUsername = await PatchUsernameUserSchema.safeParse(req.body);
    const resultEmail = await PatchEmailUserSchema.safeParse(req.body);
    const resultPassword = await PatchPasswordUserSchema.safeParse(req.body);
    if(resultUsername.success){
        const { username, password, newUsername } = resultUsername.data;
        const user = await sql`
        UPDATE users
        SET username=${newUsername}
        WHERE username=${username} and password=${sha512(password)}
        RETURNING username, email
        `;
        res.send(user[0]);
    }
    else if(resultEmail.success){
        const { username, password, newEmail } = resultEmail.data;
        const user = await sql`
        UPDATE users
        SET email=${newEmail}
        WHERE username=${username} and password=${sha512(password)}
        RETURNING username, email
        `;
        res.send(user[0]);
    }
    else if(resultPassword.success){
        const { username, password, newPassword } = resultPassword.data;
        const user = await sql`
        UPDATE users
        SET password=${sha512(newPassword)}
        WHERE username=${username} and password=${sha512(password)}
        RETURNING username, email
        `;
        res.send(user[0]);
    }
    else{
        res.status(400).send([result, resultEmail, resultPassword]);
    }
})
/**
 * @swagger
 * /f2p-games:
 *      get:
 *          summary: Get the list of free games from freetogames
 *          description: Retrieve the list of free games from the database of freetogame.
 *          responses:
 *              200:
 *                  description: Successful response with the list of games.
 * /f2p-games/{id}:
 *      get:
 *          summary: Get a games from freetogames
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *                description: The id of the game
 *          description: Retrieve a games from the database of freetogame.
 *          responses:
 *              200:
 *                  description: Successful response with the game.
 */
app.get("/f2p-games", async (req, res) => {
    const response = await fetch("https://www.freetogame.com/api/games");
    const json = await response.json();
    res.send(json);
});

app.get("/f2p-games/:id", async (req, res) => {
    const response = await fetch(`https://www.freetogame.com/api/game?id=${req.params.id}`);
    const json = await response.json();
    res.send(json);
});


app.get("/products", async (req, res) => {
    if(req.query.name != null || req.query.about != null || req.query.price != null){
        const products = await sql`
        SELECT * FROM products
        WHERE name LIKE ${"%" + (req.query.name??"") + "%"} AND about LIKE ${"%" + (req.query.about??"") + "%"} AND (price <= ${req.query.price??0} OR -50=${req.query.price??-50})
        `;
        res.send(products);
    }
    else{
        const products = await sql`
        SELECT * FROM products
        `;
        res.send(products);
    }
});

app.get("/products/:id", async (req, res) => {
    const product = await sql`
    SELECT * FROM products WHERE id=${req.params.id}
    `;
    if(product.length > 0){
        res.send(product[0]);
    }
    else{
        res.statusCode(404).send({ message: "Not found"});
    }
});

app.post("/products", async (req, res) => {
    const result = await CreateProductSchema.safeParse(req.body);
    if(result.success){
        const { name, about, price } = result.data;

        const product = await sql`
        INSERT INTO products (name, about, price)
        VALUES (${name}, ${about}, ${price})
        RETURNING *
        `;

        res.send(product[0]);
    }
    else{
        res.status(400).send(result);
    }
});
/**
 * @swagger
 * /products:
 *      get:
 *          summary: Get the list of products
 *          description: Retrieve the list of products from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the list of products.
 *      post:
 *          summary: Add a product
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: name
 *                required: true
 *                type: string
 *                description: The name of the product
 *              - in: formData
 *                name: about
 *                required: true
 *                type: string
 *                description: The description of the product
 *              - in: formData
 *                name: price
 *                required: true
 *                type: float
 *                description: The price of the product
 *          description: Add a product.
 *          responses:
 *              200:
 *                  description: Successful response with the list of products.
 * /products/{id}:
 *      get:
 *          summary: Get the products
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *                description: The id of the product
 *          description: Retrieve the product from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the product.
 *              404:
 *                  description: Product not found
 *      delete:
 *          summary: delete the products
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *                description: The id of the product
 *          description: Delete the product from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the product.
 *              404:
 *                  description: Product not found
 *          
 */
app.delete("/products/:id", async (req, res) => {
    const product = await sql`
    DELETE FROM products
    WHERE id=${req.params.id}
    RETURNING *
    `;
    if(product.length > 0){
        res.send(product[0]);
    }
    else{
        res.status(404).send({ message: "Not found" });
    }
});

app.get("/orders", async (req, res) => {
    const order = await sql`
    SELECT * FROM orders
    `;
    res.send(order);
});

app.get("/orders/:id", async (req, res) => {
    const order = await sql`
    SELECT * FROM orders
    WHERE orderId=${req.params.id}
    `;
    if(order.length > 0){
        res.send(order[0]);
    }
    else{
        res.status(404).send({ message: "Not found" });
    }
});

app.get("/orders/:user", async (req, res) => {
    const order = await sql`
    SELECT * FROM orders
    WHERE userId=${req.params.user}
    `;
    if(order.length > 0){
        res.send(order);
    }
    else{
        res.status(404).send({ message: "Not found" });
    }
});

app.get("/orders/:product", async (req, res) => {
    const order = await sql`
    SELECT * FROM orders
    WHERE productId=${req.params.product}
    `;
    if(order.length > 0){
        res.send(order);
    }
    else{
        res.status(404).send({ message: "Not found" });
    }
});
/**
 * @swagger
 * /orders:
 *      get:
 *          summary: Get the list of orders
 *          description: Retrieve the list of orders from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the list of orders.
 *      put:
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: orderId
 *                required: true
 *                type: string
 *                description: The order id
 *              - in: formData
 *                name: userId
 *                required: true
 *                type: string
 *                description: The user id
 *              - in: formData
 *                name: productId
 *                required: true
 *                type: string
 *                description: The product id
 *              - in: formData
 *                name: payment
 *                required: true
 *                type: boolean
 *                description: is the orders payed
 *          summary: Add or replace a order with a specific id
 *          description: Add or replace a order in the database.
 *          responses:
 *              200:
 *                  description: Successful response with order.
 *              400:
 *                  description: Error while parsing.
 *      post:
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: userId
 *                required: true
 *                type: string
 *                description: The user id
 *              - in: formData
 *                name: productId
 *                required: true
 *                type: string
 *                description: The product id
 *              - in: formData
 *                name: payment
 *                required: true
 *                type: boolean
 *                description: is the orders payed
 *          summary: Add a order
 *          description: Add a order in the database.
 *          responses:
 *              200:
 *                  description: Successful response with order.
 *              400:
 *                  description: Error while parsing.
 *      patch:
 *          consumes:
 *              - application/json
 *          parameters:
 *              - in: formData
 *                name: orderId
 *                required: true
 *                type: string
 *                description: The order id
 *              - in: formData
 *                name: userId
 *                required: false
 *                type: string
 *                description: The user id
 *              - in: formData
 *                name: payment
 *                required: false
 *                type: boolean
 *                description: is the orders payed
 *              - in: formData
 *                name: productId
 *                required: false
 *                type: string
 *                description: The product id
 *          summary: Update an order
 *          description: Update an order in the database.
 *          responses:
 *              200:
 *                  description: Successful response with user.
 *              400:
 *                  description: Error while parsing.
 * /orders/{id}:
 *      get:
 *          summary: Get the order
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *                description: The id of the order
 *          description: Retrieve the order from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the order.
 *              404:
 *                  description: order not found
 *      delete:
 *          summary: delete the order
 *          parameters:
 *              - in: path
 *                name: id
 *                required: true
 *                type: string
 *                description: The id of the order
 *          description: Delete the order from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the order.
 *              404:
 *                  description: order not found
 * /orders/{user}:
 *      get:
 *          summary: Get the list of orders by the user
 *          parameters:
 *              - in: path
 *                name: user
 *                required: true
 *                type: string
 *                description: The username of the user of the order
 *          description: Retrieve the list of orders by the user from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the list of orders by the user.
 *              404:
 *                  description: order not found
 * /orders/{product}:
 *      get:
 *          summary: Get the list of orders by the product
 *          parameters:
 *              - in: path
 *                name: product
 *                required: true
 *                type: string
 *                description: The id of the product of the order
 *          description: Retrieve the list of orders by the product from the database.
 *          responses:
 *              200:
 *                  description: Successful response with the list of orders by the product.
 *              404:
 *                  description: order not found
 */
app.put("/orders", async (req, res) => {
    const result = await OrdersSchema.safeParse(req.body);
    if(result.success){
        const { orderId, userId, productId, payment } = result.data;

        const price = await sql`
        SELECT price FROM products WHERE id=${productId}
        `
        if(price.length == 0){
            res.status(400).send("The product does not exist");
        }

        await sql`
        DELETE FROM orders WHERE orderId=${orderId}
        `;

        const order = await sql`
        INSERT INTO orders(orderId, userId, productId, total, payment, createdAt, updatedAt)
        VALUES (${orderId},${userId},${productId},${price[0].price * 1.2},${payment}, now(), now())
        RETURNING *
        `;
        res.send(order[0]);
    }
    else{
        res.status(400).send(result);
    }
});

app.post("/orders", async (req, res) => {
    const result = await CreateOrdersSchema.safeParse(req.body);
    if(result.success){
        const { userId, productId, payment } = result.data;

        const price = await sql`
        SELECT price FROM products WHERE id=${productId}
        `
        if(price.length == 0){
            res.status(400).send("The product does not exist");
        }

        const order = await sql`
        INSERT INTO orders(userId, productId, total, payment, createdAt, updatedAt)
        VALUES (${userId},${productId},${price[0].price * 1.2},${payment}, now(), now())
        RETURNING *
        `;
        res.send(order[0]);
    }
    else{
        res.status(400).send(result);
    }
});

app.patch("/orders", async (req, res) => {
    const userResult = await UserPatchOrdersSchema.safeParse(req.body);
    const productResult = await ProductPatchOrdersSchema.safeParse(req.body);
    const paymentResult = await paymentPatchOrdersSchema.safeParse(req.body);
    if(userResult.success || productResult.success || paymentResult){
        var orderRes;
        if(userResult.success){
            const { orderId, userId } = userResult.data;
            const order = await sql`
            UPDATE orders
            SET userId=${userId}, updatedAt = now()
            WHERE orderId=${orderId}
            RETURNING *
            `;
            if(order.length > 0){
                orderRes = order[0];
            }
        }
        if(paymentResult.success){
            const { orderId, payment } = paymentResult.data;
            const order = await sql`
            UPDATE orders
            SET payment=${payment}, updatedAt = now()
            WHERE orderId=${orderId}
            RETURNING *
            `;
            if(order.length > 0){
                orderRes = order[0];
            }
        }
        if(productResult.success){
            const { orderId, productId } = productResult.data;

            const price = await sql`
            SELECT price FROM products WHERE id=${productId}
            `
            if(price.length == 0){
                res.status(400).send("The product does not exist");
            }

            const order = await sql`
            UPDATE orders
            SET productId=${productId}, total=${price[0].price * 1.2}, updatedAt = now()
            WHERE orderId=${orderId}
            RETURNING *
            `;
            if(order.length > 0){
                orderRes = order[0];
            }
        }
        res.send(orderRes??"The order don't exist");
    }
    else{
        res.status(400).send(userResult);
    }
});

app.delete("/orders/:id", async (req, res) => {
    const order = await sql`
    DELETE FROM orders 
    WHERE orderId=${req.params.id}
    RETURNING * 
    `;
    if(order.length > 0){
        res.send(order[0]);
    }
    else{
        res.status(404).body("Not found");
    }
});




app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});