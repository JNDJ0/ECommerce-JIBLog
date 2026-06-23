import { User, Owner, Product, Order, Deliverer, Review } from '@prisma/client';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'user@test.com',
    name: 'Usuário Teste',
    password: 'hash',
    address: 12345678,
    role: 'user',
    ownerId: null,
    ...overrides,
  } as User;
}

export function makeOwner(overrides: Partial<Owner> = {}): Owner {
  return {
    id: 1,
    userId: 1,
    ...overrides,
  } as Owner;
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Produto Teste',
    price: 29.99,
    quantity: 10,
    ownerId: 1,
    ...overrides,
  } as Product;
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    code: 'ORDER-001',
    productId: 1,
    userId: 1,
    quantity: 1,
    payment: 'Pix',
    delivery: 0,
    status: 'PENDENTE',
    delivererId: null,
    ...overrides,
  } as Order;
}

export function makeDeliverer(overrides: Partial<Deliverer> = {}): Deliverer {
  return {
    id: 1,
    userId: 1,
    region: 'Centro',
    ...overrides,
  } as Deliverer;
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    orderId: 1,
    rating: 5,
    comment: null,
    ...overrides,
  } as Review;
}