
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
  order:     { findFirst: jest.Mock; update: jest.Mock };
  deliverer: { findFirst: jest.Mock };
  product:   { update: jest.Mock };
  $transaction: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Fluxo de status do pedido', () => {
  const baseOrder = {
    id: 1,
    code: 'PEDIDO-001',
    productId: 1,
    userId: 20,
    quantity: 1,
    payment: 'Pix',
    delivery: 70,
  };

  it('owner confirma → deliverer move para EM_ENTREGA → deliverer move para ENTREGUE', async () => {
    const ownerToken     = makeJwt({ id: 10, email: 'owner@test.com', role: 'owner' });
    const delivererToken = makeJwt({ id: 30, email: 'del@test.com',   role: 'deliverer' });
    const fakeDeliverer  = { id: 5, userId: 30, region: 'Sul' };

    // 1) Owner: PENDENTE → CONFIRMADO
    prismaMock.order.findFirst.mockResolvedValue({ ...baseOrder, status: 'PENDENTE' });
    prismaMock.order.update.mockResolvedValue({ ...baseOrder, status: 'CONFIRMADO' });

    const confirmRes = await request(app)
      .put('/api/orders/updateStatus/PEDIDO-001')
      .set('Cookie', `jwt=${ownerToken}`)
      .send({ status: 'CONFIRMADO' });

    expect(confirmRes.status).toBe(200);

    prismaMock.order.findFirst.mockResolvedValue({ ...baseOrder, status: 'CONFIRMADO' });
    prismaMock.deliverer.findFirst.mockResolvedValue(fakeDeliverer);
    prismaMock.order.update.mockResolvedValue({ ...baseOrder, status: 'EM_ENTREGA', delivererId: fakeDeliverer.id });

    const emEntregaRes = await request(app)
      .put('/api/orders/updateStatus/PEDIDO-001')
      .set('Cookie', `jwt=${delivererToken}`)
      .send({ status: 'EM_ENTREGA' });

    expect(emEntregaRes.status).toBe(200);

    prismaMock.order.findFirst.mockResolvedValue({ ...baseOrder, status: 'EM_ENTREGA', delivererId: fakeDeliverer.id });
    prismaMock.order.update.mockResolvedValue({ ...baseOrder, status: 'ENTREGUE' });

    const entregueRes = await request(app)
      .put('/api/orders/updateStatus/PEDIDO-001')
      .set('Cookie', `jwt=${delivererToken}`)
      .send({ status: 'ENTREGUE' });

    expect(entregueRes.status).toBe(200);
  });
});