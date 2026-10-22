import { OrderStatus } from "@prisma/client";
import prisma from "../prisma";

// get all order payload
export interface IGetAllOrderPayload {
  user: { id: string; role: string };
  type?: string;
  searchTerm?: string;
}

// create order service
export const createOrderService = async (payload: any) => {
  const { customerId, name, phone, email, city, address, quantity, amount, cartItems } = payload;

  // ইউনিক ইনভয়েস নম্বর জেনারেট করা
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

  // Prisma Transaction ব্যবহার করে অর্ডার তৈরি এবং স্টক আপডেট করা
  const result = await prisma.$transaction(async (tx) => {
    // ১. মূল Order তৈরি করা
    const newOrder = await tx.order.create({
      data: {
        invoiceNo,
        customerId,
        name,
        phone,
        email,
        city,
        address,
        quantity,
        amount,
      },
    });

    // প্রতিটি কার্ট আইটেমের জন্য OrderItem তৈরি এবং স্টক কমানো
    for (const item of cartItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId || null,
          variantItemId: item.variantItemId || null,
          productName: item.productName,
          variantName: item.variantName || null,
          image: item.image || null,
          colorCode: item.colorCode || null,
          size: item.size || null,
          sellPrice: item.sellPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        },
      });

      // স্টক আপডেট (VariantItem অথবা মূল Product থেকে স্টক কমানো)
      if (item.variantItemId) {
        await tx.variantItem.update({
          where: { id: item.variantItemId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    return newOrder;
  });

  return result;
};

// getAllOrderService
export const getAllOrderService = async (payload: IGetAllOrderPayload) => {
  const { user, type, searchTerm } = payload;

  const andConditions: any[] = [];

  // ১. রোলভিত্তিক রেস্ট্রিকশন ও ডিফল্ট ফিল্টার
  if (user.role === "STAFF") {
    // স্টাফ শুধুমাত্র PROCESSING এবং CONFIRMED অর্ডার দেখতে পারবে[cite: 16]
    if (type && type.trim() !== "") {
      if (type !== "PROCESSING" && type !== "CONFIRMED") {
        throw new Error("You do not have permission to view this order status!");
      }
      andConditions.push({ status: type });
    } else {
      // বাই-ডিফল্ট স্টাফের জন্য PROCESSING এবং CONFIRMED দেখাবে[cite: 16]
      andConditions.push({
        status: { in: ["PROCESSING", "CONFIRMED"] },
      });
    }
    // স্টাফের ক্ষেত্রে সবসময় অ্যাক্টিভ অর্ডারগুলোই দেখাবে
    andConditions.push({ isRemoved: false });
  } else {
    // ADMIN বা MODERATOR-এর জন্য
    if (type && type.trim() !== "") {
      if (type === "CANCELLED") {
        // যদি টাইপ CANCELLED হয়, তবে সফট-ডিলিট বা রিমুভ হওয়া অর্ডারগুলো দেখাবে
        andConditions.push({ isRemoved: true });
      } else {
        // অন্য কোনো স্ট্যাটাস হলে সে অনুযায়ী ফিল্টার করবে এবং অ্যাক্টিভ অর্ডার দেখাবে
        andConditions.push({ status: type });
        andConditions.push({ isRemoved: false });
      }
    } else {
      // ডিফল্টভাবে এডমিন/মডারেটরের জন্য PENDING স্ট্যাটাস এবং অ্যাক্টিভ অর্ডার থাকবে[cite: 16]
      andConditions.push({ status: "PENDING" });
      andConditions.push({ isRemoved: false });
    }
  }

  // ২. সার্চ ফিল্টার (নাম বা ফোন নম্বর দিয়ে সার্চ করার জন্য)[cite: 16]
  if (searchTerm && searchTerm.trim() !== "") {
    const cleanedSearchTerm = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: cleanedSearchTerm, mode: "insensitive" } },
        { phone: { contains: cleanedSearchTerm, mode: "insensitive" } },
        { invoiceNo: { contains: cleanedSearchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

  // ৩. ডাটাবেজ থেকে অর্ডার কুয়েরি করা[cite: 16]
  const result = await prisma.order.findMany({
    where: whereConditions,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: true,
      orderItems: true,
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


// updateOrderStatusService
export const updateOrderStatusService = async (
  id: string,
  status: OrderStatus,
  user: { id: string; role: string }
) => {
  if (user.role === "STAFF") {
    if (status !== OrderStatus.PROCESSING && status !== OrderStatus.CONFIRMED) {
      throw new Error("Staff can only update status to PROCESSING or CONFIRMED!");
    }
  }

  // ১. বর্তমান অর্ডারের তথ্য ও তার সাথে যুক্ত orderItems আগে ফেচ করে নিব
  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: true },
  });

  if (!existingOrder) {
    throw new Error("Order not found!");
  }

  // ২. ট্রানজ্যাকশন শুরু
  return await prisma.$transaction(async (tx) => {
    
    // কন্ডিশন-১: আগের স্ট্যাটাস RETURNED ছিল না, কিন্তু নতুন স্ট্যাটাস RETURNED করা হলো
    // (মানে মাল ফেরত এসেছে, তাই স্টক বাড়াতে হবে)
    if (existingOrder.status !== OrderStatus.RETURNED && status === OrderStatus.RETURNED) {
      for (const item of existingOrder.orderItems) {
        if (item.variantItemId) {
          await tx.variantItem.update({
            where: { id: item.variantItemId },
            data: {
              stock: {
                increment: item.quantity, // স্টক আবার যুক্ত হবে
              },
            },
          });
        }
      }
    }

    // কন্ডিশন-২: আগের স্ট্যাটাস RETURNED ছিল, কিন্তু এখন রিটার্ন থেকে আবার অন্য কোনো স্ট্যাটাসে (যেমন: DELIVERED, PROCESSING, PENDING) নেওয়া হচ্ছে
    // (মানে প্রোডাক্টটি আবার কাস্টমারকে পাঠানো হচ্ছে, তাই স্টক কমবে)
    if (existingOrder.status === OrderStatus.RETURNED && status !== OrderStatus.RETURNED) {
      for (const item of existingOrder.orderItems) {
        if (item.variantItemId) {
          await tx.variantItem.update({
            where: { id: item.variantItemId },
            data: {
              stock: {
                decrement: item.quantity, // স্টক থেকে পুনরায় কমে যাবে
              },
            },
          });
        }
      }
    }

    // ৩. অর্ডারের স্ট্যাটাস আপডেট করা
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status },
    });

    return updatedOrder;
  });
};


// deleteOrderService
export const deleteOrderService = async (id: string) => {
  // ১. অর্ডারের তথ্য এবং তার সাথে থাকা orderItems খুঁজে আনা
  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: true },
  });

  if (!existingOrder) {
    throw new Error("Order not found!");
  }

  // ২. ট্রানজ্যাকশন শুরু
  return await prisma.$transaction(async (tx) => {
    // যদি অর্ডারটি আগে সফট-ডিলিট না হয়ে থাকে, তবে স্টক ফেরত বাড়ানো হবে
    if (!existingOrder.isRemoved) {
      for (const item of existingOrder.orderItems) {
        if (item.variantItemId) {
          await tx.variantItem.update({
            where: { id: item.variantItemId },
            data: {
              stock: {
                increment: item.quantity, // রিমুভ হওয়ার সাথে সাথে স্টক পুনরায় ভেরিয়েন্ট টেবিলে যোগ হবে
              },
            },
          });
        }
      }
    }

    // ৩. অর্ডারের isRemoved ট্রু করে দেওয়া
    const result = await tx.order.update({
      where: { id },
      data: { isRemoved: true },
    });

    return result;
  });
};
