import ProductService from '../../../src/domains/Product/services/ProductService';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import { QueryError } from '../../../errors/QueryError';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
    owner:   { findFirst: jest.Mock };
    product: { create: jest.Mock };
};

describe('ProductService.create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Lançar InvalidParamError se a quantidade for negativa', async () => {
        prismaMock.owner.findFirst.mockResolvedValue({ id: 1, userId: 1 });

        await expect(
            ProductService.create(
                { name: 'Produto', description: 'Desc', price: 10, quantity: -1, location: 12345678 } as any,
                1
            )
        ).rejects.toThrow(InvalidParamError);
    });

    it('Lançar QueryError quando o owner não existe', async () => {
        prismaMock.owner.findFirst.mockResolvedValue(null);

        await expect(
            ProductService.create(
                { name: 'Produto', description: 'Desc', price: 10, quantity: 5, location: 12345678 } as any,
                99
            )
        ).rejects.toThrow(QueryError);
    });

    it('Criar o produto com os dados corretos quando o owner existe', async () => {
        const owner = { id: 2, userId: 1 };
        const produtoCriado = { id: 10, name: 'Produto', description: 'Desc', price: 10, quantity: 5, location: 12345678, ownerId: 2 };

        prismaMock.owner.findFirst.mockResolvedValue(owner);
        prismaMock.product.create.mockResolvedValue(produtoCriado);

        const resultado = await ProductService.create(
            { name: 'Produto', description: 'Desc', price: 10, quantity: 5, location: 12345678 } as any,
            1
        );

        expect(resultado).toEqual(produtoCriado);
        expect(prismaMock.product.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ ownerId: owner.id, quantity: 5 }),
        });
    });
});
