<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0173 RAG Training Examples

Natural-language prompts for training a RAG model on the L0173 charting
language. Each prompt is something a user might type; the model should
produce a valid L0173 program.

## Category 1: Bar charts (1–15)

1. Create a bar chart of Q1–Q4 revenue with values 320, 450, 380, 510.
2. Create a bar chart titled "Sales" with values [320, 450, 380, 510] for quarters Q1 through Q4, colored blue-500.
3. Create a bar chart of weekly sign-ups: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130.
4. Create a horizontal-feeling bar chart of top five products by units sold: A 540, B 410, C 380, D 290, E 220. Use color emerald-500.
5. Make a bar chart of website visits per day for a week, smoothed style isn't applicable — use vertical bars in indigo-600.
6. Create a stacked bar chart with two series: paid visits [50, 70, 60] and organic visits [120, 140, 130] over weeks 1–3, both stacked under group "total".
7. Bar chart with data labels visible above each bar: [10, 20, 30, 40], categories ["A","B","C","D"].
8. Bar chart of monthly revenue (in thousands) for the first six months, all positive, sized to 24-pixel bar width.
9. Bar chart with the title "Active Users" and subtitle "by region": Americas 1200, EMEA 980, APAC 1450.
10. Create a bar chart where each bar's color is amber-500 and the legend is shown at the bottom.
11. Bar chart showing quarterly net new customers: Q1 120, Q2 165, Q3 140, Q4 210. Title "New Customers", color rose-500.
12. Create a bar chart of expenses categorized as Rent 4500, Salaries 18000, Marketing 3200, Misc 800. Format the y-axis name as "USD".
13. Compare two bar series side-by-side: Revenue [320, 450, 380, 510] and Costs [200, 280, 240, 320] over Q1–Q4. Use chart wrapper with series list.
14. Bar chart with dark theme: weekday active users [1200, 1340, 1500, 1450, 1700].
15. Bar chart with category labels rotated… just put categories ["very long label one", "very long label two"] over data [100, 200]; ECharts handles rotation.

## Category 2: Line charts (16–30)

16. Create a line chart of daily visits for the past week: 1200, 1340, 1500, 1450, 1700, 1850, 1900.
17. Smooth line chart of monthly revenue (in thousands) Jan–Jun: 320, 410, 380, 510, 470, 590. Title "Revenue".
18. Step line chart: pricing tier changes at quarters Q1 (10), Q2 (15), Q3 (15), Q4 (20). Step start.
19. Line chart with area-style under the curve, blue-500 color, for engagement rate Mon–Sun: 0.12, 0.18, 0.22, 0.20, 0.25, 0.28, 0.30.
20. Multi-series line chart with Revenue [320, 450, 380, 510] and Forecast [310, 460, 400, 500] over Q1–Q4. Forecast is amber-500 and smoothed.
21. Line chart with diamond symbols at each data point, size 10. Data [50, 80, 65, 90, 110].
22. Line chart titled "Visitors per Day" with symbol circle, no smoothing. Data [1000, 1200, 1100, 1300, 1500, 1700, 1600].
23. Line chart of stock-style closing prices [120.5, 122.3, 121.8, 124.1, 125.0] for five days. Tooltip enabled.
24. Connect-nulls line chart for sparse data: [10, null, null, 25, 30, null, 50] across seven points. (Pass `connect-nulls true` once supported; for v1, fill the nulls in.)
25. Multi-series line: cost vs price over months Jan–Jun. Cost [200, 210, 220, 230, 240, 250], Price [320, 330, 325, 340, 360, 380].
26. Step line chart with step middle for usage tiers across weeks 1–8.
27. Line chart with axis labels: x-axis name "Day", y-axis name "Visitors", categories Mon–Sun.
28. Smooth line in emerald-500 color showing recovery curve [10, 25, 40, 60, 78, 92] over six weeks. Title "Recovery".
29. Two-series line chart: Predicted vs Actual sales over the year. Use color blue-500 for Predicted and amber-500 for Actual.
30. Line chart with legend at the top: Revenue series [320, 450, 380, 510], color sky-500.

## Category 3: Pie / donut / rose (31–45)

31. Create a pie chart of market share: A 40, B 35, C 25.
32. Pie chart with three slices for stocks 60, bonds 30, cash 10.
33. Donut chart with inner radius 60%, showing operating system share: Windows 45, macOS 30, Linux 15, Other 10.
34. Nightingale rose chart (rose-type radius) for weekday visits: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130.
35. Rose chart with rose-type area for budget allocation by department.
36. Pie chart titled "Revenue mix" with five product slices and a top-positioned legend.
37. Donut with inner-radius "70%" showing portfolio allocation in dark theme.
38. Pie chart of customer segments: Enterprise 50, SMB 35, Individual 15. Each slice gets a distinct Tailwind color.
39. Pie chart with start-angle 90 degrees so the largest slice begins at the top.
40. Donut with inner-radius "55%" and outer radius "85%" for survey results.
41. Pie chart of expense categories totaling 100%: Rent 25, Salaries 50, Marketing 12, Tools 8, Other 5.
42. Donut chart for vote distribution: Option A 42, Option B 31, Option C 27.
43. Rose chart (rose-type radius) showing monthly precipitation across 12 months.
44. Pie chart with legend on the right side, showing browser share.
45. Donut chart with caption-style label (use label-show true) for each slice.

## Category 4: Multi-series and dual axis (46–60)

46. Combo chart with bars for Revenue and a line for Forecast on the same axes over Q1–Q4.
47. Bar + line combo where the line is bound to a right-side y-axis (different scale).
48. Dual-axis chart: bars for Sales (USD) on left axis, line for Growth% on right axis.
49. Multi-series line chart with three lines: Actual, Budget, Forecast over months Jan–Dec.
50. Stacked bar chart with three series: Free, Pro, Enterprise sign-ups by week.
51. Bar + line dual-axis: Revenue bars on left in blue-500, Conversion line on right in amber-500, with legend top.
52. Two bar series side-by-side: 2024 vs 2025 revenue by quarter.
53. Line chart with smooth=true for Predicted and step start for Actual.
54. Chart wrapper with title, subtitle, and series list of two bars and one line.
55. Combo chart titled "Q4 Performance" with dual y-axis named "USD" and "% growth", legend at the top.
56. Multi-series bar with stack name "revenue" so the two series stack.
57. Combo chart in dark theme: bars and lines with legible Tailwind colors.
58. Multi-series chart with bar-width 16 and symbol-size 6 on the line.
59. Combo chart with tooltip true and legend bottom.
60. Two lines, one in sky-500 and another in rose-500, on the same axes.

## Category 5: Theming and palettes (61–70)

61. Bar chart in dark theme with color blue-500.
62. Pie chart in dark theme with title.
63. Line chart with palette "vintage".
64. Bar chart with palette "westeros".
65. Multi-series chart with theme dark and palette "essos".
66. Combo chart with background color slate-900 and theme dark.
67. Bar chart with width 800 and height 400.
68. Multi-series chart with animation false (no entry animations).
69. Donut chart in dark theme with inner-radius "60%" and a top legend.
70. Smooth line chart with palette "vintage" and a subtle background slate-900.
