const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../src/models/User');

beforeAll(async () => {
  const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/testdb";
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/signup', () => {
  it('should create a new user and return profile data', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("username", "testuser");
    expect(res.body).toHaveProperty("email", "test@example.com");
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should not allow signup with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: "testuser2" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "All fields are required");
  });

  it('should not allow duplicate email or username', async () => {
    await User.create({
      name: "Existing",
      username: "existinguser",
      email: "existing@example.com",
      passwordHash: "hashed"
    });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: "Test User",
        username: "existinguser",
        email: "existing@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error");
  });
});
