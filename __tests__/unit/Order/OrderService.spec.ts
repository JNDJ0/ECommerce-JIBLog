import orderService from '../../../src/domains/Order/services/OrderService';
import prisma from '../../../__mocks__/prisma';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import { QueryError } from '../../../errors/QueryError';
import { PermissionError } from '../../../errors/PermissionError';

// Limpa todos os mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

describe('OrderService.create — pagamento inválido', () => {
  it('deve lançar InvalidParamError quando o método de pagamento é inválido', async () => {
    const body = {
      payment: 'Boleto', // inválido
      productId: 1,
      quantity: 1,
    } as any;

    await expect(orderService.create(body, 1)).rejects.toThrow(InvalidParamError);
    await expect(orderService.create(body, 1)).rejects.toThrow('Método inválido de pagamento');
  });
});

describe('OrderService.create — validações de estoque', () => {
  it('deve lançar QueryError quando o produto não existe (sem estoque registrado)', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    const body = { payment: 'Pix', productId: 99, quantity: 1 } as any;

    await expect(orderService.create(body, 1)).rejects.toThrow(QueryError);
    await expect(orderService.create(body, 1)).rejects.toThrow('Produto não encontrado.');
  });

  it('deve lançar QueryError quando o produto está com estoque zerado', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      quantity: 0,
      price: 50,
    });

    const body = { payment: 'Pix', productId: 1, quantity: 1 } as any;

    await expect(orderService.create(body, 1)).rejects.toThrow(QueryError);
    await expect(orderService.create(body, 1)).rejects.toThrow('Produto sem estoque disponível.');
  });

  it('deve lançar InvalidParamError quando a quantidade pedida excede o estoque disponível', async () => {
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      quantity: 2,
      price: 50,
    });

    const body = { payment: 'Pix', productId: 1, quantity: 5 } as any;

    await expect(orderService.create(body, 1)).rejects.toThrow(InvalidParamError);
    await expect(orderService.create(body, 1)).rejects.toThrow('Estoque insuficiente. Disponível: 2');
  });
});

describe('OrderService.create — sucesso', () => {
  it('deve criar o pedido e decrementar o estoque pela quantidade pedida', async () => {
    const product = { id: 1, quantity: 10, price: 100 };
    const createdOrder = {
      id: 1,
      payment: 'Cartão',
      delivery: 100 * 2 + 20,
      quantity: 2,
      status: 'PENDENTE',
      userId: 42,
      productId: 1,
    };

    (prisma.product.findFirst as jest.Mock).mockResolvedValue(product);
    (prisma.$transaction as jest.Mock).mockResolvedValue([createdOrder, {}]);

    const body = { payment: 'Cartão', productId: 1, quantity: 2 } as any;
    const result = await orderService.create(body, 42);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual(createdOrder);
    expect(result.quantity).toBe(2);
  });
});

describe('OrderService.updateStatus — transições de status', () => {
  const baseOrder = {
    id: 10,
    code: 'ABC123',
    status: 'PENDENTE',
    productId: 1,
    quantity: 2,
  };

  it('owner deve poder mover PENDENTE → CONFIRMADO', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({ ...baseOrder, status: 'PENDENTE' });
    (prisma.order.update as jest.Mock).mockResolvedValue({});

    await expect(
      orderService.updateStatus('ABC123', 'CONFIRMADO', 'owner', 1)
    ).resolves.not.toThrow();

    expect(prisma.order.update).toHaveBeenCalledTimes(1);
  });

  it('deliverer deve poder mover CONFIRMADO → EM_ENTREGA', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({ ...baseOrder, status: 'CONFIRMADO' });
    (prisma.deliverer.findFirst as jest.Mock).mockResolvedValue({ id: 5, userId: 7 });
    (prisma.order.update as jest.Mock).mockResolvedValue({});

    await expect(
      orderService.updateStatus('ABC123', 'EM_ENTREGA', 'deliverer', 7)
    ).resolves.not.toThrow();
  });

  it('deliverer deve poder mover EM_ENTREGA → ENTREGUE', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({ ...baseOrder, status: 'EM_ENTREGA' });
    (prisma.order.update as jest.Mock).mockResolvedValue({});

    await expect(
      orderService.updateStatus('ABC123', 'ENTREGUE', 'deliverer', 7)
    ).resolves.not.toThrow();
  });

  it('deve lançar PermissionError para transição inválida (user tenta PENDENTE → CONFIRMADO)', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({ ...baseOrder, status: 'PENDENTE' });

    await expect(
      orderService.updateStatus('ABC123', 'CONFIRMADO', 'user', 1)
    ).rejects.toThrow(PermissionError);
  });
});

describe('OrderService.updateOrder — pedido não encontrado', () => {
  it('deve lançar QueryError quando o pedido não existe', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(orderService.updateOrder('INEXISTENTE', {} as any)).rejects.toThrow(QueryError);
    await expect(orderService.updateOrder('INEXISTENTE', {} as any)).rejects.toThrow('Pedido não encontrado.');
  });
});

describe('OrderService.deleteOrder — pedido não encontrado', () => {
  it('deve lançar QueryError quando o pedido não existe', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(orderService.deleteOrder('INEXISTENTE')).rejects.toThrow(QueryError);
    await expect(orderService.deleteOrder('INEXISTENTE')).rejects.toThrow('Pedido não encontrado.');
  });
});

describe('OrderService.findByCode', () => {
  it('deve retornar o pedido pelo código', async () => {
    const fakeOrder = { id: 1, code: 'ABC123', status: 'PENDENTE' };
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(fakeOrder);

    const result = await orderService.findByCode('ABC123');

    expect(result).toEqual(fakeOrder);
    expect(prisma.order.findFirst).toHaveBeenCalledWith({ where: { code: 'ABC123' } });
  });
});

describe('OrderService.findOrdersByUser', () => {
  it('deve retornar pedidos do usuário', async () => {
    const fakeOrders = [{ id: 1, userId: 5 }, { id: 2, userId: 5 }];
    (prisma.order.findMany as jest.Mock).mockResolvedValue(fakeOrders);

    const result = await orderService.findOrdersByUser(5);

    expect(result).toEqual(fakeOrders);
    expect(prisma.order.findMany).toHaveBeenCalledWith({ where: { userId: 5 } });
  });
});

describe('OrderService.findOrders', () => {
  it('deve retornar todos os pedidos', async () => {
    const fakeOrders = [{ id: 1 }, { id: 2 }];
    (prisma.order.findMany as jest.Mock).mockResolvedValue(fakeOrders);

    const result = await orderService.findOrders();

    expect(result).toEqual(fakeOrders);
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('OrderService.updateStatus — cancelamento devolve estoque', () => {
  it('deve cancelar pedido e devolver quantidade ao estoque', async () => {
    const order = { id: 10, code: 'ABC123', status: 'PENDENTE', productId: 1, quantity: 3 };
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(order);
    (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

    await orderService.updateStatus('ABC123', 'CANCELADO', 'owner', 1);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('deve lançar QueryError quando pedido não encontrado', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(orderService.updateStatus('INVALIDO', 'CONFIRMADO', 'owner', 1))
      .rejects.toThrow(QueryError);
  });
});

