const http = require("http");
const { Client } = require("pg");

// Настройки подключения к PostgreSQL
const client = new Client({
    user: "postgres", // Имя пользователя для подключения к базе
    host: "localhost", // Адрес базы данных (если Docker, то возможно 'localhost' или IP контейнера)
    database: "lecture", // Имя базы данных
    password: "postgres", // Пароль для подключения
    port: 5432, // Порт для подключения (стандартный порт для PostgreSQL)
});

// Подключаемся к базе данных
client
    .connect()
    .then(async () => {
        console.log("Connected to PostgreSQL");

        // SQL-запрос для создания таблицы, если она не существует
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL
            );
        `;

        // Выполняем запрос на создание таблицы
        await client.query(createTableQuery);
        console.log('Table "users" is ready');
    })
    .catch((err) => console.error("Connection error", err.stack));

// Функция для обработки POST запросов
function handlePostRequest(req, res) {
    let body = "";

    // Событие для получения данных от клиента
    req.on("data", (chunk) => {
        body += chunk.toString(); // Собираем данные
    });

    // Событие для завершения получения данных
    req.on("end", async () => {
        try {
            const parsedData = JSON.parse(body); // Парсим JSON из тела запроса

            const { firstName, lastName, email } = parsedData; // Деструктуризация полей

            // SQL-запрос для вставки данных
            const query = `
                        INSERT INTO users (first_name, last_name, email)
                        VALUES ($1, $2, $3)
                        RETURNING *;
                    `;

            // Выполняем SQL-запрос к базе данных
            const result = await client.query(query, [
                firstName,
                lastName,
                email,
            ]);

            // Ответ клиенту
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(
                JSON.stringify({
                    message: "User saved successfully!",
                    user: result.rows[0],
                })
            );
        } catch (error) {
            // Обработка ошибки если JSON невалиден
            res.writeHead(400, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify({ message: "Invalid JSON" }));
        }
    });
}

// Функция для обработки GET запросов и получения всех пользователей
async function handleGetUsersRequest(req, res) {
    try {
        // SQL-запрос для получения всех пользователей
        const query = "SELECT * FROM users;";

        // Выполняем SQL-запрос к базе данных
        const result = await client.query(query);

        console.log("Users retrieved:", result.rows); // Логируем полученных пользователей

        // Отправляем список пользователей клиенту
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Разрешаем CORS для всех доменов
        });

        res.end(JSON.stringify({ users: result.rows }));
    } catch (error) {
        console.error("Error retrieving users:", error);

        res.writeHead(500, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        res.end(
            JSON.stringify({
                message: "Error retrieving users",
                error: error.message,
            })
        );
    }
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    // Добавляем CORS заголовки для всех запросов
    res.setHeader("Access-Control-Allow-Origin", "*"); // Разрешаем любые домены
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); // Разрешаем методы
    res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Разрешаем заголовки

    if (req.method === "OPTIONS") {
        // Обрабатываем preflight запрос
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/submit") {
        handlePostRequest(req, res); // Обрабатываем POST запросы по пути /submit
    } else if (req.method === "GET" && req.url === "/users") {
        handleGetUsersRequest(req, res); // Обрабатываем GET запросы по пути /users
    } else {
        // Если запрос не соответствует эндпоинту или методу, возвращаем 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
    }
});

// Слушаем сервер на порту 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
