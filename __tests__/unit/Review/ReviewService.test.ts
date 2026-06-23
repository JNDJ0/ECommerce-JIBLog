import ReviewService from '../../../src/domains/Review/services/ReviewService';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
  order:  { findFirst: jest.Mock };
  review: { findFirst: jest.Mock; create: jest.Mock };
};

describe('ReviewService.create — notas válidas e comentário opcional', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve aceitar nota mínima (1) e salvar review sem comentário', async () => {
    const fakeOrder = { id: 10, userId: 1, status: 'ENTREGUE', productId: 1 };
    const fakeReview = { id: 1, orderId: 10, rating: 1, comment: null };

    prismaMock.order.findFirst.mockResolvedValue(fakeOrder);
    prismaMock.review.findFirst.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue(fakeReview);

    const result = await ReviewService.create('CODE123', 1, 1);

    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: { orderId: fakeOrder.id, rating: 1, comment: null },
    });
    expect(result).toEqual(fakeReview);
  });

  it('deve aceitar nota máxima (5) e salvar comentário opcional quando fornecido', async () => {
    const fakeOrder = { id: 10, userId: 1, status: 'ENTREGUE', productId: 1 };
    const fakeReview = { id: 2, orderId: 10, rating: 5, comment: 'Ótimo serviço!' };

    prismaMock.order.findFirst.mockResolvedValue(fakeOrder);
    prismaMock.review.findFirst.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue(fakeReview);

    const result = await ReviewService.create('CODE123', 1, 5, 'Ótimo serviço!');

    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: { orderId: fakeOrder.id, rating: 5, comment: 'Ótimo serviço!' },
    });
    expect(result).toEqual(fakeReview);
  });
});