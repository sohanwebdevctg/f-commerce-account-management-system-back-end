import { OrderStatus, Prisma } from "@prisma/client";
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


// getSingleOrderService
export const getSingleOrderService = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      invoiceNo: true,
      // অর্ডারের সময় ব্যবহৃত কাস্টমারের নাম, যোগাযোগ ও ঠিকানা
      name: true,
      phone: true,
      email: true,
      city: true,
      address: true,
      quantity: true,
      amount: true,
      status: true,
      isRemoved: true,
      createdAt: true,
      updatedAt: true,

      // কাস্টমার প্রোফাইলের মূল ডাটা
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          customerType: true,
        },
      },

      // অর্ডারের ভেতরের প্রোডাক্ট আইটেমসমূহ
      orderItems: {
        select: {
          id: true,
          orderId: true,
          productId: true,
          variantId: true,
          variantItemId: true,
          productName: true,
          variantName: true,
          image: true,          // প্রোডাক্ট/ভেরিয়েন্টের অরিজিনাল ছবি
          colorCode: true,      // কালার কোড (অপশনাল)
          size: true,           // সাইজ (অপশনাল)
          sellPrice: true,      // একক দাম
          quantity: true,       // কত পিস অর্ডার করেছে
          damagedQuantity: true,// নষ্ট বা ড্যামেজ হওয়া প্রোডাক্ট সংখ্যা
          totalPrice: true,     // মোট দাম (sellPrice * quantity)
        },
      },

      // যে স্টাফ/এডমিন অর্ডারটি এন্ট্রি করেছে
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found!");
  }

  // প্রতিটি অর্ডারের আইটেমের totalPrice সঠিকভাবে ক্যালকুলেট করে আপডেট করে দেওয়া
  const updatedOrderItems = order.orderItems.map((item) => ({
    ...item,
    totalPrice: Number(item.sellPrice) * Number(item.quantity), // এখানে গুণ করে সঠিক টোটাল প্রাইস বের করা হলো
  }));

  return {
    ...order,
    orderItems: updatedOrderItems,
  };
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

// updateOrderQuantityService
export const updateOrderQuantityService = async (itemId: string, type: "increment" | "decrement") => {
  
  return await prisma.$transaction(async (tx) => {
    // ১. অর্ডার আইটেম এবং তার সাথে সম্পর্কিত VariantItem ও Order খুঁজে বের করা
    const orderItem = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: { id: true },
        },
        variantItem: {
          select: { id: true, stock: true },
        },
      },
    });

    if (!orderItem) {
      throw new Error("Order item not found!");
    }

    // ২. বর্তমান স্টক চেক করা (VariantItem থেকে স্টক নেওয়া হচ্ছে)
    const currentStock = orderItem.variantItem?.stock || 0;

    // ৩. নতুন কোয়ান্টিটি ক্যালকুলেশন এবং ভ্যালিডেশন
    let newQuantity = orderItem.quantity;

    if (type === "increment") {
      // স্টকের বেশি বাড়ানো যাবে না
      if (currentStock <= 0) {
        throw new Error("Stock is not available for this product!");
      }
      newQuantity += 1;
    } else if (type === "decrement") {
      // ১ এর নিচে নামানো যাবে না
      if (orderItem.quantity <= 1) {
        throw new Error("Quantity cannot be less than 1!");
      }
      newQuantity -= 1;
    }

    // ৪. নতুন টোটাল প্রাইস হিসাব করা (sellPrice * newQuantity)
    const updatedTotalPrice = Number(orderItem.sellPrice) * newQuantity;

    // ৫. OrderItem-এর কোয়ান্টিটি ও টোটাল প্রাইস আপডেট করা
    const updatedOrderItem = await tx.orderItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        totalPrice: updatedTotalPrice,
      },
    });

    // ৬. স্টক অ্যাডজাস্ট করা (increment হলে স্টক কমবে [-1], decrement হলে স্টক বাড়বে [+1])
    const stockChange = type === "increment" ? -1 : 1;

    if (orderItem.variantItemId) {
      await tx.variantItem.update({
        where: { id: orderItem.variantItemId },
        data: { stock: { increment: stockChange } },
      });
    }

    // ৭. অর্ডারের মোট অ্যামাউন্ট (Total Order Amount) রিক্যালকুলেট করে আপডেট করা
    const allOrderItems = await tx.orderItem.findMany({
      where: { orderId: orderItem.orderId },
      select: { totalPrice: true },
    });

    const totalOrderAmount = allOrderItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    await tx.order.update({
      where: { id: orderItem.orderId },
      data: { amount: totalOrderAmount },
    });

    return updatedOrderItem;
  });
};

// deleteOrderItemService
export const deleteOrderItemService = async (itemId: string) => {
  return await prisma.$transaction(async (tx) => {
    // ১. নির্দিষ্ট অর্ডার আইটেম এবং তার অর্ডার ইনফো খুঁজে আনা
    const orderItem = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!orderItem) {
      throw new Error("Order item not found!");
    }

    // ২. স্ট্যাটাস চেক (অ্যাপ্রুভড/অ্যাকসেপ্টেড বা রিটার্ন স্ট্যাটাস কিনা)
    const allowedStatuses = ['ACCEPTED', 'RETURNED'];
    if (!allowedStatuses.includes(orderItem.order.status)) {
      throw new Error("You cannot delete items for this order status!");
    }

    // ৩. ভেরিয়েন্ট আইটেম থাকলে স্টক পুনরায় মূল স্টকে যোগ (Restock) করা
    if (orderItem.variantItemId) {
      await tx.variantItem.update({
        where: { id: orderItem.variantItemId },
        data: {
          stock: {
            increment: orderItem.quantity, // অর্ডারে থাকা পরিমাণ স্টকে ফেরত যাবে
          },
        },
      });
    }

    // ৪. অর্ডার আইটেমটি টেবিল থেকে সম্পূর্ণ ডিলিট (Hard Delete) করা
    const deletedItem = await tx.orderItem.delete({
      where: { id: itemId },
    });

    // ৫. অর্ডারের বাকি আইটেমগুলো দিয়ে মোট কোয়ান্টিটি এবং মোট অ্যামাউন্ট রিক্যালকুলেট করা
    const remainingItems = await tx.orderItem.findMany({
      where: { orderId: orderItem.orderId },
    });

    const newTotalQuantity = remainingItems.reduce((sum, item) => sum + item.quantity, 0);
    const newTotalAmount = remainingItems.reduce((sum, item) => sum.add(item.totalPrice), new Prisma.Decimal(0));

    // ৬. মূল অর্ডারের হিসাব আপডেট করা
    await tx.order.update({
      where: { id: orderItem.orderId },
      data: {
        quantity: newTotalQuantity,
        amount: newTotalAmount,
      },
    });

    return deletedItem;
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
