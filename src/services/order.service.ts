import prisma from "../prisma";

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