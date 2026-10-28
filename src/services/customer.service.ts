import prisma from "../prisma";
import { CustomerType } from "@prisma/client";

// Customer Create Payload Interface definition
export interface ICreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  customerType?: CustomerType;
};

// Define TypeScript interface for the get all customers payload structure
export interface IGetAllCustomersPayload {
  searchTerm?: string;
  type?: string;
};

// Define TypeScript interface for the update customer status payload structure
export interface IUpdateCustomerStatusPayload {
  customerType: string;
};

// createCustomerService
export const createCustomerService = async (payload: ICreateCustomerPayload) => {

  // Check for a unique customer using the phone number in the database
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      phone: payload.phone,
    },
  });

  // If the customer already exists, return the existing customer record instead of creating a duplicate
  if (existingCustomer) {
    return existingCustomer;
  }

  // If not found, save them in the database as a new customer record
  const result = await prisma.customer.create({
    data: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      customerType: payload.customerType || CustomerType.REGULAR,
    },
  });

  // Return the newly created customer record
  return result;

};


// getAllCustomerService
export const getAllCustomerService = async (payload: IGetAllCustomersPayload) => {
  // Extract search term and customer type from the payload
  const { searchTerm, type } = payload;

  // Initialize the where clause conditions object for prisma query
  const whereConditions: any = {};

  // Check if a search term was provided, then add case-insensitive filter for name and phone
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

  // Check if a customer type filter was provided, then add it to the conditions
  if (type) {
    whereConditions.customerType = type;
  }

  // Retrieve customer records from the database including their orders and order items
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

    // Map through the retrieved customers to calculate aggregate total quantities and amounts from their orders
    const result = customers.map((customer: any) => {
      let totalQuantity = 0;
      let totalAmount = 0;

      // Iterate through each order to accumulate total amount and order item quantities
      customer.orders.forEach((order: any) => {
          totalAmount += Number(order.amount || 0);

          if (order.orderItems && order.orderItems.length > 0) {
            order.orderItems.forEach((item: any) => {
              totalQuantity += Number(item.quantity || 0);
            });
          }
        });

      // Return formatted customer summary object with computed totals
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

    // Return the final processed customer list
    return result;
  
};


// updateCustomerStatusService
export const updateCustomerStatusService = async (id: string,payload: IUpdateCustomerStatusPayload) => {
  // Perform database update query for the specific customer ID
  const result = await prisma.customer.update({
    where: { id },
    data: {
      customerType: payload.customerType as any,
    },
  });
  // Return the updated customer record
  return result;
};