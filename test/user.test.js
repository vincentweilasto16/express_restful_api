import supertest from "supertest";
import {web} from "../src/application/web"
import { logger } from "../src/application/logging";
import { createTestUser, getTestUser, removeTestUser } from "./test-util.js"
import bcrypt from "bcrypt";

// Register User API TEST
describe('POST /api/users', function (){

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can register new user', async () => {
        const result = await supertest(web)
            .post('/api/users')
            .send({
                username: 'test',
                password: "rahasia",
                name: "test"
            });

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("test");
        expect(result.body.data.password).toBeUndefined();
    });

    it('should reject if request is invalid', async () => {
        const result = await supertest(web)
            .post('/api/users')
            .send({
                username: '',
                password: "",
                name: ""
            });

        logger.info(result.body);

        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();
    });

    it('should reject if username already registered', async () => {
        let result = await supertest(web)
            .post('/api/users')
            .send({
                username: 'test',
                password: "rahasia",
                name: "test"
            });

        logger.info(result.body);

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("test");
        expect(result.body.data.password).toBeUndefined();

        result = await supertest(web)
        .post('/api/users')
        .send({
            username: 'test',
            password: "rahasia",
            name: "test"
        });

        logger.info(result.body);

        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();
    });
});

// Login User API TEST
describe('POST /api/users/login', function (){
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can login', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: 'test',
                password: "rahasia",
            });
        
        logger.info(result.body);

        expect(result.status).toBe(200);
        expect(result.body.data.token).toBeDefined();
        expect(result.body.data.token).not.toBe("test");
    });

    it('should reject login if request is invalid', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "",
                password: "",
            });
        
        logger.info(result.body);

        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();
    });

    it('should reject login if password is wrong', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: 'test',
                password: "salah",
            });
        
        logger.info(result.body);

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });

    it('should reject login if username is wrong', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "salah",
                password: "salah",
            });
        
        logger.info(result.body);

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});

// Get User API TEST
describe('GET /api/users/current', function (){
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can get current user', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', 'test');
        
        logger.info(result.body);

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("test");
    });

    it('should reject if token is invalid', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', 'salah');
        
        logger.info(result.body);

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});

// Update User API TEST
describe('PATCH /api/users/current', function (){
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can update user', async () => {
        const result = await supertest(web)
            .patch('/api/users/current')
            .set('Authorization', 'test')
            .send({
                name: "Vincent",
                password: "rahasialagi"
            });
        
        logger.info(result.body);

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("Vincent");

        const user = await getTestUser();
        expect(await bcrypt.compare("rahasialagi", user.password)).toBe(true);
    });

    it('should can update user name', async () => {
        const result = await supertest(web)
            .patch('/api/users/current')
            .set('Authorization', 'test')
            .send({
                name: "Vincent",
            });
        
        logger.info(result.body);

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("Vincent");
    });

    it('should can update user password', async () => {
        const result = await supertest(web)
            .patch('/api/users/current')
            .set('Authorization', 'test')
            .send({
                password: "rahasialagi",
            });

        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("test");
        expect(result.body.data.name).toBe("test");

        const user = await getTestUser();
        expect(await bcrypt.compare("rahasialagi", user.password)).toBe(true);
    });

    it('should reject if request is not valid', async () => {
        const result = await supertest(web)
            .patch('/api/users/current')
            .set('Authorization', 'salah')
            .send({});

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});

// Logout User API TEST
describe('DELETE /api/users/logout', function (){
    beforeEach(async () => {
        await createTestUser();
    });

    afterEach(async () => {
        await removeTestUser();
    });

    it('should can logout', async () => {
        const result = await supertest(web)
            .delete('/api/users/logout')
            .set('Authorization', 'test');

        expect(result.status).toBe(200);
        expect(result.body.data).toBe("OK");

        const user = await getTestUser();
        expect(user.token).toBe(null);
    });

    it('should reject logout if token is invalid', async () => {
        const result = await supertest(web)
            .delete('/api/users/logout')
            .set('Authorization', 'salah');

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    });
});