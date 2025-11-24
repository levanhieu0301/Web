const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const User = require("../models/User");

// Tạo đơn hàng mới
const createOrder = async (orderData) => {
  const { user_id, items, shipping_address, phone, notes } = orderData;

  // Tính tổng tiền
  let totalAmount = 0;
  for (const item of items) {
    const product = await Product.findByPk(item.product_id);
    if (!product) {
      throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Sản phẩm ${product.name} không đủ số lượng trong kho`);
    }
    totalAmount += parseFloat(product.price) * item.quantity;
  }

  // Tạo đơn hàng
  const order = await Order.create({
    user_id,
    total_amount: totalAmount,
    shipping_address,
    phone,
    notes,
    status: "pending",
  });

  // Tạo chi tiết đơn hàng và cập nhật số lượng sản phẩm
  for (const item of items) {
    const product = await Product.findByPk(item.product_id);
    const price = parseFloat(product.price);
    const subtotal = price * item.quantity;

    await OrderItem.create({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: price,
      subtotal: subtotal,
    });

    // Cập nhật số lượng sản phẩm
    await Product.update(
      { stock: product.stock - item.quantity },
      { where: { id: item.product_id } }
    );
  }

  // Lấy đơn hàng với chi tiết
  return await getOrderById(order.id);
};

// Lấy tất cả đơn hàng
const getAllOrders = async (userId = null) => {
  const where = userId ? { user_id: userId } : {};
  const orders = await Order.findAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image"],
          },
        ],
        order: [["created_at", "ASC"]],
      },
    ],
    order: [["created_at", "DESC"]],
  });
  
  // Chuyển đổi sang plain object để đảm bảo dữ liệu đúng format
  return orders.map(order => order.toJSON());
};

// Lấy đơn hàng theo ID
const getOrderById = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image", "price"],
          },
        ],
        order: [["created_at", "ASC"]],
      },
    ],
  });

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  // Chuyển đổi sang plain object để đảm bảo dữ liệu đúng format
  return order.toJSON();
};

// Cập nhật đơn hàng
const updateOrder = async (orderId, updateData) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  // Xử lý updated_at - luôn cập nhật khi có thay đổi
  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date();
  }

  await Order.update(updateData, {
    where: { id: orderId },
  });

  const updatedOrder = await getOrderById(orderId);
  return updatedOrder;
};

// Xóa đơn hàng
const deleteOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  // Hoàn lại số lượng sản phẩm nếu đơn hàng chưa được xử lý
  if (order.status === "pending" || order.status === "cancelled") {
    for (const item of order.items) {
      const product = await Product.findByPk(item.product_id);
      if (product) {
        await Product.update(
          { stock: product.stock + item.quantity },
          { where: { id: item.product_id } }
        );
      }
    }
  }

  // Xóa chi tiết đơn hàng
  await OrderItem.destroy({ where: { order_id: orderId } });
  // Xóa đơn hàng
  await Order.destroy({ where: { id: orderId } });

  return true;
};

// Cập nhật chi tiết đơn hàng
const updateOrderItem = async (itemId, updateData) => {
  const item = await OrderItem.findByPk(itemId, {
    include: [{ model: Order, as: "order" }],
  });

  if (!item) {
    throw new Error("Chi tiết đơn hàng không tồn tại");
  }

  // Nếu cập nhật số lượng
  if (updateData.quantity !== undefined) {
    const product = await Product.findByPk(item.product_id);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    const quantityDiff = updateData.quantity - item.quantity;
    if (quantityDiff > 0 && product.stock < quantityDiff) {
      throw new Error("Không đủ số lượng sản phẩm trong kho");
    }

    // Cập nhật số lượng sản phẩm
    await Product.update(
      { stock: product.stock - quantityDiff },
      { where: { id: item.product_id } }
    );

    // Cập nhật subtotal
    updateData.subtotal = parseFloat(product.price) * updateData.quantity;
  }

  await OrderItem.update(updateData, { where: { id: itemId } });

  // Cập nhật tổng tiền đơn hàng
  const order = await getOrderById(item.order_id);
  const newTotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.subtotal),
    0
  );
  await Order.update(
    { total_amount: newTotal, updated_at: new Date() },
    { where: { id: item.order_id } }
  );

  const updatedItem = await OrderItem.findByPk(itemId, {
    include: [{ model: Product, as: "product" }],
  });
  
  return updatedItem ? updatedItem.toJSON() : null;
};

// Xóa chi tiết đơn hàng
const deleteOrderItem = async (itemId) => {
  const item = await OrderItem.findByPk(itemId, {
    include: [{ model: Order, as: "order" }],
  });

  if (!item) {
    throw new Error("Chi tiết đơn hàng không tồn tại");
  }

  const orderId = item.order_id;
  const productId = item.product_id;
  const quantity = item.quantity;

  // Hoàn lại số lượng sản phẩm
  const product = await Product.findByPk(productId);
  if (product) {
    await Product.update(
      { stock: product.stock + quantity },
      { where: { id: productId } }
    );
  }

  // Xóa chi tiết
  await OrderItem.destroy({ where: { id: itemId } });

  // Cập nhật tổng tiền đơn hàng
  const order = await getOrderById(orderId);
  if (order.items.length === 0) {
    // Nếu không còn chi tiết nào, xóa luôn đơn hàng
    await Order.destroy({ where: { id: orderId } });
    return null;
  } else {
    const newTotal = order.items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );
    await Order.update(
      { total_amount: newTotal, updated_at: new Date() },
      { where: { id: orderId } }
    );
  }

  return true;
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderItem,
  deleteOrderItem,
};


