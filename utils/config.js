const RAZOR_PAY_KEY_ID = "rzp_test_1DP5mmOlF5G5aa";
const RAZOR_PAY_KEY_SECRET = "f9lJY6t2M2N6J2y1Fepf5v3m";
const COST_MAPPING = {
  3: {
    medium: { rs: 100, products: ["medium"] },
    large: { rs: 200, products: ["large"] },
    small: { rs: 50, products: ["small"] },
  },
  6: {
    medium: { rs: 200, products: ["medium"] },
    large: { rs: 400, products: ["large"] },
    small: { rs: 100, products: ["small"] },
  },
};
module.exports = {
  RAZOR_PAY_KEY_ID,
  RAZOR_PAY_KEY_SECRET,
  COST_MAPPING,
};
