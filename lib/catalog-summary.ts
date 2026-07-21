export async function getCatalogSummary(): Promise<string> {
  if (!process.env.MONGODB_URI) return "";
  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    const total = await ProductModel.estimatedDocumentCount();
    if (total === 0) return "";

    const [womenCount, menCount, newCount, categories, brands, priceStats] = await Promise.all([
      ProductModel.countDocuments({ gender: "female" }),
      ProductModel.countDocuments({ gender: "male" }),
      ProductModel.countDocuments({ is_new: true }),
      ProductModel.distinct("product_type"),
      ProductModel.distinct("vendor"),
      ProductModel.aggregate([{ $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }]),
    ]);

    const priceMin = (priceStats as { min: number; max: number }[])[0]?.min ?? 0;
    const priceMax = (priceStats as { min: number; max: number }[])[0]?.max ?? 0;
    const catList = (categories as string[]).filter(Boolean).sort().slice(0, 14).join(", ");
    const brandList = (brands as string[]).filter(Boolean).sort().slice(0, 10).join(", ");

    return `CATALOG: ${total.toLocaleString("en-IN")} products total (${womenCount} women's, ${menCount} men's, ${newCount} new arrivals)
Categories available: ${catList}
Brands stocked: ${brandList}
Price range: ₹${priceMin.toLocaleString("en-IN")} – ₹${priceMax.toLocaleString("en-IN")}`;
  } catch {
    return "";
  }
}
