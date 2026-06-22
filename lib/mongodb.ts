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
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
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
  id:            { type: String, required: true, unique: true },
  title:         { type: String, required: true },
  handle:        { type: String, required: true },
  description:   String,
  product_type:  String,
  vendor:        String,
  gender:        { type: String, enum: ["male", "female"] },
  price:         Number,
  available:     { type: Boolean, default: true },
  image_urls:    [String],
  tags:          [String],
  sizes:         [String],
  vton_category: { type: String, enum: ["upper", "lower", "one-pieces"] },
});

ProductSchema.index({ title: "text", description: "text", tags: "text", product_type: "text" });

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
