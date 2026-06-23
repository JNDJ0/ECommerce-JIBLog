import ReviewService from '../../../src/domains/Review/services/ReviewService';
import prisma from '../../../config/client';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import { QueryError } from '../../../errors/QueryError';
import { PermissionError } from '../../../errors/PermissionError';

const prismaMock = prisma as unknown as {
  order:  { findFirst: jest.Mock };
  review: { findFirst: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  owner:  { findFirst: jest.Mock };
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

describe('ReviewService.create — notas inválidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar InvalidParamError quando a nota é 0', async () => {
    await expect(ReviewService.create('CODE', 1, 0)).rejects.toThrow(InvalidParamError);
    await expect(ReviewService.create('CODE', 1, 0)).rejects.toThrow('A nota deve ser um número inteiro entre 1 e 5.');
  });

  it('deve lançar InvalidParamError quando a nota é 6', async () => {
    await expect(ReviewService.create('CODE', 1, 6)).rejects.toThrow(InvalidParamError);
    await expect(ReviewService.create('CODE', 1, 6)).rejects.toThrow('A nota deve ser um número inteiro entre 1 e 5.');
  });
});

describe('ReviewService.create — PermissionError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar PermissionError quando o pedido não está com status ENTREGUE', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 10, userId: 1, status: 'PENDENTE', productId: 1,
    });

    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow(PermissionError);
    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow('Só é possível avaliar pedidos com status ENTREGUE.');
  });

  it('deve lançar PermissionError quando o usuário não é o comprador do pedido', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 10, userId: 99, status: 'ENTREGUE', productId: 1,  // userId 99 ≠ userId 1 passado
    });

    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow(PermissionError);
    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow('Apenas o comprador pode avaliar o pedido.');
  });
});

describe('ReviewService.create — pedido já avaliado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar QueryError quando o pedido já possui uma review', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 10, userId: 1, status: 'ENTREGUE', productId: 1,
    });
    prismaMock.review.findFirst.mockResolvedValue({ id: 5, orderId: 10, rating: 3, comment: null });

    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow(QueryError);
    await expect(ReviewService.create('CODE', 1, 4)).rejects.toThrow('Este pedido já foi avaliado.');
  });
});

describe('ReviewService.create — pedido não encontrado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar QueryError quando o pedido não existe', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    await expect(ReviewService.create('INVALIDO', 1, 4)).rejects.toThrow(QueryError);
    await expect(ReviewService.create('INVALIDO', 1, 4)).rejects.toThrow('Pedido não encontrado.');
  });
});

describe('ReviewService.findByOrderCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar a review quando o pedido existe', async () => {
    const fakeOrder  = { id: 10, userId: 1, status: 'ENTREGUE', productId: 1 };
    const fakeReview = { id: 1, orderId: 10, rating: 5, comment: null };

    prismaMock.order.findFirst.mockResolvedValue(fakeOrder);
    prismaMock.review.findFirst.mockResolvedValue(fakeReview);

    const result = await ReviewService.findByOrderCode('CODE123');

    expect(result).toEqual(fakeReview);
    expect(prismaMock.order.findFirst).toHaveBeenCalledWith({ where: { code: 'CODE123' } });
  });

  it('deve lançar QueryError quando o pedido não existe', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    await expect(ReviewService.findByOrderCode('INVALIDO')).rejects.toThrow(QueryError);
    await expect(ReviewService.findByOrderCode('INVALIDO')).rejects.toThrow('Pedido não encontrado.');
  });
});

describe('ReviewService.findByOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar reviews do owner quando encontrado', async () => {
    const fakeOwner   = { id: 5, userId: 1 };
    const fakeReviews = [{ id: 1, orderId: 10, rating: 4, comment: 'Bom' }];

    prismaMock.owner.findFirst.mockResolvedValue(fakeOwner);
    prismaMock.review.findMany.mockResolvedValue(fakeReviews);

    const result = await ReviewService.findByOwner(1);

    expect(result).toEqual(fakeReviews);
    expect(prismaMock.owner.findFirst).toHaveBeenCalledWith({ where: { userId: 1 } });
  });

  it('deve lançar QueryError quando owner não encontrado', async () => {
    prismaMock.owner.findFirst.mockResolvedValue(null);

    await expect(ReviewService.findByOwner(99)).rejects.toThrow(QueryError);
    await expect(ReviewService.findByOwner(99)).rejects.toThrow('Owner não encontrado.');
  });
});