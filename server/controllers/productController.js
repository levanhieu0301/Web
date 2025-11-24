const productService = require("../services/productService");
const path = require("path");

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    // Chuyển đổi đường dẫn ảnh thành URL
    const productsWithImageUrl = products.map((product) => ({
      ...product.toJSON(),
      image_url: product.image
        ? `/api/products/images/${product.image}`
        : null,
    }));
    return res.status(200).json({ data: productsWithImageUrl });
  } catch (err) {
    console.error("Error in getAllProducts:", err);
    return res.status(500).json({ error: "Lỗi tải danh sách sản phẩm" });
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json({
      data: {
        ...product.toJSON(),
        image_url: product.image
          ? `/api/products/images/${product.image}`
          : null,
      },
    });
  } catch (err) {
    if (err.message === "Sản phẩm không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in getProductById:", err);
    return res.status(500).json({ error: "Lỗi tải sản phẩm" });
  }
};

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock) || 0,
      image: req.file ? req.file.filename : null,
    };

    const newProduct = await productService.createProduct(productData);
    return res.status(201).json({
      message: "Tạo sản phẩm thành công",
      data: {
        ...newProduct.toJSON(),
        image_url: newProduct.image
          ? `/api/products/images/${newProduct.image}`
          : null,
      },
    });
  } catch (err) {
    console.error("Error in createProduct:", err);
    return res.status(500).json({ error: err.message || "Lỗi tạo sản phẩm" });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : undefined,
      image: req.file ? req.file.filename : undefined,
    };

    // Xóa các trường undefined
    Object.keys(productData).forEach(
      (key) => productData[key] === undefined && delete productData[key]
    );

    const updatedProduct = await productService.updateProduct(
      req.params.id,
      productData
    );
    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công",
      data: {
        ...updatedProduct.toJSON(),
        image_url: updatedProduct.image
          ? `/api/products/images/${updatedProduct.image}`
          : null,
      },
    });
  } catch (err) {
    if (err.message === "Sản phẩm không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in updateProduct:", err);
    return res.status(500).json({ error: err.message || "Lỗi cập nhật sản phẩm" });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    if (err.message === "Sản phẩm không tồn tại") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error in deleteProduct:", err);
    return res.status(500).json({ error: err.message || "Lỗi xóa sản phẩm" });
  }
};

// Phục vụ file ảnh
const getProductImage = async (req, res) => {
  try {
    const imageName = req.params.imageName;
    const imagePath = path.join(
      __dirname,
      "../HinhAnhSanPham",
      imageName
    );
    res.sendFile(imagePath);
  } catch (err) {
    res.status(404).json({ error: "Không tìm thấy ảnh" });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductImage,
};






