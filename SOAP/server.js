const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");

const sql = postgres({ db: "mydb", user: "user", password: "password"});

const service = {
    ProductsService: {
        ProductsPort: {
            CreateProduct: async function ({ name, about, price }, callback) {
                if(!name ||!about ||!price){
                    throw {
                        Fault: {
                            Code: {
                                Value: "soap:Sender",
                                Subcode: { value: "rpc:BadArguments" },
                            },
                            Reason: { Text: "Processing Error"},
                            statusCode: 400,
                        },
                    };
                }
                const product = await sql`
                INSERT INTO products (name, about, price) 
                VALUES (${name}, ${about}, ${price}) 
                RETURNING *
                `;
                callback(product[0]);
            },
            GetProduct: async function ({ id }, callback) {
                if(!id){
                    throw {
                        Fault: {
                            Code: {
                                Value: "soap:Sender",
                                Subcode: { value: "rpc:BadArguments" },
                            },
                            Reason: { Text: "Processing Error"},
                            statusCode: 400,
                        },
                    };
                }
                const product = await sql`
                SELECT * FROM products
                WHERE id=${id};
                `;
                callback(product[0]);
            },
            DeleteProduct: async function ({ id }, callback) {
                if(!id){
                    throw {
                        Fault: {
                            Code: {
                                Value: "soap:Sender",
                                Subcode: { value: "rpc:BadArguments" },
                            },
                            Reason: { Text: "Processing Error"},
                            statusCode: 400,
                        },
                    };
                }
                await sql`
                delete from products where products.id=${id};
                `;
                callback(["Successfully deleted"]);
            },
            PatchProduct: async function ({ id, name, about, price }, callback) {
                if(!id || (!name && !about && !price)){
                    throw {
                        Fault: {
                            Code: {
                                Value: "soap:Sender",
                                Subcode: { value: "rpc:BadArguments" },
                            },
                            Reason: { Text: "Processing Error"},
                            statusCode: 400,
                        },
                    };
                }
                line = "";
                if(name){
                    line += `name=${name},`
                }
                if(name){
                    line += `name=${about},`
                }
                if(name){
                    line += `name=${price},`
                }
                line.slice(0, -1);
                const product = await sql`
                update products
                set ${line}
                where id=${id}
                returning *;
                `;
                callback("Successfully deleted");
            },
        }
    }
}

const server = http.createServer(function (request, response) {
    response.end("404: Not Found: " + request.url);
});

server.listen(8000);

const xml = fs.readFileSync("productsService.wsdl", "utf-8");
soap.listen(server, "/products", service, xml, function() {
    console.log("SOAP server running at http://localhost:8000/products?wsdl");
});