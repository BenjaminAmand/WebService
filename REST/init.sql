CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    about VARCHAR(500),
    price FLOAT
);

CREATE TABLE users (
    username VARCHAR(100) PRIMARY KEY,
    password VARCHAR(500),
    email VARCHAR(100) UNIQUE
);

CREATE TABLE orders (
    orderId SERIAL PRIMARY KEY,
    userId VARCHAR(100) REFERENCES users(username),
    productId INT REFERENCES products(id),
    total FLOAT,
    payment BOOLEAN DEFAULT false,
    createdAt DATE,
    updatedAt DATE
);

INSERT INTO products (name, about, price) VALUES
('My first game', 'This is an awesome game', '60');