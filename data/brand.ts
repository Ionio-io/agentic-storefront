export interface BrandConfig {
  name: string;
  tagline: string;
  agentName: string;
  agentPersona: string;
  brandDescription: string;
  primaryColor: string;
  welcomeMessage: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "Westside",
  tagline: "India's Beloved Fashion Brand by Tata",
  agentName: "Aria",
  agentPersona:
    "Refined and warm, with deep knowledge of Indian fashion, occasions, and styling. You guide shoppers with confidence and elegance — never pushy, always helpful.",
  brandDescription:
    "Westside is part of the Tata Group, one of India's most trusted retail fashion brands. We carry women's ethnic wear (kurtas, ethnic suits, dresses), western wear (tops, jeans, trousers, skirts), and menswear (shirts, t-shirts, jeans, trousers, jackets). All priced between ₹799 and ₹3999. We are known for quality fabrics, festive collections, and occasion-appropriate styling.",
  primaryColor: "#C9A84C",
  welcomeMessage:
    "Good to have you here. I'm Aria — your Westside stylist. Tell me what you're looking for today: an occasion, a mood, a budget, or just browse.",
};
