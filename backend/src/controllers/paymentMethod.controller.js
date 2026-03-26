const paymentMethodService = require("../services/paymentMethod.service");
const {
  PaymentMethodServiceError,
} = require("../services/paymentMethod.service");

function handleError(res, err, label) {
  if (err instanceof PaymentMethodServiceError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  console.error(`[${label}]`, err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error.",
  });
}

exports.listPaymentMethods = async (req, res) => {
  try {
    const data = await paymentMethodService.listPaymentMethods(req.user.userId);
    return res.status(200).json({ data });
  } catch (err) {
    return handleError(res, err, "listPaymentMethods");
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const data = await paymentMethodService.createPaymentMethod(
      req.user.userId,
      req.body,
    );
    return res.status(201).json({ data });
  } catch (err) {
    return handleError(res, err, "createPaymentMethod");
  }
};

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const data = await paymentMethodService.setDefaultPaymentMethod(
      req.user.userId,
      req.params.id,
    );
    return res.status(200).json({ data });
  } catch (err) {
    return handleError(res, err, "setDefaultPaymentMethod");
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const result = await paymentMethodService.deletePaymentMethod(
      req.user.userId,
      req.params.id,
    );
    return res.status(200).json(result);
  } catch (err) {
    return handleError(res, err, "deletePaymentMethod");
  }
};
