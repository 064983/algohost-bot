export const business = {
  name: "saint_graphy",
  whatsappNumber: "27649838898",
  whatsappDisplay: "0649838898",
  whatsappMessage:
    "Hello, I found your photography website and would love to chat about a photo session.",
};

export const whatsappUrl = (
  message = business.whatsappMessage,
  number = business.whatsappNumber,
) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const riskDisclaimer =
  "Trading involves financial risk, and you may lose some or all of your invested capital. Automated trading bots do not guarantee profits. Past performance does not guarantee future results. Customers should understand the risks and test trading software appropriately before using real funds.";

export const formatZar = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(amount);
