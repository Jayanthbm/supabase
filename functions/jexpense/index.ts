import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import "https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts";

// Define interfaces for RPC response types
interface CategoryExpense {
  category: string;
  total: number;
}

interface TotalData {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

interface MonthlyData extends TotalData {
  dailyLimit: number;
  remainingDays: number;
}

interface TagReport {
  id: number;
  tag_id: string;
  tag_name: string;
  amount: number;
}

interface IncomeExpenseReport {
  id: number;
  for: string;
  month: string;
  year: string;
  total_income: number;
  total_expense: number;
  income: {
    name: string;
    total_amount: number;
    percentage: number;
  }[];
  expense: {
    name: string;
    total_amount: number;
    percentage: number;
  }[];
}

// Retrieve your Supabase URL and anon key from environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to handle RPC calls with optional variables
const runRpc = async (name: string, variables?: Record<string, unknown>) => {
  const { data, error } = variables
    ? await supabase.rpc(name, variables)
    : await supabase.rpc(name);

  if (error) {
    throw new Error(`Error fetching data from RPC '${name}': ${error.message}`);
  }

  return data;
};


const fetchTotalData = async (): Promise<TotalData | undefined> => {
  try {
    const totalIncome = await runRpc("get_total_income");
    const totalExpenses = await runRpc("get_total_expenses");
    const totalBalance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, totalBalance };
  } catch (error) {
    console.log("Error fetching total data:", error);
  }
};

const fetchDataForCurrentYear = async (): Promise<TotalData> => {
  try {
    const totalIncome = await runRpc("get_yearly_total_income");
    const totalExpenses = await runRpc("get_yearly_total_expenses");
    const totalBalance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, totalBalance };
  } catch (error) {
    console.error("Error fetching yearly data:", error);
    throw error;
  }
};

const fetchDataForCurrentMonth = async (): Promise<MonthlyData> => {
  try {
    const totalIncome = await runRpc("get_monthly_total_income");
    const totalExpenses = await runRpc("get_monthly_total_expenses");
    const totalBalance = totalIncome - totalExpenses;
    const currentDate = new Date();
    const totalDaysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();
    const remainingDays = totalDaysInMonth - currentDate.getDate() + 1; // Add 1 to account for the current day
    const dailyLimit = totalBalance / (remainingDays > 0 ? remainingDays : 1); // Avoid division by zero
    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      dailyLimit,
      remainingDays,
    };
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    throw error;
  }
};

const fetchDataForCurrentWeek = async (): Promise<TotalData> => {
  try {
    const totalIncome = await runRpc("get_weekly_total_income");
    const totalExpenses = await runRpc("get_weekly_total_expenses");
    const totalBalance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, totalBalance };
  } catch (error) {
    console.error("Error fetching weekly data:", error);
    throw error;
  }
};

const fetchDataForCurrentDay = async (): Promise<TotalData> => {
  try {
    const totalIncome = await runRpc("get_daily_total_income");
    const totalExpenses = await runRpc("get_daily_total_expenses");
    const totalBalance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, totalBalance };
  } catch (error) {
    console.error("Error fetching daily data:", error);
    throw error;
  }
};

const fetchTopCategoriesExpensesForYear = async (): Promise<
  Record<string, number>
> => {
  try {
    const { data, error } = await supabase.rpc(
      "get_yearly_top_categories_expenses",
    );
    if (error) {
      throw new Error(`Error fetching yearly top categories: ${error.message}`);
    }
    // Transform the response into the desired format
    const result: Record<string, number> = {};
    data.forEach(({ category, total }: CategoryExpense) => {
      result[category] = total;
    });
    return result;
  } catch (error) {
    console.error("Error fetching yearly top categories:", error);
    throw error;
  }
};

const fetchTopCategoriesExpensesForMonth = async (): Promise<
  Record<string, number>
> => {
  try {
    const { data, error } = await supabase.rpc(
      "get_monthly_top_categories_expenses",
    );
    if (error) {
      throw new Error(
        `Error fetching monthly top categories: ${error.message}`,
      );
    }
    // Transform the response into the desired format
    const result: Record<string, number> = {};
    data.forEach(({ category, total }: CategoryExpense) => {
      result[category] = total;
    });
    return result;
  } catch (error) {
    console.error("Error fetching monthly top categories:", error);
    throw error;
  }
};

type QueryParams = Record<string, string>;

const formatQueryParams = (queryString: string): QueryParams => {
  if (!queryString) return {};
  // Split the query string by '&' to get key-value pairs
  const pairs = queryString.split("&");
  // Initialize an empty object to hold the result
  const result: QueryParams = {};
  // Iterate over the pairs
  pairs.forEach((pair) => {
    // Split each pair by '=' to get the key and value
    const [key, value] = pair.split("=");
    // Decode the key and value to handle URL encoding
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value);
    // Add the decoded key and value to the result object
    result[decodedKey] = decodedValue;
  });
  return result;
};

