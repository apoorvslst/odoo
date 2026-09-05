const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const money = (n) => round2(n).toFixed(2);

const lineSubtotal = (line) => round2(Number(line.quantity) * Number(line.unitPrice));
const lineTax = (line) => round2((lineSubtotal(line) * Number(line.taxRate || 0)) / 100);

module.exports = { round2, money, lineSubtotal, lineTax };
