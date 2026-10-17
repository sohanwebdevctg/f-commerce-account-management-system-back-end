import prisma from "../prisma";
import { CustomerType } from "@prisma/client";

// Customer Create Payload Interface
export interface ICreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  customerType?: CustomerType;
}

// get all customer payload
export interface IGetAllCustomersPayload {
  searchTerm?: string;
  type?: string;
}

// Update Customer Status Payload Interface
export interface IUpdateCustomerStatusPayload {
  customerType: string;
}

// createCustomerService
export const createCustomerService = async (payload: ICreateCustomerPayload) => {

  // Checking for a unique customer using the phone number
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      phone: payload.phone,
    },
  });

  // If the customer already exists, the existing customer record will be returned instead of saving a new one
  if (existingCustomer) {
    return existingCustomer;
  }

  // If not found, they will be saved in the database as a new customer
  const result = await prisma.customer.create({
    data: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      customerType: payload.customerType || CustomerType.REGULAR,
    },
  });

  return result;

}


// get all customer service
export const getAllCustomerService = async (payload: IGetAllCustomersPayload) => {
  const { searchTerm, type } = payload;

  const whereConditions: any = {};

  if (searchTerm) {
    const cleanedSearchTerm = searchTerm.trim().toLowerCase();
    whereConditions.OR = [
      {
        name: {
          contains: cleanedSearchTerm,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: cleanedSearchTerm,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (type) {
    whereConditions.customerType = type;
  }

    const customers = await prisma.customer.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerType: true,
        createdAt: true,
        orders: {
          select: {
            amount: true,
            orderItems: {
              select: {
                quantity: true,
              },
            },
          },
        }
      }
    });

    const result = customers.map((customer: any) => {
      let totalQuantity = 0;
      let totalAmount = 0;

      customer.orders.forEach((order: any) => {
          totalAmount += Number(order.amount || 0);

          if (order.orderItems && order.orderItems.length > 0) {
            order.orderItems.forEach((item: any) => {
              totalQuantity += Number(item.quantity || 0);
            });
          }
        });

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customerType: customer.customerType,
        createdAt: customer.createdAt,
        totalQuantity,
        totalAmount,
      };
    });

    return result;
  
};


// updateCustomerStatusService
export const updateCustomerStatusService = async (
  id: string,
  payload: IUpdateCustomerStatusPayload
) => {
  const result = await prisma.customer.update({
    where: { id },
    data: {
      customerType: payload.customerType as any,
    },
  });
  return result;
};