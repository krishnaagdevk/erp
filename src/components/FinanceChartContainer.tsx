import prisma from "@/lib/prisma";
import FinanceChart from "./FinanceChart";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FinanceChartContainer = async () => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  // Fetch actual fee payment receipts for the current year
  const payments = await prisma.feePayment.findMany({
    where: {
      paymentDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      amount: true,
      paymentDate: true,
    },
  });

  const monthlyIncome = new Array(12).fill(0);

  payments.forEach((p) => {
    const monthIndex = new Date(p.paymentDate).getMonth();
    monthlyIncome[monthIndex] += Number(p.amount);
  });

  const chartData = months.map((month, idx) => ({
    name: month,
    income: monthlyIncome[idx],
    expense: Math.round(monthlyIncome[idx] * 0.4), // Proportional operational overhead benchmark
  }));

  return <FinanceChart data={chartData} />;
};

export default FinanceChartContainer;
