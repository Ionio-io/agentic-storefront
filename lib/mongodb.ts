import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
      socketTimeoutMS: 10_000,
      maxPoolSize: 5,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn    = null;
    throw e;
  }

  return cached.conn;
}

const ProductSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  title:           { type: String, required: true },
  handle:          { type: String, required: true },
  description:     String,
  product_type:    String,
  vendor:          String,
  gender:          { type: String, enum: ["male", "female"] },
  price:           Number,
  price_override:  Number,
  available:       { type: Boolean, default: true },
  image_urls:      [String],
  tags:            [String],
  sizes:           [String],
  available_sizes: [String],
  vton_category:   { type: String, enum: ["upper", "lower", "one-pieces"] },
  main_category:   String,
  sub_category:    String,
  is_new:          { type: Boolean, default: false },
  is_featured:     { type: Boolean, default: false },
  imported_at:     Date,
  view_count:      { type: Number, default: 0 },
  last_viewed_at:  Date,
});

ProductSchema.index({ title: "text", description: "text", tags: "text", product_type: "text" });
ProductSchema.index({ is_featured: -1 });
ProductSchema.index({ is_new: 1 });
ProductSchema.index({ available_sizes: 1 });
ProductSchema.index({ last_viewed_at: 1 });

export const ProductModel =
  mongoose.models.Product ?? mongoose.model("Product", ProductSchema);

const BrandConfigSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

export const BrandConfigModel =
  mongoose.models.BrandConfig ?? mongoose.model("BrandConfig", BrandConfigSchema);

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
  lastActive:   { type: Date, default: Date.now },
  preferences: {
    gender:    { type: String, enum: ["male", "female", "all"], default: "all" },
    sizes:     [String],
    maxBudget: Number,
  },
  conversationCount: { type: Number, default: 0 },
});

// email unique:true already creates an index — only add the extra sort indexes
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActive: -1 });

export const UserModel =
  mongoose.models.User ?? mongoose.model("User", UserSchema);

const OrderSchema = new mongoose.Schema({
  orderId:   { type: String, required: true, unique: true },
  userId:    { type: String },
  items: [{
    productId: String,
    title:     String,
    size:      String,
    quantity:  Number,
    price:     Number,
    imageUrl:  String,
  }],
  shippingAddress: {
    name:    String,
    phone:   String,
    line1:   String,
    city:    String,
    state:   String,
    pincode: String,
  },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, default: "COD" },
  status:        { type: String, default: "confirmed" },
  createdAt:     { type: Date, default: Date.now },
});

export const OrderModel =
  mongoose.models.Order ?? mongoose.model("Order", OrderSchema);

const ConversationSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  messages:  [{
    role:      { type: String, enum: ["user", "assistant"] },
    content:   String,
    timestamp: Date,
  }],
  updatedAt: { type: Date, default: Date.now },
});

export const ConversationModel =
  mongoose.models.Conversation ?? mongoose.model("Conversation", ConversationSchema);

const StyleProfileSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId:    String,
  updatedAt: { type: Date, default: Date.now },
  sizeProfile: {
    top:      String,
    bottom:   String,
    ethnic:   String,
    fitPref:  String,
    height:   Number,
    weight:   Number,
    bodyShape: String,
  },
  stylePreferences: {
    colors:    [String],
    occasions: [String],
    budgetMin: Number,
    budgetMax: Number,
  },
  recentSearches:   [String],
  viewedProductIds: [String],
  savedProductIds:  [String],
  giftFinderUsed:   { type: Boolean, default: false },
});

StyleProfileSchema.index({ userId: 1 });

export const StyleProfileModel =
  mongoose.models.StyleProfile ?? mongoose.model("StyleProfile", StyleProfileSchema);

const SyncStoreSchema = new mongoose.Schema({
  storeUrl:  { type: String, required: true },
  name:      { type: String, required: true },
  schedule:  { type: String, enum: ["manual","6h","12h","24h"], default: "manual" },
  lastSync:  Date,
  lastCount: Number,
  enabled:   { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const SyncStoreModel =
  mongoose.models.SyncStore ?? mongoose.model("SyncStore", SyncStoreSchema);

const CollectionSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  slug:       { type: String, required: true, unique: true },
  description: String,
  coverImage:  String,
  productIds:  [String],
  createdAt:  { type: Date, default: Date.now },
});

export const CollectionModel =
  mongoose.models.Collection ?? mongoose.model("Collection", CollectionSchema);

const DemandSignalSchema = new mongoose.Schema({
  productId:     { type: String, required: true, unique: true },
  viewCount:     { type: Number, default: 0 },
  cartAddCount:  { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  lastReset:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

export const DemandSignalModel =
  mongoose.models.DemandSignal ?? mongoose.model("DemandSignal", DemandSignalSchema);
