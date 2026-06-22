import request from 'supertest';
import { hash } from 'bcrypt';
import { app } from '../../config/expressConfig';
import prisma from '../../config/client';

const SECRET = 'test-secret';
process.env.SECRET_KEY = SECRET;
process.env.JWT_EXPIRATION = '1h';

const prismaMock = prisma as unknown as {
    user: { findFirst: jest.Mock; create: jest.Mock };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('User — fluxo completo', () => {
    it('POST /api/users/create → POST /api/users/login → POST /api/users/myAccount retorna dados corretos', async () => {
        const plainPassword = 'senha123';
        const hashedPassword = await hash(plainPassword, 10);

        const fakeUser = {
            id: 1,
            email: 'joao@test.com',
            name: 'João',
            password: hashedPassword,
            address: 12345678,
            role: 'user',
        };

        // 1) Criação — email ainda não existe, depois retorna usuário criado
        prismaMock.user.findFirst
            .mockResolvedValueOnce(null)          // findByEmail no create: email livre
            .mockResolvedValueOnce(fakeUser)      // loginMiddleware: findByEmail retorna usuário
            .mockResolvedValueOnce(fakeUser);     // myAccount: findByEmail retorna usuário

        prismaMock.user.create.mockResolvedValue(fakeUser);

        const createRes = await request(app)
            .post('/api/users/create')
            .send({ email: fakeUser.email, name: fakeUser.name, password: plainPassword, address: fakeUser.address });

        expect(createRes.status).toBe(200);

        // 2) Login — obtém o cookie JWT
        const loginRes = await request(app)
            .post('/api/users/login')
            .send({ email: fakeUser.email, password: plainPassword });

        expect(loginRes.status).toBe(200);

        const cookies = loginRes.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeDefined();
        const jwtCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith('jwt='));
        expect(jwtCookie).toBeDefined();

        // 3) myAccount — usa o JWT para buscar os próprios dados
        const accountRes = await request(app)
            .post('/api/users/myAccount')
            .set('Cookie', jwtCookie!);

        expect(accountRes.status).toBe(200);
        expect(accountRes.body).toMatchObject({ email: fakeUser.email, name: fakeUser.name });
    });
});
