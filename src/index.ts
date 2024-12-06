import {Context, Hono} from 'hono';
import {StatusCode} from "hono/utils/http-status";

type Bindings = {
    DB: D1Database;
    TOKEN: string;
};

const STATUS_ERROR = 0;
const STATUS_OK = 1;

const app = new Hono<{ Bindings: Bindings }>();

// haiku
app.get('/api/haiku/latest', async (c) => {
    const {results} = await c.env.DB.prepare(
        "SELECT * FROM Haikus ORDER BY created_at DESC LIMIT 1;",
    ).all();
    return c.json(results.length > 0 ? results[0] : null);
});

app.get('/api/haiku/all', async (c) => {
    const {results} = await c.env.DB.prepare(
        "SELECT * FROM Haikus ORDER BY created_at;",
    ).all();
    return c.json(results);
});

app.put('/api/haiku/post', async (c) => {
    const {haiku, token} = await c.req.json();
    if (!haiku || !token) {
        return error(c, 'Missing required fields');
    }

    if (token !== c.env.TOKEN) {
        return error(c, 'Invalid token', 401);
    }

    await c.env.DB.prepare(
        "INSERT INTO Haikus (haiku) VALUES (?, ?, ?);",
    )
        .bind(haiku)
        .run();

    return ok(c);
});

// recent photo
app.get('/api/recent_photo/latests', async (c) => {
    const {results} = await c.env.DB.prepare(
        "SELECT * FROM RecentPhotos ORDER BY created_at DESC LIMIT 3;",
    ).all();
    return c.json(results);
});

app.get('/api/recent_photo/all', async (c) => {
    const {results} = await c.env.DB.prepare(
        "SELECT * FROM RecentPhotos ORDER BY created_at;",
    ).all();
    return c.json(results);
});

app.put('/api/recent_photo/post', async (c) => {
    const {description, place, image_url, token} = await c.req.json();
    if (!description || !place || !image_url || !token) {
        return error(c, 'Missing required fields');
    }

    if (token !== c.env.TOKEN) {
        return error(c, 'Invalid token', 401);
    }

    await c.env.DB.prepare(
        "INSERT INTO RecentPhotos (description, place, image_url) VALUES (?, ?, ?);",
    )
        .bind(description, place, image_url)
        .run();

    return ok(c);
});

function error(c: Context<{ Bindings: Bindings }>, message: string, status = 400) {
    return c.json({status: STATUS_ERROR, error: message}, status as StatusCode);
}

function ok(c: Context<{ Bindings: Bindings }>) {
    return c.json({status: STATUS_OK});
}

export default app
