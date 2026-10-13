import prisma from "../prisma";
import { TransactionType } from "@prisma/client";

// create transaction type
export interface ICreateTransactionPayload {
  amount: number;
  type: TransactionType;
  note?: string;
  createdById: string;
}

export interface IGetAllTransactionsPayload {
  user: {id: string;role: string;};
  startDate?: string;
  endDate?: string;
  type?: string;
  searchTerm?: string;
}

export interface IUpdateTransactionPayload {
  amount: number;
  type: TransactionType;
  note?: string;
}

// Create Transaction Service
export const createTransactionService = async (payload: ICreateTransactionPayload) => {
  const result = await prisma.transaction.create({
    data: {
      amount: payload.amount,
      type: payload.type,
      note: payload.note,
      createdById: payload.createdById,
    },
  });

  return result;
};


// getAllTransactionService
export const getAllTransactionService = async (payload: IGetAllTransactionsPayload) => {
  const { user, startDate, endDate, type, searchTerm } = payload;

  const andConditions: any[] = [];

  // Role based check
  if (user.role !== "ADMIN") {
    andConditions.push({ userId: user.id });
  }

  // Type filter
  if (type && type.trim() !== "") {
    andConditions.push({ type: type });
  }

  // Date range filter
  if (startDate || endDate) {
    const dateCondition: any = {};
    if (startDate) {
      dateCondition.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.lte = end;
    }
    andConditions.push({ createdAt: dateCondition });
  }

  // Search filter (For ADMIN only: search by user name or email)
  if (searchTerm && searchTerm.trim() !== "" && user.role === "ADMIN") {
    const cleanedSearchTerm = searchTerm.trim();
    andConditions.push({
      createdBy: {
        OR: [
          { name: { contains: cleanedSearchTerm, mode: "insensitive" } },
          { email: { contains: cleanedSearchTerm, mode: "insensitive" } },
        ],
      },
    });
  }

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  // Retrieving data from the database
  const result = await prisma.transaction.findMany({
    where: whereConditions,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      type: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// getDashboardSummaryService
export const getDashboardSummaryService = async (userId: string, role: string) => {
  // Filter field setup based on user roles
  const whereCondition: any = role === 'ADMIN' ? {} : { createdById: userId };

  // Calculating the sum of amounts by type using Prisma
  const summary = await prisma.transaction.groupBy({
    by: ['type'],
    where: whereCondition,
    _sum: {
      amount: true,
    },
  });

  // Extracting values ​​from the obtained data
  const totalIncome = summary.find((s) => s.type === 'INCOME')?._sum.amount || 0;
  const totalExpense = summary.find((s) => s.type === 'EXPENSE')?._sum.amount || 0;
  
  // For ADMIN, track investment details; for others, mark as 'undefined' (or omit)
  const totalInvestment = role === 'ADMIN' 
    ? (summary.find((s) => s.type === 'INVESTMENT')?._sum.amount || 0) 
    : undefined;

  return {
    totalIncome,
    totalExpense,
    ...(role === 'ADMIN' && { totalInvestment }),
  };
};


// getSingleTransactionService
export const getSingleTransactionService = async (id: string) => {
  const result = await prisma.transaction.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      type: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return result;
}


// updateSingleTransactionService
export const updateSingleTransactionService = async (id: string, payload: IUpdateTransactionPayload) => {
  const result = await prisma.transaction.update({
    where: { id },
    data: {
      amount: payload.amount,
      type: payload.type,
      note: payload.note,
    },
  });

  return result;
};