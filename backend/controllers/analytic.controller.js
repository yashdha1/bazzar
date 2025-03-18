import User from "../model/user.model.js"; 

export const getAnalytics = async (req, res) => {
  try {
    const data = await getAnalyticsData();

    const endData = new Date();
    const startDate = new Date(endData.getTime() - 7 * 24 * 60 * 60 * 1000); // getting data of the past 7 days :

    const dailySalesData = await getDailySalesData(startDate, endData);
    res.json({ data, dailySalesData });
  } catch (error) {
    console.log("Error in getAnalytics CONTROLLER");
    res.status(500).json({ error: error.message });
  }
};

// HELPER FUNCTIONS:

// getting analytics data to display:
const getAnalyticsData = async () => {
  const totalUsers = await User.countDocuments({});
  const totalProducts = await Product.countDocuments({});

  const salesData = await Order.aggregate({
    $group: {
      _id: null, // grpoup docs together
      totalSales: { $sum: 1 }, // calculate the sum of all the docs together :
      totalRevenue: { $sum: "$totalAmount" },
    },
  });
  const totalSales = salesData[0]?.totalSales || 0;
  const totalRevenue = salesData[0]?.totalRevenue || 0;

  return { totalUsers, totalProducts, totalSales, totalRevenue };
};
// getting data to plot in the graph:
const getDailySalesData = async (startDate, endDate) => {
  try {

    // creates array of data from start date to end date :
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            // group via 
            $gte: startDate, // if greater than startDate
            $lte: endDate, // if less than endDate
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = getDatesInRange(startDate, endDate); // now we have an array of all the dates in the range
    // format ['2024-08-18', '2024-08-19', ... ] 

    return dateArray.map((date) => { // finally map daily sales data to the indivisual dates : 
      const foundData = dailySalesData.find((item) => item._id === date);
      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) { 
    console.log("ERROR IN GETTING THE DAILY SALES DATA");
    throw error;
  }
};
// helper's -> helper [TO GET AN ARRAY OF ALL THE DATES BETWEEN START AND END DATE...] 
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
};