const soap = require("soap");

soap.createClient("http://localhost:8000/products?wsdl", {}, function (err, client) {
    if(err) {
        console.error("Error creating SOAP client:", err);
        return;
    };
    /*client.CreateProduct({ name: "My Product", about:"test", price: 20}, function (err, result) {
        if(err) {
            console.error(
                "Error making SOAP request:",
                err.response.status,
                err.response.statusText,
                err.body
            );
            return;
        }
        console.log("Create result:", result);
    });
    client.GetProduct({ id: id }, function (err, result) {
        if(err) {
            console.error(
                "Error making SOAP request:",
                err.response.status,
                err.response.statusText,
                err.body
            );
            return;
        }
        console.log("Get result:", result);
    });*/
    /*client.PatchProduct({ id: 5, name: "new Name" }, function (err, result) {
        if(err) {
            console.error(
                "Error making SOAP request:",
                err.response.status,
                err.response.statusText,
                err.body
            );
            return;
        }
        console.log("Patch result:", result);
    });*/
    client.DeleteProduct({ id: 4 }, function (err, result) {
        if(err) {
            console.error(
                "Error making SOAP request:",
                err.response.status,
                err.response.statusText,
                err.body
            );
            return;
        }
        console.log("Delete result:", result);
    });
});