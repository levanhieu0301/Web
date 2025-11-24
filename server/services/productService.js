const Product = require("../models/Product");
const path = require("path");
const fs = require("fs");

// Lấy tất cả sản phẩm
const getAllProducts = async () => {
  return await Product.findAll({
    order: [["created_at", "DESC"]],
  });
};

// Lấy sản phẩm theo ID
const getProductById = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }
  return product;
};

// Tạo sản phẩm mới
const createProduct = async (productData) => {
  const newProduct = await Product.create({
    name: productData.name,
    description: productData.description || null,
    price: productData.price,
    image: productData.image || null,
    stock: productData.stock || 0,
  });
  return newProduct;
};

// Cập nhật sản phẩm
const updateProduct = async (id, productData) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Nếu có ảnh mới và có ảnh cũ, xóa ảnh cũ
  if (productData.image && product.image) {
    const oldImagePath = path.join(
      __dirname,
      "../HinhAnhSanPham",
      product.image
    );
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  // Cập nhật thông tin
  product.name = productData.name || product.name;
  product.description = productData.description !== undefined ? productData.description : product.description;
  product.price = productData.price || product.price;
  product.image = productData.image || product.image;
  product.stock = productData.stock !== undefined ? productData.stock : product.stock;

  await product.save();
  return product;
};

// Xóa sản phẩm
const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Xóa ảnh nếu có
  if (product.image) {
    const imagePath = path.join(
      __dirname,
      "../HinhAnhSanPham",
      product.image
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await product.destroy();
  return { message: "Đã xóa sản phẩm thành công" };
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};






