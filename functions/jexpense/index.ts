import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2"
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"

// Retrieve your Supabase URL and anon key from environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

const supabase = createClient(supabaseUrl, supabaseAnonKey)


const fetchTotalData = async () => {
  const totalIncome = 1000;
  const totalExpenses = 2000;
  const totalBalance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, totalBalance };
}

const fetchDataForCurrentDay = async () => {
  const totalIncome = 1000;
  const totalExpenses = 200;
  const totalBalance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, totalBalance };
}

const fetchDataForCurrentWeek = async () => {
  const totalIncome = 5000;
  const totalExpenses = 2000;
  const totalBalance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, totalBalance };
}

const fetchDataForCurrentMonth = async () => {
  const totalIncome = 5400;
  const totalExpenses = 3000;
  const totalBalance = totalIncome - totalExpenses;
  const remaingDays = 5;
  const dailyLimit = totalBalance / remaingDays;
  return { totalIncome, totalExpenses, totalBalance, dailyLimit };
}

const fetchDataForCurrentYear = async () => {
  const totalIncome = 10000;
  const totalExpenses = 5000;
  const totalBalance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, totalBalance };
}

const fetchTopCategoriesExpensesForYear = async () => {
  const result = {
    Loans: 1000,
    Shopping: 2000,
  }
  return result;
}

const fetchTopCategoriesExpensesForMonth = async () => {
  const result = {
    Loans: 1000,
    Shopping: 2000,
  }
  return result;
}

Deno.serve(async (req) => {
  let { pathname } = new URL(req.url)

  console.log(`Received request for: ${pathname}`); // Add logging here
  pathname = pathname.replace("/jexpense", "")
  try {

    switch (pathname) {
      case "/dashboard": {
        const totalData = await fetchTotalData();
        const todayData = await fetchDataForCurrentDay();
        const weekData = await fetchDataForCurrentWeek();
        const monthData = await fetchDataForCurrentMonth();
        const yearData = await fetchDataForCurrentYear();
        const topCategoriesMonth = await fetchTopCategoriesExpensesForMonth();
        const topCategoriesYear = await fetchTopCategoriesExpensesForYear();
        const data = {
          totalData,
          todayData,
          weekData,
          monthData,
          yearData,
          topCategoriesMonth,
          topCategoriesYear
        }
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        })
      }
      default: {
        console.log(`Invalid endpoint requested: ${pathname}`); // Log invalid endpoints
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

    }

  } catch (error) {
    // Handle errors
    const errorResponse = {
      error: error.message,
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
