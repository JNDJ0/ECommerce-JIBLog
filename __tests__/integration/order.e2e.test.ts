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
    owner:   { findFirst: jest.Mock };
    product: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    order:   { create: jest.Mock };
    $transaction: jest.Mock;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Produto + Pedido — fluxo completo', () => {
    it('owner cria produto → user faz pedido (qty=2) → estoque decrementado em 2', async () => {
        const ownerToken = makeJwt({ id: 10, email: 'owner@test.com', role: 'owner' });
        const userToken  = makeJwt({ id: 20, email: 'user@test.com',  role: 'user' });

        const fakeOwner = { id: 5, userId: 10 };
        const fakeProduct = {
            id: 1, name: 'Camiseta', description: 'Azul', price: 50, quantity: 10,
            ownerId: 5, location: 12345678,
        };
        const fakeOrder = {
            id: 1, productId: 1, userId: 20, quantity: 2,
            payment: 'Pix', delivery: 120, status: 'PENDENTE', code: 'ABC123',
        };

        // 1) Owner cria produto
        prismaMock.owner.findFirst.mockResolvedValue(fakeOwner);
        prismaMock.product.create.mockResolvedValue(fakeProduct);

        const createProductRes = await request(app)
            .post('/api/products/create')
            .set('Cookie', `jwt=${ownerToken}`)
            .send({ name: 'Camiseta', description: 'Azul', price: 50, quantity: 10, location: 12345678 });

        expect(createProductRes.status).toBe(200);
        expect(prismaMock.product.create).toHaveBeenCalledTimes(1);

        // 2) User faz pedido com qty=2
        prismaMock.product.findFirst.mockResolvedValue(fakeProduct);
        // $transaction retorna [order, updatedProduct] (qty 10 → 8)
        const updatedProduct = { ...fakeProduct, quantity: fakeProduct.quantity - 2 };
        prismaMock.$transaction.mockResolvedValue([fakeOrder, updatedProduct]);

        const createOrderRes = await request(app)
            .post('/api/orders/create')
            .set('Cookie', `jwt=${userToken}`)
            .send({ productId: 1, quantity: 2, payment: 'Pix' });

        expect(createOrderRes.status).toBe(200);
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

        // 3) Verifica que product.update foi chamado com quantity decrementada em 2
        expect(prismaMock.product.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: fakeProduct.id },
                data:  expect.objectContaining({ quantity: fakeProduct.quantity - 2 }),
            }),
        );
    });
});
