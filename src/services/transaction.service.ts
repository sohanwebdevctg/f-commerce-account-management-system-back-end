import prisma from '../prisma';
import { TransactionType, Role } from '@prisma/client';

interface ICreateTransactionPayload {
  type: TransactionType;
  amount: number;
  note?: string;
  createdById: string;
  userRole: Role;
}

interface IGetAllTransactionsQuery {
  searchTerm?: string;
  userId: string;
  userRole: Role;
}

interface IGetSingleTransactionPayload {
  id: string;
  userId: string;
  userRole: Role;
}

interface IGetTransactionSummaryPayload {
  userId: string;
  userRole: Role;
}

// createTransactionService
export const createTransactionService = async (payload: ICreateTransactionPayload) => {
  const { type, amount, note, createdById, userRole } = payload;

  // Business Logic: Only ADMIN can create INVESTMENT transactions
  if (type === TransactionType.INVESTMENT && userRole !== Role.ADMIN) {
    throw new Error('Only ADMIN can create INVESTMENT transactions!');
  }

  const transaction = await prisma.transaction.create({
    data: {
      type,
      amount,
      note,
      createdById,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return transaction;
};


// getAllTransactionsService
export const getAllTransactionsService = async (query: IGetAllTransactionsQuery) => {
  const { searchTerm, userId, userRole } = query;

  const whereConditions: any = {};

  if (userRole !== Role.ADMIN) {
    whereConditions.createdById = userId;
  }

  // Admin Search filter with TRIM
  if (userRole === Role.ADMIN && searchTerm) {
    const cleanedSearchTerm = searchTerm.trim();

    whereConditions.createdBy = {
      OR: [
        { name: { contains: cleanedSearchTerm, mode: 'insensitive' } },
        { email: { contains: cleanedSearchTerm, mode: 'insensitive' } },
      ],
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereConditions,
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return transactions;
};


// getSingleTransactionService
export const getSingleTransactionService = async (payload: IGetSingleTransactionPayload) => {
  const { id, userId, userRole } = payload;

  const whereConditions: any = { id };

  // Role based check: Non-Admin can only view their own transaction
  if (userRole !== Role.ADMIN) {
    whereConditions.createdById = userId;
  }

  const transaction = await prisma.transaction.findFirst({
    where: whereConditions,
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found or access denied!");
  }

  return transaction;
};


// getTransactionSummaryService
export const getTransactionSummaryService = async (payload: IGetTransactionSummaryPayload) => {
  const { userRole } = payload;

  // Strict check: Only ADMIN can access summary
  if (userRole !== Role.ADMIN) {
    throw new Error("Access denied! Only ADMIN can view transaction summary.");
  }

  // Aggregate total sums by type across all system transactions
  const summary = await prisma.transaction.groupBy({
    by: ['type'],
    _sum: {
      amount: true,
    },
  });

  let totalInvestment = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  summary.forEach((item) => {
    const sumAmount = Number(item._sum.amount || 0);
    if (item.type === 'INVESTMENT') {
      totalInvestment = sumAmount;
    } else if (item.type === 'INCOME') {
      totalIncome = sumAmount;
    } else if (item.type === 'EXPENSE') {
      totalExpense = sumAmount;
    }
  });

  return {
    totalInvestment,
    totalIncome,
    totalExpense,
  };
};