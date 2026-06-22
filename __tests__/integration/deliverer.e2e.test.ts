import request from 'supertest';
import { sign } from 'jsonwebtoken';
import { app } from '../../config/expressConfig';
import prisma from '../../config/client';

const SECRET = 'test-secret';
process.env.SECRET_KEY = SECRET;

function makeJwt(payload: object) {
    return sign({ user: payload }, SECRET, { expiresIn: '1h' });
}

const prismaMock = prisma as unknown as {
    user:      { findFirst: jest.Mock; create: jest.Mock };
    deliverer: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    order:     { findMany: jest.Mock };
    $transaction: jest.Mock;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Deliverer — fluxo completo', () => {
    it('POST /api/deliverers/create — cadastra entregador com sucesso', async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({ id: 1, email: 'e@e.com', name: 'Eve', role: 'deliverer', password: 'hash', address: 12345678 });
        prismaMock.deliverer.create.mockResolvedValue({ id: 1, userId: 1, region: 'Sul' });

        const res = await request(app)
            .post('/api/deliverers/create')
            .send({ email: 'e@e.com', name: 'Eve', password: '123456', address: 12345678, region: 'Sul' });

        expect(res.status).toBe(200);
        expect(prismaMock.deliverer.create).toHaveBeenCalledTimes(1);
    });

    it('GET /api/deliverers/myOrders — retorna pedidos do entregador autenticado', async () => {
        const token = makeJwt({ id: 1, email: 'e@e.com', role: 'deliverer' });
        prismaMock.deliverer.findFirst.mockResolvedValue({ id: 1, userId: 1, region: 'Sul' });
        prismaMock.order.findMany.mockResolvedValue([{ id: 10, status: 'EM_ENTREGA', delivererId: 1 }]);

        const res = await request(app)
            .get('/api/deliverers/myOrders')
            .set('Cookie', `jwt=${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('PUT /api/deliverers/updateRegion — atualiza região com sucesso', async () => {
        const token = makeJwt({ id: 1, email: 'e@e.com', role: 'deliverer' });
        prismaMock.deliverer.findFirst.mockResolvedValue({ id: 1, userId: 1, region: 'Sul' });
        prismaMock.deliverer.update.mockResolvedValue({ id: 1, userId: 1, region: 'Norte' });

        const res = await request(app)
            .put('/api/deliverers/updateRegion')
            .set('Cookie', `jwt=${token}`)
            .send({ region: 'Norte' });

        expect(res.status).toBe(200);
        expect(prismaMock.deliverer.update).toHaveBeenCalledTimes(1);
    });

    it('DELETE /api/deliverers/delete — remove entregador com sucesso', async () => {
        const token = makeJwt({ id: 1, email: 'e@e.com', role: 'deliverer' });
        prismaMock.deliverer.findFirst.mockResolvedValue({ id: 1, userId: 1, region: 'Sul' });
        prismaMock.$transaction.mockResolvedValue([{}, {}]);

        const res = await request(app)
            .delete('/api/deliverers/delete')
            .set('Cookie', `jwt=${token}`);

        expect(res.status).toBe(200);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
});
