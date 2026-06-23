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
  order:  { findFirst: jest.Mock };
  review: { findFirst: jest.Mock; create: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Review — fluxo completo', () => {
  it('pedido ENTREGUE → user cria review → GET /api/reviews/order/:code retorna review', async () => {
    const userToken = makeJwt({ id: 1, email: 'user@test.com', role: 'user' });

    const fakeOrder  = { id: 10, code: 'PEDIDO-XYZ', userId: 1, status: 'ENTREGUE', productId: 1, quantity: 1 };
    const fakeReview = { id: 1, orderId: 10, rating: 5, comment: 'Excelente!' };

    prismaMock.order.findFirst.mockResolvedValue(fakeOrder);
    prismaMock.review.findFirst.mockResolvedValue(null);   // ainda não avaliado
    prismaMock.review.create.mockResolvedValue(fakeReview);

    const createRes = await request(app)
      .post('/api/reviews/create')
      .set('Cookie', `jwt=${userToken}`)
      .send({ code: 'PEDIDO-XYZ', rating: 5, comment: 'Excelente!' });

    expect(createRes.status).toBe(200);

    prismaMock.order.findFirst.mockResolvedValue(fakeOrder);
    prismaMock.review.findFirst.mockResolvedValue(fakeReview);

    const getRes = await request(app)
      .get('/api/reviews/order/PEDIDO-XYZ');

    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({ rating: 5, comment: 'Excelente!' });
  });
});