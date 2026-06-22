import ProductService from '../../../src/domains/Product/services/ProductService';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import { QueryError } from '../../../errors/QueryError';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
    owner:   { findFirst: jest.Mock };
    product: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock; delete: jest.Mock };
};

describe('ProductService.findProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Retornar todos os produtos quando chamado sem filtros', async () => {
        const produtos = [
            { id: 1, name: 'Caixa', description: 'Desc', price: 10, quantity: 5, location: 12345678, ownerId: 1 },
            { id: 2, name: 'Pallet', description: 'Desc', price: 50, quantity: 2, location: 87654321, ownerId: 1 },
        ];
        prismaMock.product.findMany.mockResolvedValue(produtos);

        const resultado = await ProductService.findProducts();

        expect(resultado).toEqual(produtos);
        expect(prismaMock.product.findMany).toHaveBeenCalledWith({ where: {} });
    });

    it('Filtrar produtos por nome', async () => {
        prismaMock.product.findMany.mockResolvedValue([]);

        await ProductService.findProducts({ name: 'Caixa' });

        expect(prismaMock.product.findMany).toHaveBeenCalledWith({
            where: { name: { contains: 'Caixa' } },
        });
    });

    it('filtrar produtos por intervalo de preço', async () => {
        prismaMock.product.findMany.mockResolvedValue([]);

        await ProductService.findProducts({ minPrice: 10, maxPrice: 50 });

        expect(prismaMock.product.findMany).toHaveBeenCalledWith({
            where: { price: { gte: 10, lte: 50 } },
        });
    });
});

describe('ProductService.findProductsByOwner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('lançar QueryError quando o owner não existe', async () => {
        prismaMock.owner.findFirst.mockResolvedValue(null);

        await expect(ProductService.findProductsByOwner(99)).rejects.toThrow(QueryError);
    });

    it('retornar os produtos do owner quando ele existe', async () => {
        const owner = { id: 3, userId: 1 };
        const produtos = [
            { id: 1, name: 'Caixa', description: 'Desc', price: 10, quantity: 5, location: 12345678, ownerId: 3 },
        ];

        prismaMock.owner.findFirst.mockResolvedValue(owner);
        prismaMock.product.findMany.mockResolvedValue(produtos);

        const resultado = await ProductService.findProductsByOwner(1);

        expect(resultado).toEqual(produtos);
        expect(prismaMock.product.findMany).toHaveBeenCalledWith({ where: { ownerId: owner.id } });
    });
});

describe('ProductService.updateProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('lançar InvalidParamError quando a quantidade for negativa', async () => {
        await expect(
            ProductService.updateProduct(1, { quantity: -5 })
        ).rejects.toThrow(InvalidParamError);

        expect(prismaMock.product.update).not.toHaveBeenCalled();
    });

    it('atualizar o produto com sucesso', async () => {
        const produtoAtualizado = { id: 1, name: 'Novo Nome', description: 'Desc', price: 20, quantity: 10, location: 12345678, ownerId: 1 };
        prismaMock.product.update.mockResolvedValue(produtoAtualizado);

        const resultado = await ProductService.updateProduct(1, { name: 'Novo Nome', price: 20, quantity: 10 });

        expect(resultado).toEqual(produtoAtualizado);
        expect(prismaMock.product.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: expect.objectContaining({ name: 'Novo Nome', price: 20, quantity: 10 }),
        });
    });
});

describe('ProductService.deleteProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deletar o produto com sucesso', async () => {
        const produtoDeletado = { id: 1, name: 'Caixa', description: 'Desc', price: 10, quantity: 5, location: 12345678, ownerId: 1 };
        prismaMock.product.delete.mockResolvedValue(produtoDeletado);

        const resultado = await ProductService.deleteProduct(1);

        expect(resultado).toEqual(produtoDeletado);
        expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

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
