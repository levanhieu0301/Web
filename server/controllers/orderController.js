const orderService = require("../services/orderService");

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const { items, shipping_address, phone, notes } = req.body;
    const user_id = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một sản phẩm" });
    }

    const orderData = {
      user_id,
      items,
      shipping_address,
      phone,
      notes,
    };

    const order = await orderService.createOrder(orderData);
    return res.status(201).json({
      message: "Đặt hàng thành công",
      data: order,
    });
  } catch (err) {
    console.error("Error in createOrder:", err);
    return res.status(500).json({ error: err.message || "Lỗi tạo đơn hàng" });
  }
};

// Lấy tất cả đơn hàng
const getAllOrders = async (req, res) => {
  try {
    // Nếu là user thường, chỉ lấy đơn hàng của mình
    const userId = req.user.role === "user" ? req.user.id : null;
    const orders = await orderService.getAllOrders(userId);
    return res.status(200).json({ data: orders });
  } catch (err) {
    console.error("Error in getAllOrders:", err);
    return res.status(500).json({ error: "Lỗi tải danh sách đơn hàng" });
  }
};

// Lấy đơn hàng theo ID
const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    // Kiểm tra quyền: user chỉ xem được đơn hàng của mình
    if (req.user.role === "user" && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền xem đơn hàng này" });
    }

    return res.status(200).json({ data: order });
  } catch (err) {
    if (err.message === "Đơn hàng không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in getOrderById:", err);
    return res.status(500).json({ error: "Lỗi tải đơn hàng" });
  }
};

// Cập nhật đơn hàng
const updateOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    // Kiểm tra quyền: user chỉ cập nhật được đơn hàng của mình (và chỉ khi pending)
    if (req.user.role === "user") {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ error: "Không có quyền cập nhật đơn hàng này" });
      }
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Chỉ có thể cập nhật đơn hàng đang chờ xử lý" });
      }
    }

    const updatedOrder = await orderService.updateOrder(req.params.id, req.body);
    return res.status(200).json({
      message: "Cập nhật đơn hàng thành công",
      data: updatedOrder,
    });
  } catch (err) {
    if (err.message === "Đơn hàng không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in updateOrder:", err);
    return res.status(500).json({ error: err.message || "Lỗi cập nhật đơn hàng" });
  }
};

// Xóa đơn hàng
const deleteOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    // Kiểm tra quyền: user chỉ xóa được đơn hàng của mình (và chỉ khi pending)
    if (req.user.role === "user") {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ error: "Không có quyền xóa đơn hàng này" });
      }
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Chỉ có thể xóa đơn hàng đang chờ xử lý" });
      }
    }

    await orderService.deleteOrder(req.params.id);
    return res.status(200).json({ message: "Đã xóa đơn hàng thành công" });
  } catch (err) {
    if (err.message === "Đơn hàng không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in deleteOrder:", err);
    return res.status(500).json({ error: err.message || "Lỗi xóa đơn hàng" });
  }
};

// Cập nhật chi tiết đơn hàng
const updateOrderItem = async (req, res) => {
  try {
    const item = await orderService.updateOrderItem(req.params.itemId, req.body);
    return res.status(200).json({
      message: "Cập nhật chi tiết đơn hàng thành công",
      data: item,
    });
  } catch (err) {
    console.error("Error in updateOrderItem:", err);
    return res.status(500).json({ error: err.message || "Lỗi cập nhật chi tiết đơn hàng" });
  }
};

// Xóa chi tiết đơn hàng
const deleteOrderItem = async (req, res) => {
  try {
    await orderService.deleteOrderItem(req.params.itemId);
    return res.status(200).json({ message: "Đã xóa chi tiết đơn hàng thành công" });
  } catch (err) {
    console.error("Error in deleteOrderItem:", err);
    return res.status(500).json({ error: err.message || "Lỗi xóa chi tiết đơn hàng" });
  }
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




