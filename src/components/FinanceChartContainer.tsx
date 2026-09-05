import FinanceChart from "./FinanceChart";
import { getMonthlyFinanceSummary } from "@/lib/queries";

const FinanceChartContainer = async () => {
  const chartData = await getMonthlyFinanceSummary();

  return <FinanceChart data={chartData} />;
};

export default FinanceChartContainer;
