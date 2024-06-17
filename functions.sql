BEGIN;

CREATE OR REPLACE FUNCTION get_current_timezone()
RETURNS TEXT AS $$
DECLARE
  tz TEXT;
BEGIN
  SELECT current_setting('TIMEZONE') INTO tz;
  RETURN tz;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_income()
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Income'), 0);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_total_expenses()
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense'), 0);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_monthly_total_income()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('month', current_date));
  last_day DATE := DATE((date_trunc('month', current_date) + interval '1 month - 1 day'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Income' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_monthly_total_expenses()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('month', current_date));
  last_day DATE := DATE((date_trunc('month', current_date) + interval '1 month - 1 day'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;


-- Function to get yearly total income
CREATE OR REPLACE FUNCTION get_yearly_total_income()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('year', current_date));
  last_day DATE := DATE((date_trunc('year', current_date) + interval '1 year - 1 day'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Income' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get yearly total expenses
CREATE OR REPLACE FUNCTION get_yearly_total_expenses()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('year', current_date));
  last_day DATE := DATE((date_trunc('year', current_date) + interval '1 year - 1 day'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;


-- Function to get weekly total income
CREATE OR REPLACE FUNCTION get_weekly_total_income()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('week', current_date));
  last_day DATE := DATE((date_trunc('week', current_date) + interval '6 days'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Income' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly total expenses
CREATE OR REPLACE FUNCTION get_weekly_total_expenses()
RETURNS NUMERIC AS $$
DECLARE
  first_day DATE := DATE(date_trunc('week', current_date));
  last_day DATE := DATE((date_trunc('week', current_date) + interval '6 days'));
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense' AND formatted_date BETWEEN first_day AND last_day), 0);
END;
$$ LANGUAGE plpgsql;


-- Function to get daily total income
CREATE OR REPLACE FUNCTION get_daily_total_income()
RETURNS NUMERIC AS $$
DECLARE
  current_day DATE := DATE(current_date);
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Income' AND formatted_date = current_day), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get daily total expenses
CREATE OR REPLACE FUNCTION get_daily_total_expenses()
RETURNS NUMERIC AS $$
DECLARE
  current_day DATE := DATE(current_date);
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense' AND formatted_date = current_day), 0);
END;
$$ LANGUAGE plpgsql;



-- RPC function for yearly top categories
CREATE OR REPLACE FUNCTION get_yearly_top_categories_expenses()
RETURNS TABLE (category TEXT, total NUMERIC) AS $$
DECLARE
  first_day DATE := DATE(date_trunc('year', current_date));
  last_day DATE := DATE((date_trunc('year', current_date) + interval '1 year - 1 day'));
BEGIN
  RETURN QUERY
  SELECT t.category, SUM(amount) AS total
  FROM transactions t
  WHERE type = 'Expense' AND formatted_date BETWEEN first_day AND last_day
  GROUP BY t.category
  ORDER BY total DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- RPC function for monthly top categories
CREATE OR REPLACE FUNCTION get_monthly_top_categories_expenses()
RETURNS TABLE (category TEXT, total NUMERIC) AS $$
DECLARE
  first_day DATE := DATE(date_trunc('month', current_date));
  last_day DATE := DATE((date_trunc('month', current_date) + interval '1 month - 1 day'));
BEGIN
  RETURN QUERY
  SELECT t.category, SUM(amount) AS total
  FROM transactions t
  WHERE type = 'Expense' AND formatted_date BETWEEN first_day AND last_day
  GROUP BY t.category
  ORDER BY total DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;


COMMIT;