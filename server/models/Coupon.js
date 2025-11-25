module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define("Coupon", {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('code', value.toUpperCase());
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
      defaultValue: "percentage",
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      }
    },
    min_order_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  }, {
    tableName: "coupons",
    validate: {
      endDateAfterStartDate() {
        if (this.end_date < this.start_date) {
          throw new Error("Ngày kết thúc phải sau ngày bắt đầu!");
        }
      }
    }
  });

  return Coupon;
};