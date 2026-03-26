const mongoose = require("mongoose");
const PaymentMethod = require("../models/paymentMethods.model");

class PaymentMethodServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentMethodServiceError";
    this.statusCode = statusCode;
  }
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeExpiry(value) {
  const raw = normalizeText(value);
  const matched = raw.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!matched) {
    throw new PaymentMethodServiceError("Expiry must be in MM/YY format.", 400);
  }

  const month = Number(matched[1]);
  if (month < 1 || month > 12) {
    throw new PaymentMethodServiceError("Invalid expiry month.", 400);
  }

  return `${matched[1]}/${matched[2]}`;
}

function mapPaymentMethod(doc) {
  return {
    id: doc._id,
    type: doc.card_type,
    bank_name: doc.bank_name,
    card_holder: doc.card_holder,
    last4: doc.last4,
    expiry: doc.expiry,
    is_default: doc.is_default,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

async function listPaymentMethods(userId) {
  const methods = await PaymentMethod.find({ user_id: userId }).sort({
    is_default: -1,
    created_at: -1,
  });

  return methods.map(mapPaymentMethod);
}

async function createPaymentMethod(
  userId,
  { card_type, bank_name, card_holder, card_number, expiry, is_default },
) {
  const type = normalizeText(card_type);
  const bankName = normalizeText(bank_name);
  const cardHolder = normalizeText(card_holder);
  const cardDigits = normalizeText(card_number).replace(/\D/g, "");
  const normalizedExpiry = normalizeExpiry(expiry);

  if (!["Visa", "Mastercard", "JCB"].includes(type)) {
    throw new PaymentMethodServiceError("Unsupported card type.", 400);
  }
  if (!bankName || !cardHolder) {
    throw new PaymentMethodServiceError(
      "Bank name and card holder are required.",
      400,
    );
  }
  if (cardDigits.length < 12 || cardDigits.length > 19) {
    throw new PaymentMethodServiceError("Invalid card number.", 400);
  }

  const existingCount = await PaymentMethod.countDocuments({ user_id: userId });
  const shouldDefault = Boolean(is_default) || existingCount === 0;

  if (shouldDefault) {
    await PaymentMethod.updateMany({ user_id: userId }, { is_default: false });
  }

  const created = await PaymentMethod.create({
    user_id: userId,
    card_type: type,
    bank_name: bankName,
    card_holder: cardHolder,
    last4: cardDigits.slice(-4),
    expiry: normalizedExpiry,
    is_default: shouldDefault,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return mapPaymentMethod(created);
}

async function setDefaultPaymentMethod(userId, paymentMethodId) {
  if (!mongoose.Types.ObjectId.isValid(paymentMethodId)) {
    throw new PaymentMethodServiceError("Invalid payment method id.", 400);
  }

  const method = await PaymentMethod.findOne({
    _id: paymentMethodId,
    user_id: userId,
  });

  if (!method) {
    throw new PaymentMethodServiceError("Payment method not found.", 404);
  }

  await PaymentMethod.updateMany({ user_id: userId }, { is_default: false });
  method.is_default = true;
  method.updated_at = new Date();
  await method.save();

  return mapPaymentMethod(method);
}

async function deletePaymentMethod(userId, paymentMethodId) {
  if (!mongoose.Types.ObjectId.isValid(paymentMethodId)) {
    throw new PaymentMethodServiceError("Invalid payment method id.", 400);
  }

  const method = await PaymentMethod.findOne({
    _id: paymentMethodId,
    user_id: userId,
  });

  if (!method) {
    throw new PaymentMethodServiceError("Payment method not found.", 404);
  }

  const wasDefault = method.is_default;
  await PaymentMethod.deleteOne({ _id: method._id });

  if (wasDefault) {
    const replacement = await PaymentMethod.findOne({ user_id: userId }).sort({
      created_at: -1,
    });
    if (replacement) {
      replacement.is_default = true;
      replacement.updated_at = new Date();
      await replacement.save();
    }
  }

  return { message: "Payment method deleted successfully." };
}

module.exports = {
  PaymentMethodServiceError,
  listPaymentMethods,
  createPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
};