const getDashboardData = async () => {
  try {
    const totalData = await fetchTotalData();
    const todayData = await fetchDataForCurrentDay();
    const weekData = await fetchDataForCurrentWeek();
    const monthData = await fetchDataForCurrentMonth();
    const yearData = await fetchDataForCurrentYear();
    const topCategoriesMonth = await fetchTopCategoriesExpensesForMonth();
    const topCategoriesYear = await fetchTopCategoriesExpensesForYear();
    return {
      totalData,
      todayData,
      weekData,
      monthData,
      yearData,
      topCategoriesMonth,
      topCategoriesYear,
    };
  } catch (error) {
    console.log("Error fetching dashboard data", error);
  }
};

// New function to list categories
const listCategories = async () => {
  const { data, error } = await supabase.from("category").select("*");
  if (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
  return data;
};

// New function to list payees
const listPayees = async () => {
  const { data, error } = await supabase.from("payee").select("*");
  if (error) {
    throw new Error(`Error fetching payees: ${error.message}`);
  }
  return data;
};

// New function to list tags
const listTags = async () => {
  const { data, error } = await supabase.from("tags").select("*");
  if (error) {
    throw new Error(`Error fetching tags: ${error.message}`);
  }
  return data;
};

// New function to handle transactions
const listTransactions = async (queryParams: QueryParams) => {
  const page = parseInt(queryParams["page"] || "1");
  const pageSize = parseInt(queryParams["pageSize"] || "50");
  const offset = (page - 1) * pageSize;
  const {
    category,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortField = "id",
    sortOrder = "desc",
  } = queryParams;

  let query = supabase
    .from("transactions")
    .select("*")
    .range(offset, offset + pageSize - 1)
    .order(sortField, { ascending: sortOrder.toLowerCase() === "asc" });

  // Apply filters
  if (category) query = query.eq("category", category);
  if (dateFrom) query = query.gte("date_iso", new Date(dateFrom).toISOString());
  if (dateTo) query = query.lte("date_iso", new Date(dateTo).toISOString());
  if (minAmount) query = query.gte("amount", parseFloat(minAmount));
  if (maxAmount) query = query.lte("amount", parseFloat(maxAmount));

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching transactions: ${error.message}`);
  }

  return data;
};

const transactionsByCategory = async (queryParams: QueryParams) => {
  const type: string = queryParams["type"] || "Income"; // Either Income or Expense
  const startDate: string | undefined = queryParams["startDate"]; // Passed as "YYYY-MM-DD"
  const endDate: string | undefined = queryParams["endDate"]; // Passed as "YYYY-MM-DD"

  if (type !== "Income" && type !== "Expense") {
    throw new Error('Invalid type. Must be either "Income" or "Expense".');
  }

  if (!startDate || !endDate) {
    throw new Error("Both startDate and endDate are required.");
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("category, amount")
      .eq("type", type)
      .gte("formatted_date", startDate)
      .lte("formatted_date", endDate);

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }

    // Grouping transactions by category and calculating total amount for each category
    const groupedData: Record<string, { category: string; total: number }> =
      data.reduce((acc, transaction) => {
        const { category, amount } = transaction;
        if (!acc[category]) {
          acc[category] = { category, total: 0 };
        }
        acc[category].total += amount;
        return acc;
      }, {} as Record<string, { category: string; total: number }>);

    // Convert groupedData object into the desired array format
    const categories = Object.values(groupedData).map((
      { category, total },
    ) => ({
      category,
      total,
      percentage:
        (total /
          Object.values(groupedData).reduce(
            (acc: number, { total }: { total: number }) => acc + total,
            0,
          )) * 100,
    }));

    // Sort categories by total amount in descending order
    categories.sort((a, b) => b.total - a.total);

    const totalAmount = categories.reduce((acc, { total }) => acc + total, 0);

    const result = {
      total_amount: totalAmount,
      categories: categories,
    };

    return result;
  } catch (error) {
    console.error("Error fetching transactions by category:", error);
    throw error;
  }
};


const reportsIncomeVsExpense = async (): Promise<IncomeExpenseReport[]> => {
  try {
    // Fetch the first transaction date
    const { data: firstDateData, error: firstDateError } = await supabase
      .from("transactions")
      .select("formatted_date")
      .order("formatted_date", { ascending: true })
      .limit(1);

    if (firstDateError || !firstDateData.length) {
      throw new Error(
        `Error fetching the first transaction date: ${firstDateError?.message}`,
      );
    }

    const firstTransactionDate = new Date(firstDateData[0].formatted_date);
    const currentDate = new Date();
    const response: IncomeExpenseReport[] = [];
    let id = 1; // Initialize the id counter

    // Iterate through each month from the first transaction date to the current month
    for (
      let year = firstTransactionDate.getFullYear();
      year <= currentDate.getFullYear();
      year++
    ) {
      const startMonth = (year === firstTransactionDate.getFullYear())
        ? firstTransactionDate.getMonth() + 1
        : 1;
      const endMonth = (year === currentDate.getFullYear())
        ? currentDate.getMonth() + 1
        : 12;

      for (let month = startMonth; month <= endMonth; month++) {
        const startDate =
          new Date(year, month - 1, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month, 0).toISOString().split("T")[0];

        // Fetch transactions for the current month
        const { data, error } = await supabase
          .from("transactions")
          .select("category, amount, type")
          .gte("formatted_date", startDate)
          .lte("formatted_date", endDate);

        if (error) {
          throw new Error(`Error fetching transactions: ${error.message}`);
        }

        // Group transactions by type and category
        const groupedData = data.reduce((acc, transaction) => {
          const { type, category, amount } = transaction;

          if (!acc[type]) {
            acc[type] = {};
          }

          if (!acc[type][category]) {
            acc[type][category] = 0;
          }

          acc[type][category] += amount;
          return acc;
        }, {} as Record<string, Record<string, number>>);

        // Calculate total income and expense
        const totalIncome = Object.values(groupedData["Income"] || {}).reduce(
          (sum, total) => sum + total,
          0,
        );
        const totalExpense = Object.values(groupedData["Expense"] || {}).reduce(
          (sum, total) => sum + total,
          0,
        );

        // Format income and expense by category
        const income = Object.entries(groupedData["Income"] || {})
          .map(([category, total]) => ({
            name: category,
            total_amount: total,
            percentage: (total / totalIncome) * 100,
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        const expense = Object.entries(groupedData["Expense"] || {})
          .map(([category, total]) => ({
            name: category,
            total_amount: total,
            percentage: (total / totalExpense) * 100,
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        // Store the data in the response
        response.push({
          id: id++, // Increment the id counter
          for: `${month.toString().padStart(2, "0")}-${year}`,
          month: new Date(year, month - 1).toLocaleString("default", {
            month: "short",
          }),
          year: year.toString(),
          total_income: totalIncome,
          total_expense: totalExpense,
          income,
          expense,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Error in reportsIncomeVsExpense:", error);
    throw error;
  }
};

const reportsByTags = async (): Promise<TagReport[]> => {
  try {
    const data = await runRpc("get_transaction_tags_summary");
    return data;
  } catch (error) {
    console.error("Error in reportsByTags:", error);
    throw error;
  }
};

const fetchTransactionsByTagId = async (tagId: number) => {
  // Check if the tag exists
  const { data: tagData, error: tagError } = await supabase
    .from("tags")
    .select("*")
    .eq("id", tagId);

  if (tagError) {
    throw new Error(`Error fetching tag with id ${tagId}: ${tagError.message}`);
  }
  if (!tagData || tagData.length === 0) {
    throw new Error(`Tag with id ${tagId} does not exist.`);
  }

  const transactionData = await runRpc('get_transactions_by_tagid', { tagId })

  return transactionData;
};

Deno.serve(async (req) => {
  let { pathname } = new URL(req.url);
  const query = new URLSearchParams(req.url.split("?")[1]);
  let _requestBody = {};
  if (req.method === "POST") {
    _requestBody = await req.json();
  }
  const queryParams = formatQueryParams(query?.toString());
  console.log(`Received request for: ${pathname}`); // Add logging here
  pathname = pathname.replace("/jexpense", "");
  try {
    switch (pathname) {
      case "/dashboard": {
        const dashboard = await getDashboardData();
        return new Response(JSON.stringify(dashboard), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/list-categories": {
        const categories = await listCategories();
        return new Response(JSON.stringify(categories), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/list-payees": {
        const payees = await listPayees();
        return new Response(JSON.stringify(payees), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/list-tags": {
        const tags = await listTags();
        return new Response(JSON.stringify(tags), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/transactions": {
        const transactions = await listTransactions(queryParams);
        return new Response(JSON.stringify(transactions), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/transactions-by-category": {
        const transactionsByCategoryResult = await transactionsByCategory(
          queryParams,
        );
        return new Response(JSON.stringify(transactionsByCategoryResult), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/reports-income-vs-expense": {
        const reportsIncomeVsExpenseResult = await reportsIncomeVsExpense();
        return new Response(JSON.stringify(reportsIncomeVsExpenseResult), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/reports-by-tags": {
        const reportsByTagsResult = await reportsByTags()
        return new Response(JSON.stringify(reportsByTagsResult), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "/transactions-by-tag": {
        const tagId = parseInt(queryParams['tagId']);
        if (isNaN(tagId)) {
          return new Response(JSON.stringify({ error: "Invalid tag ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const transactions = await fetchTransactionsByTagId(tagId);
        return new Response(JSON.stringify(transactions), {
          headers: { "Content-Type": "application/json" },
        });
      }
      default: {
        console.log(`Invalid endpoint requested: ${pathname}`); // Log invalid endpoints
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch (error) {
    // Handle errors
    const errorResponse = {
      error: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
